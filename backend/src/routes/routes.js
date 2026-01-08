const connection = require('../database/connection')
const { uploadFoto, uploadVideo } = require('../config/cloudinaryStorage');


const PersonalController = require('../controllers/PersonalController');
const AlunoController = require('../controllers/AlunoController');
const verificarPersonal = require('../middleware/authmiddleware');
const authAluno = require('../middleware/authAluno');
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
router.put('/aluno/treinos/:treinoId/finalizar', authAluno, AlunoController.finalizarTreino);
router.put('/aluno/treinos/:treinoId', authAluno, AlunoController.atualizarCargaTreino);
router.post('/aluno/feedbacks', authAluno, AlunoController.enviarFeedback);
router.get('/aluno/feedbacks/pode-avaliar/:treino', authAluno, AlunoController.podeAvaliar);



module.exports = router;
