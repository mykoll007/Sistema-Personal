/* ===================== */
/* Hamburger */
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');
const menuOverlay = document.getElementById('menuOverlay');

function abrirMenu(){
  hamburger.classList.add('active');
  navMenu.classList.add('open');
  document.body.classList.add('menu-open');
}

function fecharMenu(){
  hamburger.classList.remove('active');
  navMenu.classList.remove('open');
  document.body.classList.remove('menu-open');
}

hamburger.addEventListener('click', () => {
  const aberto = navMenu.classList.contains('open');
  if (aberto) fecharMenu();
  else abrirMenu();
});

menuOverlay?.addEventListener('click', fecharMenu);

navMenu.querySelectorAll('a').forEach(a => {
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
  setTimeout(() => (modal.style.display = 'none'), 300);
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
/* ✅ ATUALIZA NOME DO ALUNO (igual no StormFit) */
function atualizarNomeAluno() {
  const el = document.querySelector('.user-name');
  const nome = localStorage.getItem('nomeAluno');

  if (el) el.textContent = nome || 'Aluno';
}

/* ================================================= */
/* Links protegidos (menu, botões, cards, qualquer) */
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
  const token = localStorage.getItem('tokenAluno');

  // remove listeners antigos
  loginBtn.replaceWith(loginBtn.cloneNode(true));
  const novoBtn = document.querySelector('.login-btn');

  if (!novoBtn) return;

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

  showToast('Logout', 'Você saiu da conta com sucesso!');
  atualizarBotao();
  atualizarNomeAluno(); // ✅ volta pra "Aluno"
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

  // 🔄 Ativa loading
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

    if (response.ok) {
      // ✅ guarda dados como no StormFit
      localStorage.setItem('tokenAluno', data.token);
      localStorage.setItem('nomeAluno', data.nome);
      localStorage.setItem('emailAluno', data.email);

      showToast('Bem-vindo!', `Olá ${data.nome}, você entrou com sucesso!`);
      fecharModal();

      atualizarBotao();
      atualizarNomeAluno(); // ✅ troca o nome no "Olá, ..."

      loginForm.reset?.();
    } else {
      showToast('Erro!', data.message || 'Não foi possível logar.');
    }
  } catch (error) {
    console.error('Erro ao logar:', error);
    showToast('Erro!', 'Não foi possível conectar ao servidor.');
  } finally {
    // 🔁 Volta estado normal
    submitBtn.classList.remove('loading');
    submitBtn.disabled = false;
    email.disabled = false;
    senha.disabled = false;
  }
});

/* ===================== */
/* Abre modal se veio sem token */
/* ===================== */
window.addEventListener('DOMContentLoaded', () => {
  const params = new URLSearchParams(window.location.search);

  if (params.get('login') === '1') {
    abrirModal();
    showToast('Sessão expirada', 'Faça login para continuar');
  }

  // ✅ garante que atualiza nome e botão também aqui
   atualizarBotao();
  atualizarNomeAluno();
});

/* ===================== */
/* ⚡ Lightning Canvas Effect (Bioenergia) */
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

  // Ajuste fino aqui:
  const lightningInterval = 2600; // frequência base
  const chance = 0.32;            // chance de aparecer a cada intervalo

  function resizeCanvas() {
    lightningCanvas.width = window.innerWidth;
    lightningCanvas.height = window.innerHeight;
  }

  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);

  class Lightning {
    constructor() { this.reset(); }

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

        // ramificações
        if (Math.random() < 0.22 && this.segments.length > 2) {
          const branchX = newX + (Math.random() - 0.5) * 100;
          const branchY = newY + Math.random() * 70;
          this.segments.push({
            x1: newX, y1: newY, x2: branchX, y2: branchY, isBranch: true
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

        // brilho amarelo/verde (Bioenergia)
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
    if (document.hidden) cancelAnimationFrame(animationId);
    else animate(performance.now());
  });
}

initLightningCanvas();

