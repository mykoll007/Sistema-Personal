let treinoAtualFeedback = null;
let estrelasSelecionadas = 0;

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


        // ⚠️ inicializa carrosséis APÓS renderização
        if (window.innerWidth <= 706) {
            iniciarCarrosseis();
        }

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


        // Descobre o nome do treino (pega o primeiro que tiver)
        let nomeTreino = '';

        Object.values(porTreino[letraTreino]).some(lista =>
            lista.some(item => {
                if (item.nome_treino) {
                    nomeTreino = item.nome_treino;
                    return true;
                }
                return false;
            })
        );

        // Monta o título
        const tituloTreino = nomeTreino
            ? `Treino ${letraTreino} - ${nomeTreino}`
            : `Treino ${letraTreino}`;

        accordion.innerHTML = `
    <div class="treino-header">
        <h3>${tituloTreino}</h3>
        <i class="fa-solid fa-chevron-down"></i>
    </div>
    <div class="treino-body">
        <div class="treino-body-inner"></div>
    </div>
`;


        const body = accordion.querySelector('.treino-body');


        // 🔹 Dentro do treino, agrupa por categoria
        Object.keys(porTreino[letraTreino]).forEach(categoria => {
            const card = document.createElement('div');
            card.classList.add('treino-card');

            card.innerHTML = `
                <h4 class="categoria-titulo">${categoria}</h4>
            `;
            const controles = document.createElement('div');
            controles.classList.add('carousel-controls');

            controles.innerHTML = `
    <button class="carousel-prev">‹</button>
    <span class="carousel-indicator">1 / 1</span>
    <button class="carousel-next">›</button>
`;

            card.appendChild(controles);


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
                    <div class="exercicio-metricas">

                        <div class="metrica-box">
                            <span class="metrica-label">Séries</span>
                            <div class="metrica-controls">
                                <button class="btn-menos" onclick="alterarValor(${ex.id}, 'series', -1)">−</button>
                                <span id="series-${ex.id}">${ex.series}</span>
                                <button class="btn-mais" onclick="alterarValor(${ex.id}, 'series', 1)">+</button>
                            </div>
                        </div>

                        <div class="metrica-box">
                            <span class="metrica-label">Reps</span>
                            <div class="metrica-controls">
                                <button class="btn-menos" onclick="alterarValor(${ex.id}, 'repeticoes', -1)">−</button>
                                <span id="repeticoes-${ex.id}">${ex.repeticoes}</span>
                                <button class="btn-mais" onclick="alterarValor(${ex.id}, 'repeticoes', 1)">+</button>
                            </div>
                        </div>

                        <div class="metrica-box">
                            <span class="metrica-label">Peso (kg)</span>
                            <div class="metrica-controls">
                                <button class="btn-menos" onclick="alterarValor(${ex.id}, 'peso', -1)">−</button>
                                <span id="peso-${ex.id}">${ex.peso}</span>
                                <button class="btn-mais" onclick="alterarValor(${ex.id}, 'peso', 1)">+</button>
                            </div>
                        </div>

                        <div class="metrica-box">
                            <span class="metrica-label">Intervalo</span>
                            <div class="metrica-controls">
                                <button class="btn-menos" onclick="alterarValor(${ex.id}, 'intervalo_seg', -5)">−</button>
                                <span id="intervalo_seg-${ex.id}">${ex.intervalo_seg}</span>
                                <small>s</small>
                                <button class="btn-mais" onclick="alterarValor(${ex.id}, 'intervalo_seg', 5)">+</button>
                            </div>
                        </div>

                    </div>


                    ${ex.descricao ? `<p class="descricao-label">Descrição: ${ex.descricao}</p>` : ''}
                    <div class="acoes-exercicio">

                        ${ex.video_url ? `
                            <button class="video-btn"
                                onclick="abrirModalVideo('${ex.video_url}', '${ex.exercicio}')">
                                Vídeo
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
            const inner = body.querySelector('.treino-body-inner');
            inner.appendChild(card);
        });

        //  Toggle do accordion
        accordion.querySelector('.treino-header').addEventListener('click', () => {




            //  Fecha todos os outros accordions
            document.querySelectorAll('.treino-body.aberto').forEach(outroBody => {
                if (outroBody !== body) {
                    outroBody.classList.remove('aberto');
                    outroBody.previousElementSibling.classList.remove('ativo');
                }
            });

            //  Toggle do atual
            body.classList.toggle('aberto');
            accordion.querySelector('.treino-header').classList.toggle('ativo');
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

            // 1️⃣ primeiro marca como finalizado
            botao.classList.add('finalizado');
            botao.innerHTML = '✅ Finalizado';

            // 2️⃣ depois verifica se o treino inteiro terminou
            const accordion = botao.closest('.treino-accordion');
            const classes = accordion.className;
            const match = classes.match(/treino-([A-Z])/);

            if (match) {
                const letraTreino = match[1];
                verificarTreinoConcluido(letraTreino);
            }

        } else {
            botao.classList.remove('finalizado');
            botao.innerHTML = 'Finalizar';
        }

    } catch (error) {
        console.error(error);
        alert('Erro ao atualizar treino');
    }
}

function abrirModalFeedback(letraTreino) {
    treinoAtualFeedback = letraTreino;
    estrelasSelecionadas = 0;

    document.getElementById('feedbackMensagem').value = '';

    document.querySelectorAll('#starsContainer i').forEach(star => {
        star.className = 'fa-regular fa-star';
    });

    document.getElementById('feedbackModal').style.display = 'flex';
}


async function verificarTreinoConcluido(letraTreino) {
    const treinoAccordion = document.querySelector(`.treino-${letraTreino}`);
    if (!treinoAccordion) return;

    const botoes = treinoAccordion.querySelectorAll('.finalizar-btn');

    const todosFinalizados = [...botoes].every(btn =>
        btn.classList.contains('finalizado')
    );

    if (!todosFinalizados) return;

    try {
        const response = await fetch(
            `https://sistema-personal.vercel.app/aluno/feedbacks/pode-avaliar/${letraTreino}`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        if (!response.ok) return;

        const data = await response.json();

        if (data.podeAvaliar) {
            abrirModalFeedback(letraTreino);
        } else {
            console.log('Feedback já enviado hoje para este treino.');
        }

    } catch (error) {
        console.error('Erro ao verificar se pode avaliar:', error);
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

//Sistema de estrelas ⭐
document.querySelectorAll('#starsContainer i').forEach(star => {
    star.addEventListener('click', () => {
        estrelasSelecionadas = parseInt(star.dataset.value);

        document.querySelectorAll('#starsContainer i').forEach(s => {
            const val = parseInt(s.dataset.value);
            s.className =
                val <= estrelasSelecionadas
                    ? 'fa-solid fa-star'
                    : 'fa-regular fa-star';
        });
    });
});

// Fechar modal de feedback
document.getElementById('cancelarFeedback').addEventListener('click', () => {
    document.getElementById('feedbackModal').style.display = 'none';
});

// Enviar feedback

document.getElementById('enviarFeedback').addEventListener('click', async () => {

    const erro = document.getElementById('erroEstrelas');

    if (estrelasSelecionadas === 0) {
        erro.innerText = 'Selecione pelo menos 1 estrela ⭐';
        erro.style.display = 'block';
        return;
    }


    const mensagem = document.getElementById('feedbackMensagem').value;

    try {
        const response = await fetch(
            'https://sistema-personal.vercel.app/aluno/feedbacks',
            {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    treino: treinoAtualFeedback,
                    estrelas: estrelasSelecionadas,
                    mensagem: mensagem
                })
            }
        );

        if (!response.ok) {
            throw new Error('Erro ao enviar feedback');
        }

        // fecha modal de feedback
        document.getElementById('feedbackModal').style.display = 'none';

        // abre modal de agradecimento
        document.getElementById('obrigadoModal').style.display = 'flex';

    } catch (error) {
        console.error(error);
        alert('Erro ao enviar feedback');
    }
});

// Fechar modal de obrigado
document.getElementById('fecharObrigado').addEventListener('click', () => {
    document.getElementById('obrigadoModal').style.display = 'none';
});

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

function iniciarCarrosseis() {
    if (window.innerWidth > 706) return;

    document.querySelectorAll('.treino-card').forEach(card => {
        const track = card.querySelector('.exercicios-list');
        const prev = card.querySelector('.carousel-prev');
        const next = card.querySelector('.carousel-next');
        const indicator = card.querySelector('.carousel-indicator');

        if (!track || !prev || !next) return;

        const items = track.children;
        const total = items.length;
        let index = 0;

        if (total <= 1) {
            prev.style.display = 'none';
            next.style.display = 'none';
            indicator.style.display = 'none';
            return;
        }

        function update() {
            track.style.transform = `translateX(-${index * 100}%)`;
            indicator.textContent = `${index + 1} / ${total}`;
        }

        prev.onclick = () => {
            if (index > 0) {
                index--;
                update();
            }
        };

        next.onclick = () => {
            if (index < total - 1) {
                index++;
                update();
            }
        };

        update();
    });
}
// 🚀 Inicializa
carregarTreinos();
