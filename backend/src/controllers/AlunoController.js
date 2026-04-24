const database = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

function criarDataLocal(dataStr) {
    if (!dataStr) return null;

    const dataLimpa = String(dataStr).split('T')[0];
    const partes = dataLimpa.split('-');

    if (partes.length !== 3) return null;

    const ano = Number(partes[0]);
    const mes = Number(partes[1]) - 1;
    const dia = Number(partes[2]);

    const data = new Date(ano, mes, dia);
    data.setHours(0, 0, 0, 0);

    return isNaN(data.getTime()) ? null : data;
}

function adicionarDias(data, dias) {
    const nova = new Date(data);
    nova.setDate(nova.getDate() + dias);
    nova.setHours(0, 0, 0, 0);
    return nova;
}

function verificarAcessoAluno(dataVencimento) {
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    const vencimento = criarDataLocal(dataVencimento);

    if (!vencimento) {
        return {
            acesso_bloqueado: false,
            data_expiracao_acesso: null
        };
    }

    const limiteAcesso = adicionarDias(vencimento, 5);

    return {
        acesso_bloqueado: hoje > limiteAcesso,
        data_expiracao_acesso: limiteAcesso.toISOString().split('T')[0]
    };
}

class AlunoController {

    async autenticarAluno(req, res) {
        const { email, senha } = req.body;

        if (!email || !senha) {
            return res.status(400).json({ message: "Email e senha são obrigatórios." });
        }

        try {
            const aluno = await database('alunos')
                .where({ email })
                .first();

            if (!aluno) {
                return res.status(401).json({ message: "Email ou senha incorretos." });
            }

            const validarSenha = await bcrypt.compare(senha, aluno.senha);

            if (!validarSenha) {
                return res.status(401).json({ message: "Email ou senha incorretos." });
            }

            const token = jwt.sign(
                { aluno_id: aluno.id },
                process.env.SALT,
                { expiresIn: '1h' }
            );

            const hoje = new Date();
            const referencia_mes = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`;

            const pagamentoMesAtual = await database('aluno_pagamentos')
                .where({
                    aluno_id: aluno.id,
                    referencia_mes,
                    status: 'pago'
                })
                .first();

            const acesso = verificarAcessoAluno(aluno.data_vencimento);

            return res.status(200).json({
                token,
                nome: aluno.nome,
                email: aluno.email,
                data_matricula: aluno.data_matricula,
                data_vencimento: aluno.data_vencimento,
                pagamento_mes_atual: !!pagamentoMesAtual,
                acesso_bloqueado: acesso.acesso_bloqueado,
                data_expiracao_acesso: acesso.data_expiracao_acesso
            });

        } catch (error) {
            console.error("Erro ao autenticar aluno:", error);
            return res.status(500).json({ message: "Erro ao tentar autenticar." });
        }
    }

    async verificarBloqueioDoAluno(alunoId) {
        const aluno = await database('alunos')
            .where({ id: alunoId })
            .first();

        if (!aluno) {
            return {
                bloqueado: true,
                status: 404,
                message: "Aluno não encontrado.",
                data_expiracao_acesso: null
            };
        }

        const acesso = verificarAcessoAluno(aluno.data_vencimento);

        if (acesso.acesso_bloqueado) {
            return {
                bloqueado: true,
                status: 403,
                message: `Seu acesso expirou em ${acesso.data_expiracao_acesso}. Aguarde a renovação do pagamento pelo professor.`,
                data_expiracao_acesso: acesso.data_expiracao_acesso
            };
        }

        return {
            bloqueado: false
        };
    }

    async listarTreinos(req, res) {
        const alunoId = req.alunoId;

        try {
            const bloqueio = await this.verificarBloqueioDoAluno(alunoId);

            if (bloqueio.bloqueado) {
                return res.status(bloqueio.status).json({
                    message: bloqueio.message,
                    acesso_bloqueado: true,
                    data_expiracao_acesso: bloqueio.data_expiracao_acesso
                });
            }

            await database('aluno_treinos')
                .where('status', 'finalizado')
                .where('finalizado_em', '<', database.raw('NOW() - INTERVAL 1 DAY'))
                .update({
                    status: 'em_andamento',
                    finalizado_em: null
                });

            const rows = await database('aluno_treinos')
                .join('exercicios', 'aluno_treinos.exercicio_id', 'exercicios.id')
                .join('categorias', 'exercicios.categoria_id', 'categorias.id')
                .select(
                    'aluno_treinos.id',
                    'aluno_treinos.treino',
                    'aluno_treinos.nome_treino',
                    'aluno_treinos.ordem',
                    'categorias.nome as categoria',
                    'exercicios.nome as exercicio',
                    'exercicios.video_url',
                    'aluno_treinos.series',
                    'aluno_treinos.repeticoes',
                    'aluno_treinos.peso',
                    'aluno_treinos.intervalo_seg',
                    'aluno_treinos.descricao as descricao_personalizada',
                    'exercicios.descricao as descricao_exercicio',
                    'aluno_treinos.status',
                    'aluno_treinos.finalizado_em'
                )
                .where('aluno_treinos.aluno_id', alunoId)
                .orderBy('aluno_treinos.treino')
                .orderBy('aluno_treinos.ordem');

            return res.json(rows);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar treinos' });
        }
    }

    async finalizarTreino(req, res) {
        const alunoId = req.alunoId;
        const { treinoId } = req.params;

        try {
            const bloqueio = await this.verificarBloqueioDoAluno(alunoId);

            if (bloqueio.bloqueado) {
                return res.status(bloqueio.status).json({
                    message: bloqueio.message,
                    acesso_bloqueado: true,
                    data_expiracao_acesso: bloqueio.data_expiracao_acesso
                });
            }

            const treino = await database('aluno_treinos')
                .where({
                    id: treinoId,
                    aluno_id: alunoId
                })
                .first();

            if (!treino) {
                return res.status(404).json({ message: 'Treino não encontrado' });
            }

            if (treino.status === 'finalizado') {
                await database('aluno_treinos')
                    .where('id', treinoId)
                    .update({
                        status: 'em_andamento',
                        finalizado_em: null
                    });

                return res.json({ status: 'em_andamento' });
            }

            await database('aluno_treinos')
                .where('id', treinoId)
                .update({
                    status: 'finalizado',
                    finalizado_em: database.fn.now()
                });

            return res.json({ status: 'finalizado' });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao atualizar treino' });
        }
    }

    async atualizarCargaTreino(req, res) {
        const alunoId = req.alunoId;
        const { treinoId } = req.params;
        const { campo, valor } = req.body;

        const camposPermitidos = ['series', 'repeticoes', 'peso', 'intervalo_seg'];

        if (!camposPermitidos.includes(campo)) {
            return res.status(400).json({ message: 'Campo inválido' });
        }

        try {
            const bloqueio = await this.verificarBloqueioDoAluno(alunoId);

            if (bloqueio.bloqueado) {
                return res.status(bloqueio.status).json({
                    message: bloqueio.message,
                    acesso_bloqueado: true,
                    data_expiracao_acesso: bloqueio.data_expiracao_acesso
                });
            }

            const linhasAfetadas = await database('aluno_treinos')
                .where({
                    id: treinoId,
                    aluno_id: alunoId
                })
                .update({
                    [campo]: valor
                });

            if (linhasAfetadas === 0) {
                return res.status(404).json({
                    message: 'Treino não encontrado ou não pertence ao aluno'
                });
            }

            return res.json({ success: true });

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao atualizar treino' });
        }
    }

    async enviarFeedback(req, res) {
        const alunoId = req.alunoId;
        const { estrelas, mensagem, treino } = req.body;

        if (!estrelas || !treino) {
            return res.status(400).json({
                message: 'Estrelas e treino são obrigatórios'
            });
        }

        try {
            const bloqueio = await this.verificarBloqueioDoAluno(alunoId);

            if (bloqueio.bloqueado) {
                return res.status(bloqueio.status).json({
                    message: bloqueio.message,
                    acesso_bloqueado: true,
                    data_expiracao_acesso: bloqueio.data_expiracao_acesso
                });
            }

            const aluno = await database('alunos')
                .select('personal_id')
                .where('id', alunoId)
                .first();

            if (!aluno) {
                return res.status(404).json({ message: 'Aluno não encontrado' });
            }

            const hoje = new Date().toISOString().slice(0, 10);

            const jaExiste = await database('feedbacks')
                .where({
                    aluno_id: alunoId,
                    treino: treino
                })
                .where('criado_em', '>=', `${hoje} 00:00:00`)
                .first();

            if (jaExiste) {
                return res.status(409).json({
                    message: 'Feedback já enviado para esse treino hoje'
                });
            }

            await database('feedbacks').insert({
                aluno_id: alunoId,
                personal_id: aluno.personal_id,
                estrelas,
                mensagem: mensagem || null,
                treino
            });

            return res.status(201).json({ success: true });

        } catch (error) {
            console.error('Erro ao salvar feedback:', error);
            return res.status(500).json({ message: 'Erro ao salvar feedback' });
        }
    }

    async podeAvaliar(req, res) {
        const alunoId = req.alunoId;
        const { treino } = req.params;

        try {
            const bloqueio = await this.verificarBloqueioDoAluno(alunoId);

            if (bloqueio.bloqueado) {
                return res.status(bloqueio.status).json({
                    message: bloqueio.message,
                    acesso_bloqueado: true,
                    data_expiracao_acesso: bloqueio.data_expiracao_acesso
                });
            }

            const hoje = new Date().toISOString().slice(0, 10);

            const jaExiste = await database('feedbacks')
                .where({
                    aluno_id: alunoId,
                    treino: treino
                })
                .where('criado_em', '>=', `${hoje} 00:00:00`)
                .first();

            return res.json({
                podeAvaliar: !jaExiste
            });

        } catch (error) {
            console.error('Erro ao verificar feedback:', error);
            return res.status(500).json({ message: 'Erro ao verificar feedback' });
        }
    }
}

module.exports = new AlunoController();