
/* ===================== */
/* Hamburger */
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('open');
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
    trackHero.style.transform = `translateX(${-indexHero * 100}%)`;
}

/* ===== AUTOPLAY ===== */
function startAutoplay() {
    autoPlayInterval = setInterval(() => {
        indexHero = (indexHero + 1) % itemsHero.length;
        updateCarouselHero();
    }, 2500);
}

function stopAutoplayTemporario() {
    clearInterval(autoPlayInterval);

    // reinicia o cooldown
    clearTimeout(autoPlayTimeout);

    autoPlayTimeout = setTimeout(() => {
        startAutoplay();
    }, 3000); // ⏳ 3 segundos sem interação
}

/* ===== SETAS ===== */
prevHero.addEventListener('click', () => {
    indexHero = (indexHero - 1 + itemsHero.length) % itemsHero.length;
    updateCarouselHero();
    stopAutoplayTemporario();
});

nextHero.addEventListener('click', () => {
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
    modal.classList.add('show');
    modal.style.display = 'block';
}

function fecharModal() {
    modal.classList.remove('show');
    setTimeout(() => modal.style.display = 'none', 300);
}

closeModal.addEventListener('click', fecharModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) fecharModal();
});

/* ===================== */
/* Toast */
function showToast(titulo, mensagem, duracao = 2500) {
    const toastTitle = document.getElementById('toastTitle');
    const toastBody = document.getElementById('toastBody');
    const toastElement = document.getElementById('toastMessage');

    toastTitle.innerText = titulo;
    toastBody.innerText = mensagem;
    toastElement.classList.add('show');

    setTimeout(() => {
        toastElement.classList.remove('show');
    }, duracao);
}

/* ================================================= */
/* Links protegidos (menu, botões, cards, qualquer) */
/* ================================================= */

const linksProtegidos = document.querySelectorAll('[data-protegido]');

linksProtegidos.forEach(link => {
    link.addEventListener('click', (e) => {
        const tipo = link.dataset.protegido;
        const token = localStorage.getItem('tokenAluno');

        if (!token) {
            e.preventDefault();
            showToast("Acesso restrito", "Faça login para continuar");
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

    loginBtn.replaceWith(loginBtn.cloneNode(true)); // remove listeners antigos
    const novoBtn = document.querySelector('.login-btn');

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
    showToast("Logout", "Você saiu da conta com sucesso!");
    atualizarBotao();
}

// Ajusta botão ao carregar a página
atualizarBotao();

/* ===================== */
/* Formulário de login */
const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('username');
    const senha = document.getElementById('password');
    const submitBtn = document.getElementById('loginSubmit');

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
                senha: senha.value
            })
        });

        const data = await response.json();

        if (response.ok) {
            showToast("Bem-vindo!", `Olá ${data.nome}, você entrou com sucesso!`);
            fecharModal();

            localStorage.setItem('tokenAluno', data.token);
            localStorage.setItem('nomeAluno', data.nome);
            localStorage.setItem('emailAluno', data.email);

            atualizarBotao();

        } else {
            showToast("Erro!", data.message || "Não foi possível logar.");
        }

    } catch (error) {
        console.error("Erro ao logar:", error);
        showToast("Erro!", "Não foi possível conectar ao servidor.");
    } finally {
        // 🔁 Volta estado normal
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
        email.disabled = false;
        senha.disabled = false;
    }
});


