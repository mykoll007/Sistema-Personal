const express = require('express');
const cors = require('cors');
const path = require('path');
const router = require('./src/routes/routes');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(router);

app.get('/', (req, res) => {
  res.send('Servidor funcionando e pronto para o Vercel.');
});

// Exporta o app para o Vercel
module.exports = app;
