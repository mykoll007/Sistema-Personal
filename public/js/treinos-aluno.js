// 🔐 Proteção da página
const token = localStorage.getItem('tokenAluno');

if (!token) {
    window.location.replace('aluno.html');
}

const nomeAluno = localStorage.getItem('nomeAluno');

if (nomeAluno) {
    document.getElementById('nomeAluno').innerText = nomeAluno;
}

/* Logout */
const logoutBtn = document.getElementById('logoutBtn');

logoutBtn.addEventListener('click', () => {
    localStorage.removeItem('tokenAluno');
    window.location.replace('aluno.html');
});

/* ============================= */
/* Buscar treinos do backend */
/* ============================= */

async function carregarTreinos() {
    try {
        const response = await fetch('sistema-personal.vercel.app/aluno/treinos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Erro ao buscar treinos');
        }

        const dados = await response.json();
        renderizarTreinos(dados);

    } catch (error) {
        console.error(error);
        alert('Erro ao carregar treinos');
    }
}

/* ============================= */
/* Renderização */
/* ============================= */

function renderizarTreinos(dados) {
    const container = document.getElementById('treinos-container');
    container.innerHTML = '';

    const agrupado = {};

    // Agrupa por categoria
    dados.forEach(item => {
        if (!agrupado[item.categoria]) {
            agrupado[item.categoria] = [];
        }
        agrupado[item.categoria].push(item);
    });

    Object.keys(agrupado).forEach(categoria => {
        const card = document.createElement('div');
        card.classList.add('treino-card');

card.innerHTML = `
    <h3 class="categoria-titulo">${categoria}</h3>
    <div class="categoria-icone">
        <i class="fa-solid fa-dumbbell"></i>
    </div>
`;

        const lista = document.createElement('div');
        lista.classList.add('exercicios-list');

        agrupado[categoria].forEach(ex => {
            const item = document.createElement('div');
            item.classList.add('exercicio-item');

            item.innerHTML = `
                <strong>${ex.exercicio}</strong>
                <p>Séries: ${ex.series}</p>
                <p>Repetições: ${ex.repeticoes}</p>
                <p>Peso: ${ex.peso}kg</p>
                <p>Intervalo: ${ex.intervalo_seg}s</p>
                ${ex.video_url ? `
                <button class="video-btn"
                onclick="abrirModalVideo('${ex.video_url}', '${ex.exercicio}')">
                Assistir Vídeo
                </button>
` : ''}

            `;

            lista.appendChild(item);
        });

        card.appendChild(lista);
        container.appendChild(card);
    });
}

/* ============================= */
/* MODAL VÍDEO */
/* ============================= */

function abrirModalVideo(videoUrl, titulo) {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('videoModalPlayer');
    const title = document.getElementById('videoModalTitulo');

    title.innerText = titulo;

    // Se a URL começar com http, usa direto, senão concatena com localhost
    video.src = videoUrl.startsWith('http')
        ? videoUrl
        : `sistema-personal.vercel.app${videoUrl}?t=${Date.now()}`;

    video.load();
    modal.style.display = 'flex';
}


function fecharModalVideo() {
    const modal = document.getElementById('videoModal');
    const video = document.getElementById('videoModalPlayer');

    video.pause();
    video.removeAttribute('src');
    video.load();

    modal.style.display = 'none';
}


// 🚀 Inicializa
carregarTreinos();
