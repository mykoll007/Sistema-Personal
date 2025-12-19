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
        const response = await fetch('https://sistema-personal.vercel.app/aluno/treinos', {
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

    // 🔹 Agrupar por treino (A–E)
    const porTreino = {};

    dados.forEach(item => {
        if (!porTreino[item.treino]) {
            porTreino[item.treino] = {};
        }

        if (!porTreino[item.treino][item.categoria]) {
            porTreino[item.treino][item.categoria] = [];
        }

        porTreino[item.treino][item.categoria].push(item);
    });

    // Ordenar treinos A → E
    Object.keys(porTreino).sort().forEach(letraTreino => {

        // Accordion container
const accordion = document.createElement('div');
accordion.classList.add('treino-accordion', `treino-${letraTreino}`);


        accordion.innerHTML = `
            <div class="treino-header">
                <h3>Treino ${letraTreino}</h3>
                <i class="fa-solid fa-chevron-down"></i>
            </div>
            <div class="treino-body" style="display: none;"></div>
        `;

        const body = accordion.querySelector('.treino-body');

        // 🔹 Dentro do treino, agrupa por categoria
        Object.keys(porTreino[letraTreino]).forEach(categoria => {
            const card = document.createElement('div');
            card.classList.add('treino-card');

            card.innerHTML = `
                <h4 class="categoria-titulo">${categoria}</h4>
            `;

            const lista = document.createElement('div');
            lista.classList.add('exercicios-list');

            porTreino[letraTreino][categoria].forEach(ex => {
                const item = document.createElement('div');
                item.classList.add('exercicio-item');

                item.innerHTML = `
                        <div class="exercicio-header">
<i class="fa-solid fa-dumbbell altere-icon"
   title="Exercício de força"></i>

    </div>
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
            body.appendChild(card);
        });

        // 🔽 Toggle do accordion
        accordion.querySelector('.treino-header').addEventListener('click', () => {
            body.style.display = body.style.display === 'none' ? 'block' : 'none';
        });

        container.appendChild(accordion);
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
        : `https://sistema-personal.vercel.app${videoUrl}?t=${Date.now()}`;

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
