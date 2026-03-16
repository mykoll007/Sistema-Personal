/* ===================== */
/* Hamburger */
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const menuOverlay = document.getElementById('menuOverlay');

function abrirMenu() {
  hamburger.classList.add('active');
  navMenu.classList.add('open');
  document.body.classList.add('menu-open');
}

function fecharMenu() {
  hamburger.classList.remove('active');
  navMenu.classList.remove('open');
  document.body.classList.remove('menu-open');
}

hamburger?.addEventListener('click', () => {
  const aberto = navMenu.classList.contains('open');
  if (aberto) fecharMenu();
  else abrirMenu();
});

menuOverlay?.addEventListener('click', fecharMenu);

navMenu?.querySelectorAll('a').forEach(a => {
  a.addEventListener('click', fecharMenu);
});


/* ===================== */
/* Hero Carousel */
const trackHero = document.querySelector('.carousel-track-hero');
const itemsHero = document.querySelectorAll('.carousel-item-hero');
const prevHero = document.querySelector('.prev-hero');
const nextHero = document.querySelector('.next-hero');

let indexHero = 0;
let autoPlayInterval;
let autoPlayTimeout;

function updateCarouselHero() {
  if (!trackHero) return;
  trackHero.style.transform = `translateX(${-indexHero * 100}%)`;
}

/* ===== AUTOPLAY ===== */
function startAutoplay() {
  if (!itemsHero || itemsHero.length <= 1) return;

  clearInterval(autoPlayInterval);
  autoPlayInterval = setInterval(() => {
    indexHero = (indexHero + 1) % itemsHero.length;
    updateCarouselHero();
  }, 4000);
}

function stopAutoplayTemporario() {
  clearInterval(autoPlayInterval);
  clearTimeout(autoPlayTimeout);

  autoPlayTimeout = setTimeout(() => {
    startAutoplay();
  }, 3000);
}

/* ===== SETAS ===== */
prevHero?.addEventListener('click', () => {
  if (!itemsHero || itemsHero.length <= 1) return;
  indexHero = (indexHero - 1 + itemsHero.length) % itemsHero.length;
  updateCarouselHero();
  stopAutoplayTemporario();
});

nextHero?.addEventListener('click', () => {
  if (!itemsHero || itemsHero.length <= 1) return;
  indexHero = (indexHero + 1) % itemsHero.length;
  updateCarouselHero();
  stopAutoplayTemporario();
});

/* ===== INICIA ===== */
startAutoplay();


/* ===================== */
/* Modal Login */
const loginBtn = document.querySelector('.login-btn');
const modal = document.getElementById('loginModal');
const closeModal = document.querySelector('.modal .close');

function abrirModal() {
  if (!modal) return;
  modal.classList.add('show');
  modal.style.display = 'flex';
}

function fecharModal() {
  if (!modal) return;
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
}

closeModal?.addEventListener('click', fecharModal);

window.addEventListener('click', (e) => {
  if (e.target === modal) fecharModal();
});


/* ===================== */
/* Toast */
function showToast(titulo, mensagem, duracao = 2500) {
  const toastTitle = document.getElementById('toastTitle');
  const toastBody = document.getElementById('toastBody');
  const toastElement = document.getElementById('toastMessage');

  if (!toastTitle || !toastBody || !toastElement) return;

  toastTitle.innerText = titulo;
  toastBody.innerText = mensagem;
  toastElement.classList.add('show');

  setTimeout(() => {
    toastElement.classList.remove('show');
  }, duracao);
}


/* ===================== */
/* Atualiza nome do aluno */
function atualizarNomeAluno() {
  const el = document.querySelector('.user-name');
  const nome = localStorage.getItem('nomeAluno');

  if (el) el.textContent = nome || 'Aluno';
}

function atualizarFormasPagamento() {
  const token = localStorage.getItem('tokenAluno');
  const section = document.getElementById('paymentMethodsSection');

  if (!section) return;

  section.style.display = token ? 'block' : 'none';
}

function configurarCopiaPix() {
  const btn = document.getElementById('copyPixBtn');
  const pixKeyEl = document.getElementById('pixKey');

  if (!btn || !pixKeyEl) return;

  btn.addEventListener('click', async () => {
    const token = localStorage.getItem('tokenAluno');
    if (!token) return;

    const chavePix = pixKeyEl.textContent.trim();

    try {
      await navigator.clipboard.writeText(chavePix);
      showToast('PIX copiado', 'A chave PIX foi copiada com sucesso!', 3000);
    } catch (error) {
      console.error('Erro ao copiar PIX:', error);
      showToast('Erro', 'Não foi possível copiar a chave PIX.', 3000);
    }
  });
}


/* ===================== */
/* Funções de pagamento */
function formatarDataBR(data) {
  if (!(data instanceof Date) || isNaN(data.getTime())) return '--';

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function parseDiaVencimento(dataStr) {
  if (!dataStr) return null;

  const partes = String(dataStr).split("-");
  if (partes.length !== 3) return null;

  const dia = Number(partes[2]);
  return Number.isNaN(dia) ? null : dia;
}

function getUltimoDiaDoMes(ano, mes) {
  return new Date(ano, mes + 1, 0).getDate();
}

function calcularProximoVencimento(dataBaseVencimento, mesAtualPago = false) {
  const diaBase = parseDiaVencimento(dataBaseVencimento);
  if (!diaBase) return null;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let ano = hoje.getFullYear();
  let mes = hoje.getMonth();

  let diaDoMesAtual = Math.min(diaBase, getUltimoDiaDoMes(ano, mes));
  let vencimentoAtual = new Date(ano, mes, diaDoMesAtual);
  vencimentoAtual.setHours(0, 0, 0, 0);

  // se o mês atual já foi pago, joga automaticamente para o próximo mês
  if (mesAtualPago) {
    mes += 1;

    if (mes > 11) {
      mes = 0;
      ano += 1;
    }

    const diaDoProximoMes = Math.min(diaBase, getUltimoDiaDoMes(ano, mes));
    const vencimentoProximo = new Date(ano, mes, diaDoProximoMes);
    vencimentoProximo.setHours(0, 0, 0, 0);

    return vencimentoProximo;
  }

  // se ainda não pagou e o vencimento do mês já passou, continua mostrando o mês atual como referência vencida
  return vencimentoAtual;
}

function diferencaEmDias(dataFutura, dataAtual) {
  const umDia = 1000 * 60 * 60 * 24;

  const d1 = new Date(dataFutura);
  const d2 = new Date(dataAtual);

  d1.setHours(0, 0, 0, 0);
  d2.setHours(0, 0, 0, 0);

  return Math.ceil((d1 - d2) / umDia);
}


let ultimoAvisoPagamento = null;

function atualizarAvisoPagamento() {
  const token = localStorage.getItem('tokenAluno');
  const dataVencimento = localStorage.getItem('dataVencimentoAluno');
  const pagamentoMesAtual = localStorage.getItem('pagamentoMesAtual') === 'true';

  const paymentSection = document.getElementById('paymentSection');
  const paymentText = document.getElementById('paymentText');
  const paymentWarning = document.getElementById('paymentWarning');
  const paymentWarningText = document.getElementById('paymentWarningText');

  if (!paymentSection || !paymentText || !paymentWarning || !paymentWarningText) return;

  if (!token || !dataVencimento) {
    paymentSection.style.display = 'none';
    paymentWarning.style.display = 'none';
    return;
  }

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const proximaData = calcularProximoVencimento(dataVencimento, pagamentoMesAtual);

  if (!proximaData || isNaN(proximaData.getTime())) {
    paymentSection.style.display = 'none';
    paymentWarning.style.display = 'none';
    return;
  }

  const diasRestantes = diferencaEmDias(proximaData, hoje);

  paymentSection.style.display = 'block';
  paymentText.textContent = pagamentoMesAtual
    ? `Seu próximo pagamento será em: ${formatarDataBR(proximaData)}.`
    : `Sua próxima data de pagamento é: ${formatarDataBR(proximaData)}.`;

  if (!pagamentoMesAtual && diasRestantes >= 0 && diasRestantes <= 3) {
    paymentWarning.style.display = 'flex';

    let mensagemAviso = '';

    if (diasRestantes === 0) {
      mensagemAviso = 'Seu pagamento vence hoje.';
    } else if (diasRestantes === 1) {
      mensagemAviso = 'Falta 1 dia para o pagamento.';
    } else {
      mensagemAviso = `Faltam ${diasRestantes} dias para o pagamento.`;
    }

    paymentWarningText.textContent = mensagemAviso;

    const chaveAviso = `${formatarDataBR(proximaData)}-${diasRestantes}`;
    if (ultimoAvisoPagamento !== chaveAviso) {
      ultimoAvisoPagamento = chaveAviso;
      showToast('Aviso de pagamento', mensagemAviso, 4000);
    }
  } else if (!pagamentoMesAtual && diasRestantes < 0) {
    paymentWarning.style.display = 'flex';
    paymentWarningText.textContent = 'Seu pagamento está em atraso.';
  } else {
    paymentWarning.style.display = 'none';
  }
}

function criarDataLocal(dataStr) {
  if (!dataStr) return null;

  const partes = String(dataStr).split('-');
  if (partes.length !== 3) return null;

  const ano = Number(partes[0]);
  const mes = Number(partes[1]) - 1;
  const dia = Number(partes[2]);

  const data = new Date(ano, mes, dia);
  data.setHours(0, 0, 0, 0);

  return isNaN(data.getTime()) ? null : data;
}

/* ================================================= */
/* Links protegidos */
/* ================================================= */
const linksProtegidos = document.querySelectorAll('[data-protegido]');

linksProtegidos.forEach((link) => {
  link.addEventListener('click', (e) => {
    const tipo = link.dataset.protegido;
    const token = localStorage.getItem('tokenAluno');

    if (!token) {
      e.preventDefault();
      showToast('Acesso restrito', 'Faça login para continuar');
      abrirModal();
      return;
    }

    e.preventDefault();

    if (tipo === 'treinos') {
      window.location.href = 'treinos-aluno.html';
    }

    if (tipo === 'perfil') {
      window.location.href = 'perfil-aluno.html';
    }
  });
});


/* ===================== */
/* Login / Logout */
function atualizarBotao() {
  const btnAtual = document.querySelector('.login-btn');
  if (!btnAtual) return;

  const token = localStorage.getItem('tokenAluno');

  const novoBtn = btnAtual.cloneNode(true);
  btnAtual.replaceWith(novoBtn);

  if (token) {
    novoBtn.innerText = 'Logout';
    novoBtn.addEventListener('click', logoutAluno);
  } else {
    novoBtn.innerText = 'Login';
    novoBtn.addEventListener('click', (e) => {
      e.preventDefault();
      abrirModal();
    });
  }
}

function logoutAluno(e) {
  e.preventDefault();
  localStorage.removeItem('tokenAluno');
  localStorage.removeItem('nomeAluno');
  localStorage.removeItem('emailAluno');
  localStorage.removeItem('dataVencimentoAluno');
  localStorage.removeItem('pagamentoMesAtual');

  ultimoAvisoPagamento = null;

  showToast('Logout', 'Você saiu da conta com sucesso!');
  atualizarBotao();
  atualizarNomeAluno();
  atualizarAvisoPagamento();
  atualizarFormasPagamento();
}

// Ajusta ao carregar a página
atualizarBotao();
atualizarNomeAluno();


/* ===================== */
/* Formulário de login */
const loginForm = document.getElementById('loginForm');

loginForm?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('username');
  const senha = document.getElementById('password');
  const submitBtn = document.getElementById('loginSubmit');

  if (!email || !senha || !submitBtn) return;

  submitBtn.classList.add('loading');
  submitBtn.disabled = true;
  email.disabled = true;
  senha.disabled = true;

  try {
    const response = await fetch('https://sistema-personal.vercel.app/aluno/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email.value,
        senha: senha.value,
      }),
    });

    const data = await response.json();
    // console.log('RESPOSTA LOGIN:', data);

    if (response.ok) {
      localStorage.setItem('tokenAluno', data.token);
      localStorage.setItem('nomeAluno', data.nome);
      localStorage.setItem('emailAluno', data.email);

      if (data.data_vencimento) {
        const dataLimpa = String(data.data_vencimento).split('T')[0];
        localStorage.setItem('dataVencimentoAluno', dataLimpa);
      } else {
        localStorage.removeItem('dataVencimentoAluno');
      }

      localStorage.setItem('pagamentoMesAtual', data.pagamento_mes_atual ? 'true' : 'false');

      ultimoAvisoPagamento = null;

      showToast('Bem-vindo!', `Olá ${data.nome}, você entrou com sucesso!`);
      fecharModal();

      atualizarBotao();
      atualizarNomeAluno();
      atualizarAvisoPagamento();
      atualizarFormasPagamento();

      loginForm.reset?.();
    } else {
      showToast('Erro!', data.message || 'Não foi possível logar.');
    }
  } catch (error) {
    console.error('Erro ao logar:', error);
    showToast('Erro!', 'Não foi possível conectar ao servidor.');
  } finally {
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    email.disabled = false;
    senha.disabled = false;
  }
});


/* ===================== */
/* DOMContentLoaded */
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  if (params.get('login') === '1') {
    abrirModal();
    showToast('Sessão expirada', 'Faça login para continuar');
  }

  atualizarBotao();
  atualizarNomeAluno();
  atualizarAvisoPagamento();
  atualizarFormasPagamento();
  configurarCopiaPix();
});


/* ===================== */
/* Lightning Canvas Effect */
function initLightningCanvas() {
  const lightningCanvas = document.getElementById('lightning-canvas');
  if (!lightningCanvas) return;

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    lightningCanvas.style.display = 'none';
    return;
  }

  const ctx = lightningCanvas.getContext('2d');
  let animationId;
  let lastLightningTime = 0;

  const lightningInterval = 2600;
  const chance = 0.32;

  function resizeCanvas() {
    lightningCanvas.width = window.innerWidth;
    lightningCanvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Lightning {
    constructor() {
      this.reset();
    }

    reset() {
      this.x = Math.random() * lightningCanvas.width;
      this.y = 0;
      this.segments = [];
      this.opacity = 1;
      this.decay = 0.035;
      this.generateBolt();
    }

    generateBolt() {
      let x = this.x;
      let y = 0;
      const maxY = lightningCanvas.height * 0.75;

      while (y < maxY) {
        const newX = x + (Math.random() - 0.5) * 120;
        const newY = y + Math.random() * 34 + 12;

        this.segments.push({ x1: x, y1: y, x2: newX, y2: newY });

        if (Math.random() < 0.22 && this.segments.length > 2) {
          const branchX = newX + (Math.random() - 0.5) * 100;
          const branchY = newY + Math.random() * 70;
          this.segments.push({
            x1: newX,
            y1: newY,
            x2: branchX,
            y2: branchY,
            isBranch: true
          });
        }

        x = newX;
        y = newY;
      }
    }

    draw() {
      if (this.opacity <= 0) return false;

      ctx.save();
      ctx.globalAlpha = this.opacity;

      this.segments.forEach(seg => {
        const lineWidth = seg.isBranch ? 1 : 2.2;

        ctx.shadowColor = '#FACC15';
        ctx.shadowBlur = 22;
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = lineWidth;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();

        ctx.shadowBlur = 8;
        ctx.strokeStyle = '#A3E635';
        ctx.lineWidth = lineWidth * 0.55;
        ctx.beginPath();
        ctx.moveTo(seg.x1, seg.y1);
        ctx.lineTo(seg.x2, seg.y2);
        ctx.stroke();
      });

      ctx.restore();
      this.opacity -= this.decay;
      return this.opacity > 0;
    }
  }

  let currentLightning = null;

  function animate(timestamp) {
    ctx.clearRect(0, 0, lightningCanvas.width, lightningCanvas.height);

    if (timestamp - lastLightningTime > lightningInterval) {
      if (Math.random() < chance) {
        currentLightning = new Lightning();
        lastLightningTime = timestamp;
      } else {
        lastLightningTime = timestamp - lightningInterval + 900;
      }
    }

    if (currentLightning) {
      const isActive = currentLightning.draw();
      if (!isActive) currentLightning = null;
    }

    animationId = requestAnimationFrame(animate);
  }

  animate(0);

  window.addEventListener('beforeunload', () => cancelAnimationFrame(animationId));
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      cancelAnimationFrame(animationId);
    } else {
      animate(performance.now());
    }
  });
}

initLightningCanvas();