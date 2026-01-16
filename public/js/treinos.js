const API_URL = "https://sistema-personal.vercel.app";
const CLOUDINARY_CLOUD_NAME = "dvpftafqb"; // seu cloud_name
const CLOUDINARY_UPLOAD_PRESET = "treinos_videos";

let categorias = [];
let exercicios = [];
let idTreinoParaExcluir = null;
let treinoEditandoId = null;
let exercicioVideoId = null;

// busca
let termoBusca = "";

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
        ? (personal.foto_url.startsWith("http") ? personal.foto_url : `${API_URL}${personal.foto_url}`)
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
  setLoadingTreinos(true);

  try {
    const res = await authFetch(`${API_URL}/personal/exercicios?t=${Date.now()}`);
    exercicios = await res.json();
    renderTreinos();
  } catch (err) {
    exercicios = [];
    renderTreinos();
    mostrarToast("Erro", err.message, "danger");
  } finally {
    setLoadingTreinos(false);
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
    video.src = exercicio.video_url.startsWith("http")
      ? exercicio.video_url
      : `${API_URL}${exercicio.video_url}`;
  }

  video.load();
  $("#modalVideo").modal("show");
}

// preview local
document.getElementById("videoPlayerFile")?.addEventListener("change", function () {
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
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);

  try {
    const resCloud = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/video/upload`,
      { method: "POST", body: formData }
    );

    const dataCloud = await resCloud.json();
    if (!resCloud.ok) throw new Error(dataCloud.error?.message || "Erro ao enviar vídeo");

    const video_url = dataCloud.secure_url;

    const resBackend = await authFetch(`${API_URL}/personal/exercicios/${exercicioVideoId}/video`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ video_url })
    });

    const dataBackend = await resBackend.json();
    if (!resBackend.ok) throw new Error(dataBackend.message);

    mostrarToast("Sucesso", "Vídeo atualizado!", "success");
    $("#modalVideo").modal("hide");
    await carregarExercicios();
  } catch (err) {
    mostrarToast("Erro", err.message, "danger");
    console.error(err);
  }
}

$("#modalVideo").on("hidden.bs.modal", () => {
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

  const filtrados = exercicios.filter(e => {
    if (!termoBusca) return true;
    return (e.nome || "").toLowerCase().includes(termoBusca);
  });

  if (!filtrados.length) {
    area.innerHTML = `
      <div class="p-4 text-center" style="border:1px dashed #d9dbe7; border-radius:14px;">
        <i class="fas fa-dumbbell" style="font-size:28px; color:#4e73df;"></i>
        <h5 class="mt-3 mb-1">Nenhum treino encontrado</h5>
        <p class="mb-0 text-muted">${termoBusca ? "Tente outro termo na busca." : "Clique em “Cadastrar Novo Treino” para começar."}</p>
      </div>
    `;
    return;
  }

  const categoriasMap = {};
  filtrados.forEach(e => {
    if (!categoriasMap[e.categoria_nome]) categoriasMap[e.categoria_nome] = [];
    categoriasMap[e.categoria_nome].push(e);
  });

  for (const nomeCategoria in categoriasMap) {
    const items = categoriasMap[nomeCategoria];
    const safeId = nomeCategoria.replace(/\s+/g, "_").replace(/[^\w]/g, "");
    const collapseId = "collapse_" + safeId;

    const card = document.createElement("div");
    card.className = "card mb-4 cat-card";

    card.innerHTML = `
      <div class="cat-header" onclick="toggleCategoria('${collapseId}')">
        <h5>${nomeCategoria}</h5>
        <div style="display:flex; gap:10px; align-items:center;">
          <span class="badge-count">${items.length} treino(s)</span>
          <i class="fas fa-chevron-down chev"></i>
        </div>
      </div>

      <div id="${collapseId}" class="cat-body">
        <div class="ex-grid">
          ${items.map(e => {
            const temVideo = !!e.video_url;
            const desc = (e.descricao || "").trim() || "Sem descrição.";

            return `
              <div class="ex-card">
                <div class="ex-top">
                  <div>
                    <h6 class="ex-title" onclick="abrirVideo(${e.id})" title="Abrir vídeo">
                      <span class="ex-play"><i class="fas fa-play"></i></span>
                      <span>${e.nome}</span>
                    </h6>

                    <span class="badge badge-pill ${temVideo ? "badge-success" : "badge-secondary"}" style="margin-left:44px;">
                      ${temVideo ? "com vídeo" : "sem vídeo"}
                    </span>
                  </div>

                  <div class="ex-actions">
                    <button class="icon-btn edit" title="Editar"
                      onclick='editarTreino(${JSON.stringify(e)})'>
                      <i class="fas fa-edit"></i>
                    </button>

                    <button class="icon-btn trash" title="Excluir"
                      onclick="excluirTreino(${e.id})">
                      <i class="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <p class="ex-desc">${desc}</p>
              </div>
            `;
          }).join("")}
        </div>
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

  document.querySelector("#modalCadastroTreino .modal-title").textContent = "Editar Treino";

  $("#modalCadastroTreino").modal("show");
}

function excluirTreino(id) {
  idTreinoParaExcluir = id;

  const exercicio = exercicios.find(e => e.id === id);
  document.getElementById("nomeTreinoExcluir").innerText = exercicio ? exercicio.nome : "";

  $("#modalExcluirTreino").modal("show");
}

/* ============================================================
   UTIL
============================================================ */
// Accordion "um por vez" + seta girando (CSS faz a animacao)
function toggleCategoria(id) {
  const el = document.getElementById(id);
  const header = el.previousElementSibling;

  const jaAberto = el.classList.contains("open");

  // fecha todos
  document.querySelectorAll(".cat-body.open").forEach(b => b.classList.remove("open"));
  document.querySelectorAll(".cat-header.open").forEach(h => h.classList.remove("open"));

  // se não estava aberto, abre este
  if (!jaAberto) {
    el.classList.add("open");
    header.classList.add("open");
  }
}

/* ============================================================
   TOAST
============================================================ */
$("#toastMessage").toast({ autohide: true, delay: 2000 });

function mostrarToast(titulo, mensagem, tipo = "info") {
  const toast = $("#toastMessage");
  const header = toast.find(".toast-header");

  header.removeClass("bg-danger bg-success bg-primary text-white");

  if (tipo === "success") header.addClass("bg-success text-white");
  if (tipo === "danger") header.addClass("bg-danger text-white");
  if (tipo === "primary") header.addClass("bg-primary text-white");

  $("#toastTitle").text(titulo);
  $("#toastBody").text(mensagem);

  toast.css("display", "block");
  toast.toast("show");
}

$("#toastMessage").on("hidden.bs.toast", function () {
  $(this).css("display", "none");
});

document.querySelectorAll(".btnFecharToast").forEach(btn => {
  btn.addEventListener("click", () => {
    $("#toastMessage").toast("hide");
  });
});

/* ============================================================
   RESET MODAL
============================================================ */
$("#modalCadastroTreino").on("hidden.bs.modal", () => {
  treinoEditandoId = null;
  document.getElementById("formTreino").reset();
  document.querySelector("#modalCadastroTreino .modal-title").textContent = "Cadastrar Novo Treino";
});

/* ============================================================
   LOADING
============================================================ */
function setLoadingBotao(id, loading) {
  const btn = document.getElementById(id);
  if (!btn) return;

  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-border");

  if (loading) {
    btn.disabled = true;
    text?.classList.add("d-none");
    spinner?.classList.remove("d-none");
  } else {
    btn.disabled = false;
    text?.classList.remove("d-none");
    spinner?.classList.add("d-none");
  }
}

function setLoadingTreinos(loading) {
  const loader = document.getElementById("treinosLoader");
  const lista = document.getElementById("listaCategoriasTreinos");

  if (!loader || !lista) return;

  if (loading) {
    loader.style.display = "block";
    lista.style.display = "none";
  } else {
    loader.style.display = "none";
    lista.style.display = "block";
  }
}

/* ============================================================
   BOTÕES
============================================================ */
document.getElementById("btnSalvarTreino")?.addEventListener("click", async () => {
  setLoadingBotao("btnSalvarTreino", true);
  try {
    await salvarTreino();
  } finally {
    setLoadingBotao("btnSalvarTreino", false);
  }
});

document.getElementById("btnSalvarVideo")?.addEventListener("click", async () => {
  setLoadingBotao("btnSalvarVideo", true);
  try {
    await salvarVideo();
  } finally {
    setLoadingBotao("btnSalvarVideo", false);
  }
});

document.getElementById("btnConfirmarExcluirTreino")?.addEventListener("click", async () => {
  setLoadingBotao("btnConfirmarExcluirTreino", true);
  try {
    await authFetch(`${API_URL}/personal/exercicios/${idTreinoParaExcluir}`, { method: "DELETE" });
    mostrarToast("Sucesso", "Treino excluído!", "success");
    carregarExercicios();
  } catch {
    mostrarToast("Erro", "Erro ao excluir treino", "danger");
  } finally {
    setLoadingBotao("btnConfirmarExcluirTreino", false);
    $("#modalExcluirTreino").modal("hide");
  }
});

/* ============================================================
   INIT
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  if (!getToken()) {
    logout();
    return;
  }

  // busca (se existir no HTML)
  document.getElementById("buscaTreino")?.addEventListener("input", (e) => {
    termoBusca = (e.target.value || "").toLowerCase().trim();
    renderTreinos();
  });

  carregarPersonalTopo();
  carregarCategorias();
  carregarExercicios();

  // ✅ Menu do topo (perfil)
  const fotoTopbar = document.getElementById("btnPerfil");
  const menuPerfil = document.getElementById("menuPerfil");

  fotoTopbar?.addEventListener("click", (e) => {
    e.stopPropagation();
    menuPerfil.style.display = menuPerfil.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", () => {
    if (menuPerfil) menuPerfil.style.display = "none";
  });

  document.getElementById("btnLogoutMenu")?.addEventListener("click", (e) => {
    e.preventDefault();
    $("#logoutModal").modal("show");
  });
});
