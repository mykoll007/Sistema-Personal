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
    const loader = document.getElementById('loader-treinos');
    const container = document.getElementById('treinos-container');

    loader.style.display = 'block';
    container.style.display = 'none';

    try {
        const response = await fetch('https://sistema-personal.vercel.app/aluno/treinos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (response.status === 401 || response.status === 403) {
            localStorage.removeItem('tokenAluno');
            localStorage.removeItem('nomeAluno');
            window.location.replace('aluno.html');
            return;
        }

        if (!response.ok) {
            throw new Error('Erro ao buscar treinos');
        }

        const dados = await response.json();

        renderizarTreinos(dados);

        // ✅ Mostra treinos
        container.style.display = 'block';

    } catch (error) {
        console.error(error);
        alert('Erro ao carregar treinos');
    } finally {
        // 🔄 Sempre esconde o loader
        loader.style.display = 'none';
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
            porTreino[letraTreino][categoria]
                .sort((a, b) => (a.ordem || 999) - (b.ordem || 999))
                .forEach(ex => {
                    const item = document.createElement('div');
                    item.classList.add('exercicio-item');

                    item.innerHTML = `
                    <div class="exercicio-header">
                        <i class="fa-solid fa-dumbbell altere-icon"
                        title="Exercício de força"></i>
                    </div>
                    <strong>${ex.exercicio}</strong>
                    <p>
                    Séries:
                    <button class="btn-menos" onclick="alterarValor(${ex.id}, 'series', -1)">−</button>
                    <span id="series-${ex.id}">${ex.series}</span>
                    <button class="btn-mais" onclick="alterarValor(${ex.id}, 'series', 1)">+</button>
                    </p>
                    <p>
                    Repetições:
                    <button class="btn-menos" onclick="alterarValor(${ex.id}, 'repeticoes', -1)">−</button>
                    <span id="repeticoes-${ex.id}">${ex.repeticoes}</span>
                    <button class="btn-mais"onclick="alterarValor(${ex.id}, 'repeticoes', 1)">+</button>
                    </p>

                    <p>
                    Peso:
                    <button class="btn-menos" onclick="alterarValor(${ex.id}, 'peso', -1)">−</button>
                    <span id="peso-${ex.id}">${ex.peso}</span>kg
                    <button class="btn-mais" onclick="alterarValor(${ex.id}, 'peso', 1)">+</button>
                    </p>

                    <p>
                    Intervalo:
                    <button class="btn-menos" onclick="alterarValor(${ex.id}, 'intervalo_seg', -10)">−</button>
                    <span id="intervalo_seg-${ex.id}">${ex.intervalo_seg}</span>s
                    <button class="btn-mais"onclick="alterarValor(${ex.id}, 'intervalo_seg', 10)">+</button>
                    </p>

                    ${ex.descricao ? `<p>Descrição: ${ex.descricao}</p>` : ''}
                    <div class="acoes-exercicio">

                        ${ex.video_url ? `
                            <button class="video-btn"
                                onclick="abrirModalVideo('${ex.video_url}', '${ex.exercicio}')">
                                Assistir Vídeo
                            </button>
                        ` : ''}

                        <button class="finalizar-btn ${ex.status === 'finalizado' ? 'finalizado' : ''}"
                            onclick="toggleFinalizarTreino(${ex.id}, this)">
                            ${ex.status === 'finalizado' ? '✅ Finalizado' : 'Finalizar'}
                        </button>

                    </div>


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
async function toggleFinalizarTreino(treinoId, botao) {
    try {
        const response = await fetch(
            `https://sistema-personal.vercel.app/aluno/treinos/${treinoId}/finalizar`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao atualizar treino');
        }

        const data = await response.json();

        if (data.status === 'finalizado') {
            botao.classList.add('finalizado');
            botao.innerHTML = '✅ Finalizado';
        } else {
            botao.classList.remove('finalizado');
            botao.innerHTML = 'Finalizar';
        }

    } catch (error) {
        console.error(error);
        alert('Erro ao atualizar treino');
    }
}


function alterarValor(treinoId, campo, delta) {
    const span = document.getElementById(`${campo}-${treinoId}`);

    if (!span) return;

    let valorAtual = parseInt(span.innerText, 10);
    let novoValor = valorAtual + delta;

    if (novoValor < 0) novoValor = 0;

    span.innerText = novoValor;

    // ✅ SALVA NO BACKEND
    atualizarTreinoBackend(treinoId, campo, novoValor);
}


async function atualizarTreinoBackend(treinoId, campo, valor) {
    try {
        const response = await fetch(
            `https://sistema-personal.vercel.app/aluno/treinos/${treinoId}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    campo: campo,
                    valor: valor
                })
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao atualizar treino');
        }

    } catch (error) {
        console.error('Erro ao salvar alteração:', error);
    }
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
