/* ===================== */
/* Hamburger */
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('open');
});

/* ===================== */
/* Verifica login e preenche dados */
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('tokenAluno');

    if (!token) {
        alert("Você precisa estar logado para acessar esta página.");
        window.location.href = "aluno.html";
        return;
    }

    const nome = localStorage.getItem('nomeAluno');
    const email = localStorage.getItem('emailAluno');

    const nomeInput = document.getElementById("nomeAluno");
    const emailInput = document.getElementById("emailAluno");

    if (nomeInput) nomeInput.value = nome || "Aluno";
    if (emailInput) emailInput.value = email || "email@exemplo.com";
});

/* ===================== */
/* Logout direto */
const logoutBtn = document.getElementById('logoutBtn');
const logoutNavBtn = document.querySelector('.logout-btn');

function logout() {
    localStorage.removeItem('tokenAluno');
    localStorage.removeItem('nomeAluno');
    localStorage.removeItem('emailAluno');
    window.location.href = "aluno.html";
}

// Logout do botão do menu
if (logoutNavBtn) {
    logoutNavBtn.addEventListener('click', e => {
        e.preventDefault();
        logout();
    });
}

// Logout do botão "Sair" na página
if (logoutBtn) {
    logoutBtn.addEventListener('click', e => {
        e.preventDefault();
        logout();
    });
}
