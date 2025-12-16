const API_URL = "http://localhost:4000"; // ajuste se necessário
let personal = null;

(function protegerPagina() {
    const token = getToken();
    if (!token) {
        window.location.href = "login.html";
    }
})();
// -------------------------------
// PEGAR TOKEN
// -------------------------------
function getToken() {
    return sessionStorage.getItem("token");
}



function logout() {
    sessionStorage.clear();
    window.location.href = "login.html";
}

document.getElementById("btnLogout")?.addEventListener("click", logout);

// -------------------------------
// MOSTRAR TOAST
// -------------------------------
function mostrarToast(titulo, mensagem, tipo = "info") {
    const header = document.querySelector("#toastMessage .toast-header");
    if (!header) return;

    header.classList.remove("bg-danger", "bg-success", "bg-primary", "text-white");

    if (tipo === "success") header.classList.add("bg-success", "text-white");
    if (tipo === "danger") header.classList.add("bg-danger", "text-white");
    if (tipo === "primary") header.classList.add("bg-primary", "text-white");

    document.getElementById("toastTitle").textContent = titulo;
    document.getElementById("toastBody").textContent = mensagem;
    $("#toastMessage").toast("show");
}

// -------------------------------
// CARREGAR DADOS DO PERSONAL
// -------------------------------
async function carregarPersonal() {
    try {
        const token = getToken();
        if (!token) throw new Error("Token não encontrado. Faça login novamente.");

        const res = await fetch(`${API_URL}/personal/logado`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        if (res.status === 401) {
            logout();
            return;
        }

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Erro ao carregar dados do personal");
        }

        const dados = await res.json();
        personal = dados.personal;

        if (!personal) throw new Error("Personal não encontrado.");

        // Atualiza campos do HTML
        document.getElementById("nomeUsuario").value = personal.nome;
        document.querySelector('input[type="email"]').value = personal.email;

        // ⚡ Corrigido: adiciona API_URL à foto
        const foto = personal.foto_url
            ? `${API_URL}${personal.foto_url}`
            : "img/undraw_profile.svg";

        document.getElementById("fotoPreview").src = foto;
        document.getElementById("fotoTopbar").src = foto;
        document.getElementById("nomePersonal").textContent = personal.nome;

    } catch (err) {
        console.error(err);
        mostrarToast("Erro", err.message, "danger");
    }
}

// -------------------------------
// SALVAR ALTERAÇÕES
// -------------------------------
async function salvarAlteracoes() {
    try {
        if (!personal) return;

        const token = getToken();
        const nome = document.getElementById("nomeUsuario").value;
        let foto_url = personal.foto_url || null;

        // Envia a foto se alterada
        const inputFoto = document.getElementById("inputFoto");
        if (inputFoto.files && inputFoto.files[0]) {
            const formData = new FormData();
            formData.append("foto", inputFoto.files[0]);

            const resUpload = await fetch(`${API_URL}/personal/upload-foto`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });

            const dataUpload = await resUpload.json();
            if (!resUpload.ok) throw new Error(dataUpload.message || "Erro ao enviar foto");
            foto_url = dataUpload.foto_url;
        }

        // Atualiza nome e foto no backend
        const res = await fetch(`${API_URL}/personal/${personal.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ nome, foto_url })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erro ao atualizar perfil");

        // Atualiza a variável local e o HTML
        personal.nome = nome;
        personal.foto_url = foto_url;

        // ⚡ Corrigido: adiciona API_URL ao mostrar a foto
        const fotoFinal = foto_url
            ? `${API_URL}${foto_url}`
            : "img/undraw_profile.svg";

        document.getElementById("fotoPreview").src = fotoFinal;
        document.getElementById("fotoTopbar").src = fotoFinal;
        document.getElementById("nomePersonal").textContent = nome;

        mostrarToast("Sucesso", "Perfil atualizado com sucesso!", "success");

    } catch (err) {
        console.error(err);
        mostrarToast("Erro", err.message, "danger");
    }
}

// -------------------------------
// EVENTOS
// -------------------------------
document.addEventListener("DOMContentLoaded", () => {
    carregarPersonal();

    // Preview da foto
    document.getElementById("inputFoto").addEventListener("change", function () {
        const file = this.files[0];
        if (file) {
            document.getElementById("fotoPreview").src = URL.createObjectURL(file);
        }
    });

    // Botão salvar alterações
    document.querySelector(".btn-save").addEventListener("click", salvarAlteracoes);
});

document.addEventListener('DOMContentLoaded', () => {
    const fotoTopbar = document.getElementById('btnPerfil');
    const menuPerfil = document.getElementById('menuPerfil');

    // Abrir/fechar menu ao clicar na foto
    fotoTopbar.addEventListener('click', (e) => {
        e.stopPropagation(); // evita que o clique feche imediatamente
        menuPerfil.style.display = menuPerfil.style.display === 'block' ? 'none' : 'block';
    });

    // Fechar ao clicar fora
    document.addEventListener('click', () => {
        menuPerfil.style.display = 'none';
    });

    // Logout dentro do menu
    document.getElementById('btnLogoutMenu').addEventListener('click', (e) => {
        e.preventDefault();
        $('#logoutModal').modal('show'); // abre o modal de confirmação
    });

});
