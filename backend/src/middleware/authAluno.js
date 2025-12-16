const jwt = require('jsonwebtoken');

module.exports = function authAluno(req, res, next) {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ message: 'Token não fornecido' });
    }

    const [, token] = authHeader.split(' ');

    try {
        const decoded = jwt.verify(token, process.env.SALT);
        req.alunoId = decoded.aluno_id; // salva o id do aluno
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido ou expirado' });
    }
};
