/* ===================== */
/* Hamburger */
const hamburger = document.getElementById('hamburger');
const navMenu = document.getElementById('nav-menu');

if (hamburger && navMenu) {
  hamburger.addEventListener('click', () => {
    hamburger.classList.toggle('active');
    navMenu.classList.toggle('open');

    // ✅ mesma regra global dos outros
    document.body.classList.toggle('menu-open', navMenu.classList.contains('open'));
  });

  // ✅ fecha ao clicar em qualquer item do menu
  navMenu.querySelectorAll('a, button').forEach(el => {
    el.addEventListener('click', () => {
      hamburger.classList.remove('active');
      navMenu.classList.remove('open');
      document.body.classList.remove('menu-open');
    });
  });
}

/* ===================== */
/* Logout */
const logoutBtn = document.getElementById('logoutBtn');
const logoutNavBtn = document.querySelector('.logout-btn');

function logout() {
  localStorage.removeItem('tokenAluno');
  localStorage.removeItem('nomeAluno');
  localStorage.removeItem('emailAluno');
  window.location.replace('aluno.html');
}

if (logoutNavBtn) {
  logoutNavBtn.addEventListener('click', e => {
    e.preventDefault();
    logout();
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener('click', e => {
    e.preventDefault();
    logout();
  });
}

/* ===================== */
/* Auth Fetch do Aluno */
async function alunoAuthFetch(url, options = {}) {
  const token = localStorage.getItem('tokenAluno');

  if (!token) {
    logout();
    throw new Error('Sem token');
  }

  const res = await fetch(url, {
    ...options,
    headers: {
      ...(options.headers || {}),
      Authorization: `Bearer ${token}`
    }
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error('Sessão expirada');
  }

  return res;
}

/* ===================== */
/* Inicialização da Página */
document.addEventListener('DOMContentLoaded', async () => {
  try {
    await alunoAuthFetch('https://sistema-personal.vercel.app/aluno/perfil');

    const nome = localStorage.getItem('nomeAluno');
    const email = localStorage.getItem('emailAluno');

    const nomeInput = document.getElementById('nomeAluno');
    const emailInput = document.getElementById('emailAluno');

    if (nomeInput) nomeInput.value = nome || 'Aluno';
    if (emailInput) emailInput.value = email || 'email@exemplo.com';

  } catch (err) {
    console.error(err);
  }
});
