const API_URL = "https://sistema-personal.vercel.app";

let categorias = [];
let exercicios = [];
let idTreinoParaExcluir = null;
let treinoEditandoId = null;
let exercicioVideoId = null;

/* ============================================================
   TOKEN
============================================================ */
function getToken() {
    return sessionStorage.getItem("token");
}

function logout() {
    sessionStorage.clear();
    window.location.href = "login.html";
}

document.getElementById("btnLogout")?.addEventListener("click", logout);

async function authFetch(url, options = {}) {
    const token = getToken();

    if (!token) {
        logout();
        throw new Error("Sem token");
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
        throw new Error("Sessão expirada");
    }

    return res;
}

/* ============================================================
   TOPO – PERSONAL
============================================================ */
async function carregarPersonalTopo() {
    try {
        const res = await authFetch(`${API_URL}/personal/logado`);
        if (!res.ok) return;

        const { personal } = await res.json();

        document.getElementById("nomePersonal").textContent = personal.nome;
        document.getElementById("fotoTopbar").src =
            personal.foto_url
                ? (personal.foto_url.startsWith('http') ? personal.foto_url : `${API_URL}${personal.foto_url}`)
                : "img/undraw_profile.svg";


    } catch (err) {
        console.error(err);
    }
}

/* ============================================================
   CATEGORIAS
============================================================ */
async function carregarCategorias() {
    try {
        const res = await authFetch(`${API_URL}/personal/categorias`);
        categorias = await res.json();

        const select = document.getElementById("categoria");
        select.innerHTML = `<option value="">Selecione...</option>`;

        categorias.forEach(cat => {
            const option = document.createElement("option");
            option.value = cat.id;
            option.textContent = cat.nome;
            select.appendChild(option);
        });

    } catch (err) {
        mostrarToast("Erro", err.message, "danger");
    }
}

/* ============================================================
   EXERCÍCIOS
============================================================ */
async function carregarExercicios() {
    try {
        const res = await authFetch(
            `${API_URL}/personal/exercicios?t=${Date.now()}`
        );

        exercicios = await res.json();
        renderTreinos();

    } catch (err) {
        exercicios = [];
        renderTreinos();
        mostrarToast("Erro", err.message, "danger");
    }
}

/* ============================================================
   MODAL VÍDEO
============================================================ */
function abrirVideo(id) {
    exercicioVideoId = id;

    const exercicio = exercicios.find(e => e.id === id);

    document.getElementById("modalVideoTitulo").innerText =
        exercicio?.nome || "Vídeo do Exercício";

    const video = document.getElementById("modalVideoPlayer");
    const fileInput = document.getElementById("videoPlayerFile");

    fileInput.value = "";

    video.pause();
    video.removeAttribute("src");

if (exercicio?.video_url) {
    video.src = exercicio.video_url.startsWith('http')
        ? exercicio.video_url
        : `${API_URL}${exercicio.video_url}`;
}


    video.load();
    $("#modalVideo").modal("show");
}

// preview local
document.getElementById("videoPlayerFile").addEventListener("change", function () {
    const file = this.files[0];
    if (file) {
        const video = document.getElementById("modalVideoPlayer");
        video.src = URL.createObjectURL(file);
        video.load();
    }
});

async function salvarVideo() {
    const file = document.getElementById("videoPlayerFile").files[0];
    if (!file) {
        mostrarToast("Erro", "Selecione um vídeo", "danger");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", "SEU_UPLOAD_PRESET"); // substitua pelo seu preset

    try {
        // Upload direto para Cloudinary
        const resCloud = await fetch(`https://api.cloudinary.com/v1_1/SEU_CLOUD_NAME/video/upload`, {
            method: "POST",
            body: formData
        });

        const dataCloud = await resCloud.json();
        if (!resCloud.ok) throw new Error(dataCloud.error?.message || "Erro ao enviar vídeo");

        const video_url = dataCloud.secure_url; // URL final do vídeo

        // Agora atualiza o backend apenas com a URL
        const resBackend = await authFetch(`${API_URL}/personal/exercicios/${exercicioVideoId}/video`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ video_url })
        });

        const data = await resBackend.json();
        if (!resBackend.ok) throw new Error(data.message);

        mostrarToast("Sucesso", "Vídeo atualizado!", "success");
        $("#modalVideo").modal("hide");
        await carregarExercicios();

    } catch (err) {
        mostrarToast("Erro", err.message, "danger");
    }
}

// 🔥 LIMPA O VIDEO AO FECHAR
$('#modalVideo').on('hidden.bs.modal', () => {
    const video = document.getElementById("modalVideoPlayer");
    video.pause();
    video.removeAttribute("src");
    video.load();
    exercicioVideoId = null;
});

/* ============================================================
   SALVAR / EDITAR TREINO
============================================================ */
async function salvarTreino() {
    const categoria_id = document.getElementById("categoria").value;
    const nome = document.getElementById("nome").value;
    const descricao = document.getElementById("descricao").value;

    if (!categoria_id || !nome) {
        mostrarToast("Erro", "Preencha os campos obrigatórios", "danger");
        return;
    }

    try {
        const url = treinoEditandoId
            ? `${API_URL}/personal/exercicios/${treinoEditandoId}`
            : `${API_URL}/personal/exercicios`;

        const method = treinoEditandoId ? "PUT" : "POST";

        const res = await authFetch(url, {
            method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ categoria_id, nome, descricao })
        });

        if (!res.ok) throw new Error("Erro ao salvar treino");

        $("#modalCadastroTreino").modal("hide");
        treinoEditandoId = null;
        document.getElementById("formTreino").reset();
        carregarExercicios();

    } catch (err) {
        mostrarToast("Erro", err.message, "danger");
    }
}

/* ============================================================
   RENDER
============================================================ */
function renderTreinos() {
    const area = document.getElementById("listaCategoriasTreinos");
    area.innerHTML = "";

    const categoriasMap = {};

    exercicios.forEach(e => {
        if (!categoriasMap[e.categoria_nome]) {
            categoriasMap[e.categoria_nome] = [];
        }
        categoriasMap[e.categoria_nome].push(e);
    });

    for (const nomeCategoria in categoriasMap) {
        const collapseId = "collapse_" + nomeCategoria.replace(/\s+/g, "_");

        const card = document.createElement("div");
        card.className = "card mb-4";

        card.innerHTML = `
            <div class="card-header" style="cursor:pointer"
                 onclick="toggleCategoria('${collapseId}')">
                <h5 class="m-0 font-weight-bold text-primary">${nomeCategoria}</h5>
            </div>

            <div id="${collapseId}" class="card-body">
                ${categoriasMap[nomeCategoria].map(e => `
                    <div class="mb-3">
                        <div class="d-flex justify-content-between align-items-center">
                            <h5 style="cursor:pointer; color:#4e73df"
                                onclick="abrirVideo(${e.id})">
                                ▶ ${e.nome}
                            </h5>

                            <div>
                                <i class="fas fa-edit text-warning mr-3"
                                   style="cursor:pointer"
                                   onclick='editarTreino(${JSON.stringify(e)})'></i>

                                <i class="fas fa-trash text-danger"
                                   style="cursor:pointer"
                                   onclick="excluirTreino(${e.id})"></i>
                            </div>
                        </div>

                        <p>${e.descricao || ""}</p>
                        <hr>
                    </div>
                `).join("")}
            </div>
        `;

        area.appendChild(card);
    }
}

/* ============================================================
   EDITAR / EXCLUIR
============================================================ */
function editarTreino(exercicio) {
    treinoEditandoId = exercicio.id;

    document.getElementById("categoria").value = exercicio.categoria_id;
    document.getElementById("nome").value = exercicio.nome;
    document.getElementById("descricao").value = exercicio.descricao || "";

    document.querySelector("#modalCadastroTreino .modal-title")
        .textContent = "Editar Treino";

    $("#modalCadastroTreino").modal("show");
}

function excluirTreino(id) {
    idTreinoParaExcluir = id;

    const exercicio = exercicios.find(e => e.id === id);
    document.getElementById("nomeTreinoExcluir").innerText =
        exercicio ? exercicio.nome : "";

    $("#modalExcluirTreino").modal("show");
}

document.getElementById("btnConfirmarExcluirTreino").onclick = async () => {
    try {
        await authFetch(
            `${API_URL}/personal/exercicios/${idTreinoParaExcluir}`,
            { method: "DELETE" }
        );

        mostrarToast("Sucesso", "Treino excluído!", "success");
        carregarExercicios();

    } catch {
        mostrarToast("Erro", "Erro ao excluir treino", "danger");
    }

    $("#modalExcluirTreino").modal("hide");
};

/* ============================================================
   UTIL
============================================================ */
function toggleCategoria(id) {
    const el = document.getElementById(id);
    el.style.display = el.style.display === "none" ? "block" : "none";
}
$('#toastMessage').toast({ autohide: true, delay: 2000 });

function mostrarToast(t, m, tipo) {
    const h = document.getElementById("toastHeader");
    h.className = "toast-header " + (tipo === "success" ? "bg-success" : "bg-danger");
    document.getElementById("toastTitle").innerText = t;
    document.getElementById("toastBody").innerText = m;
    $('#toastMessage').toast('show');
}

/* ============================================================
   RESET MODAL
============================================================ */
$('#modalCadastroTreino').on('hidden.bs.modal', () => {
    treinoEditandoId = null;
    document.getElementById("formTreino").reset();
    document.querySelector("#modalCadastroTreino .modal-title")
        .textContent = "Cadastrar Novo Treino";
});


/* ============================================================
   INIT
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    if (!getToken()) {
        logout();
        return;
    }

    carregarPersonalTopo();
    carregarCategorias();
    carregarExercicios();
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


