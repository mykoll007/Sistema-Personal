const knex = require('knex')({
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    port: process.env.DB_PORT
  },
  pool: { min: 0, max: 10 } // pool ajuda a não abrir/fechar conexões sempre
});

module.exports = knex;
