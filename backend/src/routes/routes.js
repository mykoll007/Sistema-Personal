const connection = require('../database/connection')
const limparVideosOrfaos = require('../jobs/limparVideosorfaos');

const PersonalController = require('../controllers/PersonalController');
const AlunoController = require('../controllers/AlunoController');
const verificarPersonal = require('../middleware/authmiddleware');
const authAluno = require('../middleware/authAluno');
const uploadVideo = require('../config/uploadVideo');
const uploadFoto = require('../config/uploadFoto');
const express = require('express');
const router = express.Router();

// 📌 Rotas do Personal
router.post('/personal/cadastrar', PersonalController.cadastrarPersonal);
router.post('/personal/login', PersonalController.autenticarPersonal);
router.get('/ver-personal/', PersonalController.listarPersonals);
router.get('/personall/:id', verificarPersonal, PersonalController.listarUmPersonal);
router.put('/personal/:id', verificarPersonal, PersonalController.atualizarPersonal);

// Rota para retornar o personal logado (token obrigatório)
router.get('/personal/logado', verificarPersonal, PersonalController.listarPersonalLogado);

router.post('/personal/alunos', verificarPersonal, PersonalController.adicionarAluno);
router.get('/personal/alunos', verificarPersonal, PersonalController.listarAlunos);
router.put('/personal/alunos/:id', verificarPersonal, PersonalController.editarAluno);
router.delete('/personal/alunos/:id', verificarPersonal, PersonalController.excluirAluno);

router.post('/personal/alunos/treino', verificarPersonal, PersonalController.adicionarExercicioAoAluno);
router.get('/personal/alunos/:id/treinos', verificarPersonal, PersonalController.listarTreinosDoAluno);
router.delete('/personal/alunos/treino/:aluno_id/:exercicio_id', verificarPersonal, PersonalController.deletarTreinoDoAluno);
router.post('/personal/alunos/treinos/salvar', verificarPersonal, PersonalController.salvarTreinosDoAluno);





// 📌 Rota protegida — precisa do token!
router.post('/personal/exercicios', verificarPersonal, PersonalController.criarExercicio);
router.get('/personal/exercicios', verificarPersonal, PersonalController.listarExercicios);
router.get('/personal/exercicios/categoria/:categoria_id', verificarPersonal, PersonalController.listarExerciciosPorCategoria);
router.put('/personal/exercicios/:id', verificarPersonal, PersonalController.atualizarExercicio);
router.delete('/personal/exercicios/:id', verificarPersonal, PersonalController.deletarExercicio);

router.post('/personal/categorias', verificarPersonal, PersonalController.criarCategoria);
router.get('/personal/categorias', verificarPersonal, PersonalController.listarCategorias);
router.put('/personal/categorias/:id', verificarPersonal, PersonalController.atualizarCategoria);
router.delete('/personal/categorias/:id', verificarPersonal, PersonalController.deletarCategoria);

//Rota para subir imagens e videos
router.post('/personal/upload-foto', verificarPersonal, uploadFoto.single('foto'), PersonalController.uploadFoto);
router.put('/personal/exercicios/:id/video', verificarPersonal, uploadVideo.single('video'), PersonalController.uploadVideoExercicio);


//Controllers do Aluno
router.post('/aluno/login', AlunoController.autenticarAluno);
router.get('/aluno/treinos', authAluno, AlunoController.listarTreinos);

// ================================
// 🔁 CRON – Limpeza de vídeos órfãos
// ================================

router.get('/cron/limpar-videos', async (req, res) => {
    const secret = req.headers['x-cron-secret'];

    if (secret !== process.env.CRON_SECRET) {
        return res.status(401).json({ message: 'Não autorizado' });
    }

    try {
        await limparVideosOrfaos();
        res.json({ ok: true });
    } catch {
        res.status(500).json({ error: 'Erro ao executar limpeza' });
    }
});


module.exports = router;
