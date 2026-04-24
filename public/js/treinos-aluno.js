let treinoAtualFeedback = null;
let estrelasSelecionadas = 0;

function limparDadosAluno() {
  localStorage.removeItem('tokenAluno');
  localStorage.removeItem('nomeAluno');
  localStorage.removeItem('emailAluno');
  localStorage.removeItem('dataVencimentoAluno');
  localStorage.removeItem('pagamentoMesAtual');
  localStorage.removeItem('acessoBloqueadoAluno');
  localStorage.removeItem('dataExpiracaoAcessoAluno');
}

function forcarLogout() {
  limparDadosAluno();
  window.location.replace('aluno.html?login=1');
}

function mostrarModalBloqueio(mensagem) {
  const modal = document.getElementById('bloqueioModal');
  const texto = document.getElementById('bloqueioMensagem');
  const btn = document.getElementById('bloqueioBtn');

  if (!modal || !texto || !btn) {
    alert(mensagem || 'Seu acesso está bloqueado.');
    window.location.replace('aluno.html');
    return;
  }

  texto.innerText = mensagem || 'Seu acesso está bloqueado. Aguarde a renovação do pagamento pelo professor.';
  modal.style.display = 'flex';

  btn.onclick = () => {
    window.location.replace('aluno.html');
  };
}

async function tratarRespostaBloqueioOuSessao(response) {
  if (response.status === 401) {
    forcarLogout();
    return true;
  }

  if (response.status === 403) {
    const data = await response.json().catch(() => ({}));

    if (data.acesso_bloqueado) {
      localStorage.setItem('acessoBloqueadoAluno', 'true');

      if (data.data_expiracao_acesso) {
        localStorage.setItem('dataExpiracaoAcessoAluno', data.data_expiracao_acesso);
      }

      mostrarModalBloqueio(
        data.message || 'Seu acesso expirou. Aguarde a renovação do pagamento pelo professor.'
      );

      return true;
    }

    forcarLogout();
    return true;
  }

  return false;
}

const token = localStorage.getItem('tokenAluno');

if (!token) {
  window.location.replace('aluno.html?login=1');
}

const nomeAluno = localStorage.getItem('nomeAluno');

if (nomeAluno) {
  document.getElementById('nomeAluno').innerText = nomeAluno;
}

const logoutBtn = document.getElementById('logoutBtn');

logoutBtn?.addEventListener('click', () => {
  limparDadosAluno();
  window.location.replace('aluno.html');
});

window.addEventListener('offline', () => {
  alert('Você ficou sem conexão com a internet 📡');
});

window.addEventListener('online', () => {
  console.log('Conexão restabelecida');
});

function tratarErroFetch(error) {
  if (!navigator.onLine) {
    alert('Você está sem conexão com a internet 📡');
  } else if (error instanceof TypeError) {
    alert('Você está sem conexão com a internet 📡');
  } else if (error.message) {
    alert(error.message);
  } else {
    alert('Ocorreu um erro inesperado.');
  }
}

async function carregarTreinos() {
  const loader = document.getElementById('loader-treinos');
  const container = document.getElementById('treinos-container');

  loader.style.display = 'flex';
  container.style.display = 'none';

  try {
    const response = await fetch('https://sistema-personal.vercel.app/aluno/treinos', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (await tratarRespostaBloqueioOuSessao(response)) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Erro ao buscar treinos');
    }

    const dados = await response.json();

    renderizarTreinos(dados);
    container.style.display = 'block';

    if (window.innerWidth <= 706) {
      iniciarCarrosseis();
    }
  } catch (error) {
    console.error(error);
    tratarErroFetch(error);
  } finally {
    loader.style.display = 'none';
  }
}

function renderizarTreinos(dados) {
  const container = document.getElementById('treinos-container');
  container.innerHTML = '';

  const porTreino = {};

  dados.forEach(item => {
    if (!porTreino[item.treino]) porTreino[item.treino] = {};
    if (!porTreino[item.treino][item.categoria]) porTreino[item.treino][item.categoria] = [];

    porTreino[item.treino][item.categoria].push(item);
  });

  Object.keys(porTreino).sort().forEach(letraTreino => {
    const accordion = document.createElement('div');
    accordion.classList.add('treino-accordion', `treino-${letraTreino}`);

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

    Object.keys(porTreino[letraTreino]).forEach(categoria => {
      const card = document.createElement('div');
      card.classList.add('treino-card');

      card.innerHTML = `<h4 class="categoria-titulo">${categoria}</h4>`;

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

          const obsPersonal = ex.descricao_personalizada?.trim() || '';
          const descExercicio = ex.descricao_exercicio?.trim() || '';

          item.innerHTML = `
            <div class="exercicio-header">
              <i class="fa-solid fa-dumbbell altere-icon" title="Exercício de força"></i>
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

            ${obsPersonal ? `
              <p class="descricao-label descricao-personal">
                <strong>Obs do personal:</strong> ${obsPersonal}
              </p>
            ` : ''}

            ${descExercicio ? `
              <p class="descricao-label descricao-exercicio">
                <strong>Descrição do exercício:</strong> ${descExercicio}
              </p>
            ` : ''}

            <div class="acoes-exercicio">
              ${ex.video_url ? `
                <button class="video-btn" onclick="abrirModalVideo('${ex.video_url}', '${ex.exercicio}')">
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

      const viewport = document.createElement('div');
      viewport.classList.add('carousel-viewport');
      viewport.appendChild(lista);
      card.appendChild(viewport);

      body.querySelector('.treino-body-inner').appendChild(card);
    });

    accordion.querySelector('.treino-header').addEventListener('click', () => {
      document.querySelectorAll('.treino-body.aberto').forEach(outroBody => {
        if (outroBody !== body) {
          outroBody.classList.remove('aberto');
          outroBody.previousElementSibling.classList.remove('ativo');
        }
      });

      body.classList.toggle('aberto');
      accordion.querySelector('.treino-header').classList.toggle('ativo');
    });

    container.appendChild(accordion);
  });
}

async function toggleFinalizarTreino(treinoId, botao) {
  try {
    const response = await fetch(`https://sistema-personal.vercel.app/aluno/treinos/${treinoId}/finalizar`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (await tratarRespostaBloqueioOuSessao(response)) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Erro ao atualizar treino');
    }

    const data = await response.json();

    if (data.status === 'finalizado') {
      botao.classList.add('finalizado');
      botao.innerHTML = '✅ Finalizado';

      const accordion = botao.closest('.treino-accordion');
      const match = accordion.className.match(/treino-([A-Z])/);

      if (match) verificarTreinoConcluido(match[1]);
    } else {
      botao.classList.remove('finalizado');
      botao.innerHTML = 'Finalizar';
    }
  } catch (error) {
    console.error(error);
    tratarErroFetch(error);
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
  const todosFinalizados = [...botoes].every(btn => btn.classList.contains('finalizado'));

  if (!todosFinalizados) return;

  try {
    const response = await fetch(`https://sistema-personal.vercel.app/aluno/feedbacks/pode-avaliar/${letraTreino}`, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    if (await tratarRespostaBloqueioOuSessao(response)) return;
    if (!response.ok) return;

    const data = await response.json();

    if (data.podeAvaliar) abrirModalFeedback(letraTreino);
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
  atualizarTreinoBackend(treinoId, campo, novoValor);
}

async function atualizarTreinoBackend(treinoId, campo, valor) {
  try {
    const response = await fetch(`https://sistema-personal.vercel.app/aluno/treinos/${treinoId}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ campo, valor })
    });

    if (await tratarRespostaBloqueioOuSessao(response)) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Erro ao atualizar treino');
    }
  } catch (error) {
    console.error('Erro ao salvar alteração:', error);
    tratarErroFetch(error);
  }
}

document.querySelectorAll('#starsContainer i').forEach(star => {
  star.addEventListener('click', () => {
    estrelasSelecionadas = parseInt(star.dataset.value);

    document.querySelectorAll('#starsContainer i').forEach(s => {
      const val = parseInt(s.dataset.value);
      s.className = val <= estrelasSelecionadas ? 'fa-solid fa-star' : 'fa-regular fa-star';
    });
  });
});

document.getElementById('cancelarFeedback')?.addEventListener('click', () => {
  document.getElementById('feedbackModal').style.display = 'none';
});

document.getElementById('enviarFeedback')?.addEventListener('click', async () => {
  const erro = document.getElementById('erroEstrelas');

  if (estrelasSelecionadas === 0) {
    erro.innerText = 'Selecione pelo menos 1 estrela ⭐';
    erro.style.display = 'block';
    return;
  }

  const mensagem = document.getElementById('feedbackMensagem').value;

  try {
    const response = await fetch('https://sistema-personal.vercel.app/aluno/feedbacks', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        treino: treinoAtualFeedback,
        estrelas: estrelasSelecionadas,
        mensagem
      })
    });

    if (await tratarRespostaBloqueioOuSessao(response)) return;

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.message || 'Erro ao enviar feedback');
    }

    document.getElementById('feedbackModal').style.display = 'none';
    document.getElementById('obrigadoModal').style.display = 'flex';
  } catch (error) {
    console.error(error);
    tratarErroFetch(error);
  }
});

document.getElementById('fecharObrigado')?.addEventListener('click', () => {
  document.getElementById('obrigadoModal').style.display = 'none';
});

function abrirModalVideo(videoUrl, titulo) {
  const modal = document.getElementById('videoModal');
  const video = document.getElementById('videoModalPlayer');
  const title = document.getElementById('videoModalTitulo');

  title.innerText = titulo;

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

carregarTreinos();