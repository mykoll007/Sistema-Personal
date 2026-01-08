const database = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

class AlunoController {

    // =========================
    // Autenticar aluno
    // =========================
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

            return res.status(200).json({
                token,
                nome: aluno.nome,
                email: aluno.email
            });

        } catch (error) {
            console.error("Erro ao autenticar aluno:", error);
            return res.status(500).json({ message: "Erro ao tentar autenticar." });
        }
    }

    // =========================
    // Buscar treinos do aluno
    // =========================

    async listarTreinos(req, res) {
        const alunoId = req.alunoId;

        try {
            // 🔁 RESET AUTOMÁTICO (24h)
            await database('aluno_treinos')
                .where('status', 'finalizado')
                .where('finalizado_em', '<', database.raw('NOW() - INTERVAL 1 DAY'))
                .update({
                    status: 'em_andamento',
                    finalizado_em: null
                });

            // 📥 BUSCAR TREINOS
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
                    'exercicios.descricao',
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

    // =========================
    // Finalizar treino
    // =========================
    async finalizarTreino(req, res) {
        const alunoId = req.alunoId;
        const { treinoId } = req.params;

        try {
            const treino = await database('aluno_treinos')
                .where({
                    id: treinoId,
                    aluno_id: alunoId
                })
                .first();

            if (!treino) {
                return res.status(404).json({ message: 'Treino não encontrado' });
            }

            // 🔁 TOGGLE
            if (treino.status === 'finalizado') {
                await database('aluno_treinos')
                    .where('id', treinoId)
                    .update({
                        status: 'em_andamento',
                        finalizado_em: null
                    });

                return res.json({ status: 'em_andamento' });
            }

            // se estiver em andamento
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

    // =========================
    // Aluno atualizar os treinos
    // =========================

   async atualizarCargaTreino(req, res) {
    const alunoId = req.alunoId;
    const { treinoId } = req.params;
    const { campo, valor } = req.body;

    const camposPermitidos = ['series', 'repeticoes', 'peso', 'intervalo_seg'];

    if (!camposPermitidos.includes(campo)) {
        return res.status(400).json({ message: 'Campo inválido' });
    }

    try {
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

// =========================
// Enviar feedback do aluno
// =========================
async enviarFeedback(req, res) {
    const alunoId = req.alunoId;
    const { estrelas, mensagem, treino } = req.body;

    if (!estrelas || !treino) {
        return res.status(400).json({
            message: 'Estrelas e treino são obrigatórios'
        });
    }

    try {
        // 🔎 Descobre o personal responsável
        const aluno = await database('alunos')
            .select('personal_id')
            .where('id', alunoId)
            .first();

        if (!aluno) {
            return res.status(404).json({ message: 'Aluno não encontrado' });
        }

        // 📅 evita duplicidade no mesmo dia
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

        // 💾 Salvar feedback
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

// =========================
// Verifica se ja foi avaliado no dia
// =========================
async podeAvaliar(req, res) {
    const alunoId = req.alunoId;
    const { treino } = req.params;

    const hoje = new Date().toISOString().slice(0, 10);

    try {
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
