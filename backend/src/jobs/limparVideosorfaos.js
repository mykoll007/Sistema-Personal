const fs = require("fs");
const path = require("path");
const database = require("../database/connection");

async function limparVideosorfaos() {
    try {
        console.log("🧹 Iniciando limpeza de vídeos órfãos...");

        // vídeos registrados no banco
        const videosNoBanco = await database("exercicios")
            .whereNotNull("video_url")
            .pluck("video_url");

        const videosValidos = videosNoBanco.map(v =>
            path.resolve(__dirname, "../../", v.replace(/^\/+/, ""))
        );

        const pastaVideos = path.resolve(__dirname, "../../uploads/videos");

        if (!fs.existsSync(pastaVideos)) {
            console.warn("⚠️ Pasta de vídeos não encontrada.");
            return;
        }

        const arquivos = fs.readdirSync(pastaVideos);

        for (const arquivo of arquivos) {
            const caminhoArquivo = path.join(pastaVideos, arquivo);

            if (!videosValidos.includes(caminhoArquivo)) {
                fs.unlinkSync(caminhoArquivo);
                console.log("🗑️ Vídeo órfão removido:", arquivo);
            }
        }

        console.log("✅ Limpeza finalizada");

    } catch (err) {
        console.error("❌ Erro na limpeza:", err);
        throw err;
    }
}

module.exports = limparVideosorfaos;
