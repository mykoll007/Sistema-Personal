const database = require('../database/connection');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');



class AlunoController {

    // Autenticar aluno
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
                process.env.SALT, // mesma chave do seu backend
                { expiresIn: '1h' }
            );

            return res.status(200).json({ token, nome: aluno.nome, email: aluno.email});

        } catch (error) {
            console.error("Erro ao autenticar aluno:", error);
            return res.status(500).json({ message: "Erro ao tentar autenticar." });
        }
    }

    // Buscar treinos do aluno logado
    async listarTreinos(req, res) {
        const alunoId = req.alunoId;

        try {
            const rows = await database('aluno_treinos')
                .join('exercicios', 'aluno_treinos.exercicio_id', 'exercicios.id')
                .join('categorias', 'exercicios.categoria_id', 'categorias.id')
                .select(
                    'aluno_treinos.treino',
                    'categorias.nome as categoria',
                    'exercicios.nome as exercicio',
                    'exercicios.video_url',
                    'aluno_treinos.series',
                    'aluno_treinos.repeticoes',
                    'aluno_treinos.peso',
                    'aluno_treinos.intervalo_seg'
                )
                .where('aluno_treinos.aluno_id', alunoId)
                .orderBy('categorias.nome');

            return res.json(rows);

        } catch (error) {
            console.error(error);
            return res.status(500).json({ message: 'Erro ao buscar treinos' });
        }
    }




}

module.exports = new AlunoController();