const jwt = require('jsonwebtoken');

function verificarPersonal(request, response, next) {
    const token = request.header("Authorization")?.split(" ")[1];
  

    if (!token) {
        return response.status(401).json({ message: "Acesso não autorizado! Token não fornecido." });
    }

    try {
        const decodificado = jwt.verify(token, process.env.SALT);


        request.personalId = decodificado.personal_id;
        next();
    } catch (error) {
        console.log("Erro no token:", error.message);
        return response.status(401).json({ message: "Token inválido ou expirado." });
    }
}


module.exports = verificarPersonal;
