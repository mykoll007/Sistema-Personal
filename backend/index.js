const express = require('express');
const cors = require('cors');
const mysql = require('mysql2'); 
const path = require('path');
require('dotenv').config();



const router = require('./src/routes/routes');

const app = express();

app.use(cors());


// Serve arquivos da pasta uploads como públicos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));


app.use(router);

// Criar conexão MySQL
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
});

// Testar conexão
db.connect((err) => {
    if (err) {
        console.error("❌ Erro ao conectar ao MySQL:", err.message);
    } else {
        console.log("✅ Conectado ao MySQL com sucesso!");
    }
});

// Rota teste
app.get('/', (req, res) => {
  res.send('Servidor funcionando e tentando conectar ao MySQL.');
});

// Porta
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
});
