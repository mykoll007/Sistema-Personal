const limparVideosorfaos = require("../../src/jobs/limparVideosorfaos");

module.exports = async (req, res) => {
  try {
    await limparVideosorfaos();
    res.status(200).send("Limpeza finalizada com sucesso");
  } catch (err) {
    res.status(500).send("Erro ao limpar vídeos");
  }
};
