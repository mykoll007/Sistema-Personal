const API_URL = "https://sistema-personal.vercel.app";
const CLOUDINARY_CLOUD_NAME = "dvpftafqb";
const CLOUDINARY_UPLOAD_PRESET_IMAGENS = "alunos_imagens";

let alunos = [];
let dataTable;
let alunoSelecionado = null; // usado para edição e exclusão
let treinosSelecionados = [];
let categorias = [];
let alunoParaTreino = null;
let cachePersonal = null; // cache global
let sortableTreinos = null;
let nomesTreinos = {};

let fotoAntesUrlTemp = null;
let fotoDepoisUrlTemp = null;

/* ============================================================
   TOKEN / AUTH
============================================================ */
function getToken() {
  return sessionStorage.getItem("token");
}

function logout() {
  sessionStorage.clear();
  window.location.href = "login.html";
}

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
      Authorization: `Bearer ${token}`,
    },
  });

  if (res.status === 401 || res.status === 403) {
    logout();
    throw new Error("Sessão expirada");
  }

  return res;
}

async function retryFetch(url, options = {}, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await authFetch(url, options);
    } catch (err) {
      if (i === retries - 1) throw err;
      const delay = 500 * Math.pow(2, i);
      await new Promise(r => setTimeout(r, delay));
    }
  }
}

/* ============================================================
   UTIL
============================================================ */
function formatarData(dataStr) {
  if (!dataStr) return "";
  const date = new Date(dataStr);
  const dia = String(date.getUTCDate()).padStart(2, "0");
  const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
  const ano = date.getUTCFullYear();
  return `${dia}/${mes}/${ano}`;
}

/* ============================================================
   TOAST
============================================================ */
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

/* ============================================================
   CLOUDINARY (IMAGENS)
============================================================ */
function setPreviewImagem(inputId, imgId) {
  const input = document.getElementById(inputId);
  const img = document.getElementById(imgId);
  if (!input || !img) return;

  input.addEventListener("change", () => {
    const file = input.files?.[0];
    if (!file) return;

    img.src = URL.createObjectURL(file);
    img.style.display = "block";
  });
}

async function uploadImagemCloudinary(file) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET_IMAGENS);

  const resCloud = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  const dataCloud = await resCloud.json();
  if (!resCloud.ok) throw new Error(dataCloud.error?.message || "Erro ao enviar imagem");

  return dataCloud.secure_url;
}

/* ============================================================
   PERSONAL LOGADO
============================================================ */
async function carregarPersonalLogado(forceReload = false) {
  if (!forceReload && cachePersonal) return cachePersonal;

  try {
    const token = getToken();
    if (!token) return;

    const res = await retryFetch(`${API_URL}/personal/logado`);
    if (!res.ok) throw new Error("Erro ao carregar dados do personal.");

    const data = await res.json();
    const personal = data.personal;

    if (!personal) throw new Error("Dados do personal não encontrados.");

    const fotoFinal = personal.foto_url
      ? (personal.foto_url.startsWith("http") ? personal.foto_url : `${API_URL}${personal.foto_url}`)
      : "img/undraw_profile.svg";

    document.getElementById("nomePersonal").textContent = personal.nome;
    document.getElementById("fotoTopbar").src = fotoFinal;

    cachePersonal = personal;
    return personal;

  } catch (err) {
    console.error(err);
    mostrarToast("Erro", err.message, "danger");
    return null;
  }
}

/* ============================================================
   TABELA ALUNOS
============================================================ */
function renderAlunos() {
  if (dataTable) {
    dataTable.clear();
    alunos.forEach(a => {
      dataTable.row.add([
        a.nome,
        a.foco,
        a.idade,
        formatarData(a.data_matricula),
        `<a href="javascript:void(0)" class="btn btn-warning btn-circle btn-sm btn-treino" data-nome="${a.nome}">
            <i class="fas fa-dumbbell"></i>
         </a>
         <a href="javascript:void(0)" class="btn btn-primary btn-circle btn-sm btn-editar" data-id="${a.id}">
            <i class="fas fa-edit"></i>
         </a>
         <a href="javascript:void(0)" class="btn btn-danger btn-circle btn-sm btn-excluir" data-id="${a.id}" data-nome="${a.nome}">
            <i class="fas fa-trash"></i>
         </a>`
      ]);
    });
    dataTable.draw();
  } else {
    dataTable = $("#dataTable").DataTable({
      data: alunos.map(a => [
        a.nome,
        a.foco,
        a.idade,
        formatarData(a.data_matricula),
        `<a href="javascript:void(0)" class="btn btn-warning btn-circle btn-sm btn-treino" data-nome="${a.nome}">
            <i class="fas fa-dumbbell"></i>
         </a>
         <a href="javascript:void(0)" class="btn btn-primary btn-circle btn-sm btn-editar" data-id="${a.id}">
            <i class="fas fa-edit"></i>
         </a>
         <a href="javascript:void(0)" class="btn btn-danger btn-circle btn-sm btn-excluir" data-id="${a.id}" data-nome="${a.nome}">
            <i class="fas fa-trash"></i>
         </a>`
      ]),
      columns: [
        { title: "Nome" },
        { title: "Foco" },
        { title: "Idade" },
        { title: "Data da Matrícula" },
        { title: "Ações", orderable: false, searchable: false }
      ],
      pageLength: 10,
      lengthChange: true,
      searching: true,
      ordering: true,
      info: true,
      autoWidth: false,
      language: {
        url: "//cdn.datatables.net/plug-ins/1.13.6/i18n/pt-BR.json",
        paginate: { previous: "Anterior", next: "Próximo" },
        search: "Pesquisar:",
        lengthMenu: "Mostrar _MENU_ cadastros",
        info: "Mostrando _START_ a _END_ de _TOTAL_ cadastros",
        infoEmpty: "Mostrando 0 a 0 de 0 cadastros",
        infoFiltered: "(filtrado de _MAX_ registros no total)",
        zeroRecords: "Nenhum cadastro encontrado",
        emptyTable: "Nenhum dado disponível na tabela"
      }
    });
  }
}

async function carregarAlunos() {
  const loader = document.getElementById("loaderTabelaAlunos");
  const tabelaWrapper = document.getElementById("tabelaAlunosWrapper");

  loader.style.display = "block";
  tabelaWrapper.style.display = "none";

  try {
    const res = await authFetch(`${API_URL}/personal/alunos`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.message || "Erro ao carregar alunos");
    }

    alunos = await res.json();
    renderAlunos();
    tabelaWrapper.style.display = "block";

  } catch (err) {
    console.error(err);
    mostrarToast("Erro", err.message, "danger");
  } finally {
    loader.style.display = "none";
  }
}

/* ============================================================
   CRUD ALUNO
============================================================ */
async function criarAluno() {
  const email = $("#novoEmail").val();
  const senha = $("#novaSenha").val();
  const confirmarSenha = $("#confirmarSenha").val();
  const nome = $("#novoNome").val();
  const foco = $("#novoFoco").val();
  const idade = $("#novaIdade").val();
  const data_matricula = $("#novaData").val();

  if (!email || !senha || !confirmarSenha || !nome || !foco || !idade || !data_matricula) {
    mostrarToast("Erro", "Preencha todos os campos!", "danger");
    return;
  }

  setLoadingBotaoCriar(true);

  try {
    const res = await authFetch(`${API_URL}/personal/alunos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, senha, confirmarSenha, nome, foco, idade, data_matricula })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao criar aluno");

    mostrarToast("Sucesso", "Aluno criado com sucesso!", "success");
    $("#modalCriarAluno").modal("hide");
    $("#formCriarAluno").trigger("reset");
    carregarAlunos();
  } catch (err) {
    console.error(err);
    mostrarToast("Erro", err.message, "danger");
  } finally {
    setLoadingBotaoCriar(false);
  }
}

async function editarAluno() {
  if (!alunoSelecionado) return;

  setLoadingBotaoEditar(true);

  const email = $("#editEmail").val();
  const nome = $("#editNome").val();
  const foco = $("#editFoco").val();
  const idade = $("#editIdade").val();
  const data_matricula = $("#editData").val();

  try {
    const fileAntes = document.getElementById("fotoAntesFile")?.files?.[0] || null;
    const fileDepois = document.getElementById("fotoDepoisFile")?.files?.[0] || null;

    if (fileAntes) fotoAntesUrlTemp = await uploadImagemCloudinary(fileAntes);
    if (fileDepois) fotoDepoisUrlTemp = await uploadImagemCloudinary(fileDepois);

    const payload = { email, nome, foco, idade, data_matricula };
    if (fotoAntesUrlTemp) payload.foto_antes_url = fotoAntesUrlTemp;
    if (fotoDepoisUrlTemp) payload.foto_depois_url = fotoDepoisUrlTemp;

    const res = await authFetch(`${API_URL}/personal/alunos/${alunoSelecionado.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao editar aluno");

    mostrarToast("Sucesso", "Aluno atualizado com sucesso!", "success");
    $("#modalEditarAluno").modal("hide");

    alunoSelecionado = null;
    await carregarAlunos();

  } catch (err) {
    console.error(err);
    mostrarToast("Erro", err.message, "danger");
  } finally {
    setLoadingBotaoEditar(false);
  }
}

async function excluirAluno() {
  if (!alunoSelecionado) return;

  setLoadingBotaoExcluir(true);

  try {
    const res = await authFetch(`${API_URL}/personal/alunos/${alunoSelecionado.id}`, {
      method: "DELETE"
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao excluir aluno");

    mostrarToast("Sucesso", "Aluno excluído com sucesso!", "success");
    $("#modalExcluirAluno").modal("hide");

    alunoSelecionado = null;
    carregarAlunos();

  } catch (err) {
    console.error(err);
    mostrarToast("Erro", err.message, "danger");
  } finally {
    setLoadingBotaoExcluir(false);
  }
}

/* ============================================================
   TREINOS DO ALUNO (NOMES + CONFIG)
============================================================ */
$("#btnSalvarNomeTreinos").on("click", function () {
  if (!nomesTreinos) nomesTreinos = {};

  $(".input-nome-treino").each(function () {
    const treino = $(this).data("treino");
    nomesTreinos[treino] = $(this).val().trim();
  });

  treinosSelecionados.forEach(t => {
    t.nome_treino = nomesTreinos[t.treino] || null;
  });

  $("#modalNomearTreinos").modal("hide");
  salvarTreinosNoBackend();
});

$(document).on("click", "#btnSalvarConfigTreinos", function () {
  setLoadingBotaoSalvarConfig(true);

  salvarValoresInputsVisiveis();
  atualizarOrdemTreinos();
  treinosSelecionados = normalizarOrdemPorCategoria(treinosSelecionados);

  setLoadingBotaoSalvarConfig(false);
  $("#modalNomearTreinos").modal("show");
});

function preencherModalNomeTreinos() {
  if (!nomesTreinos) nomesTreinos = {};

  $(".input-nome-treino").each(function () {
    const treino = $(this).data("treino");
    $(this).val(nomesTreinos[treino] ?? "");
  });
}

$("#modalNomearTreinos").on("shown.bs.modal", function () {
  preencherModalNomeTreinos();
});

async function salvarTreinosNoBackend() {
  setLoadingBotaoSalvarConfig(true);

  try {
    const res = await authFetch(`${API_URL}/personal/alunos/treinos/salvar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        aluno_id: alunoParaTreino.id,
        treinos: treinosSelecionados
      })
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Erro ao salvar treinos");

    mostrarToast("Sucesso", "Treinos atualizados com sucesso!", "success");
    $("#modalConfigTreinos").modal("hide");

  } catch (err) {
    console.error(err);
    mostrarToast("Erro", err.message, "danger");
  } finally {
    setLoadingBotaoSalvarConfig(false);
  }
}

/* ============================================================
   CATEGORIAS / EXERCICIOS
============================================================ */
async function carregarCategoriasExerciciosComNomes() {
  try {
    const res = await authFetch(`${API_URL}/personal/categorias`);
    const categorias = await res.json();

    for (const cat of categorias) {
      const resEx = await authFetch(`${API_URL}/personal/exercicios/categoria/${cat.id}`);
      const exercicios = await resEx.json();
      cat.exercicios = exercicios.map(ex => ({ ...ex, categoria_nome: cat.nome }));
    }

    return categorias;
  } catch (err) {
    console.error(err);
    mostrarToast("Erro", err.message, "danger");
    return [];
  }
}

async function carregarTreinosDoAluno(alunoId) {
  try {
    const res = await authFetch(`${API_URL}/personal/alunos/${alunoId}/treinos`);
    if (!res.ok) throw new Error("Erro ao carregar treinos do aluno");

    const treinos = await res.json();

    nomesTreinos = {};
    treinos.forEach(t => {
      if (t.treino && t.nome_treino) nomesTreinos[t.treino] = t.nome_treino;
    });

    return treinos;
  } catch (err) {
    console.error(err);
    mostrarToast("Erro", err.message, "danger");
    return [];
  }
}

/* ============================================================
   CONFIG TREINOS (render/drag/filtro)
   (mantive suas funções SEM alterar lógica)
============================================================ */
function renderizarConfigTreinos() {
  treinosSelecionados.sort((a, b) => {
    if (a.treino !== b.treino) return a.treino.localeCompare(b.treino);
    const ordemA = Number(a.ordem) || 999;
    const ordemB = Number(b.ordem) || 999;
    return ordemA - ordemB;
  });

  let html = "";

  treinosSelecionados.forEach(t => {
    html += `
      <div class="card mb-3 card-treino" data-id="${t.exercicio_id}" data-treino="${t.treino}">
        <div class="card-header d-flex justify-content-between align-items-center font-weight-bold header-treino" style="cursor:pointer;">
          <div>
            <i class="fas fa-grip-vertical mr-2 text-muted drag-handle"></i>
            <i class="fas fa-chevron-down mr-2 toggle-icon"></i>
            ${t.exercicio_nome}
            <span class="text-muted">(${t.categoria_nome})</span>
          </div>
          <span class="badge badge-primary badge-treino" data-id="${t.exercicio_id}">Treino ${t.treino}</span>
        </div>

        <div class="card-body body-treino">
          <div class="form-row d-flex flex-wrap">
            <div class="form-group col-6 col-sm-4 col-md-2">
              <label>Treino</label>
              <select class="form-control input-treino" data-id="${t.exercicio_id}">
                <option value="A" ${t.treino === "A" ? "selected" : ""}>A</option>
                <option value="B" ${t.treino === "B" ? "selected" : ""}>B</option>
                <option value="C" ${t.treino === "C" ? "selected" : ""}>C</option>
                <option value="D" ${t.treino === "D" ? "selected" : ""}>D</option>
                <option value="E" ${t.treino === "E" ? "selected" : ""}>E</option>
              </select>
            </div>

            <div class="form-group col-6 col-sm-4 col-md-2">
              <label>Séries</label>
              <input type="number" class="form-control input-series" data-id="${t.exercicio_id}" value="${t.series}">
            </div>

            <div class="form-group col-6 col-sm-4 col-md-2">
              <label>Repetições</label>
              <input type="number" class="form-control input-repeticoes" data-id="${t.exercicio_id}" value="${t.repeticoes}">
            </div>

            <div class="form-group col-6 col-sm-4 col-md-2">
              <label>Peso</label>
              <input type="number" class="form-control input-peso" data-id="${t.exercicio_id}" value="${t.peso}">
            </div>

            <div class="form-group col-6 col-sm-4 col-md-2">
              <label>Intervalo (seg)</label>
              <input type="number" class="form-control input-intervalo" data-id="${t.exercicio_id}" value="${t.intervalo_seg}">
            </div>
            <div class="form-group col-12">
              <label>Descrição</label>
              <textarea
                class="form-control input-descricao"
                rows="2"
                data-id="${t.exercicio_id}"
                placeholder="Observações, técnica, execução..."
              >${t.descricao ?? ""}</textarea>
            </div>

          </div>
        </div>
      </div>
    `;
  });

  $("#listaConfigsTreinos").html(html);
  ativarDragOrdem();
}

function renderizarPorFiltroTreino(treinoFiltro) {
  let lista = [...treinosSelecionados];
  if (treinoFiltro !== "todos") lista = lista.filter(t => t.treino === treinoFiltro);

  let html = "";

  lista.forEach(t => {
    html += `
      <div class="card mb-3 card-treino" data-id="${t.exercicio_id}" data-treino="${t.treino}">
        <div class="card-header d-flex justify-content-between align-items-center font-weight-bold header-treino">
          <div>
            <i class="fas fa-grip-vertical mr-2 text-muted drag-handle"></i>
            <i class="fas fa-chevron-down mr-2 toggle-icon"></i>
            ${t.exercicio_nome}
            <span class="text-muted">(${t.categoria_nome})</span>
          </div>
          <span class="badge badge-primary badge-treino" data-id="${t.exercicio_id}">Treino ${t.treino}</span>
        </div>

        <div class="card-body body-treino">
          <div class="form-row d-flex flex-wrap">
            <div class="form-group col-6 col-sm-4 col-md-2">
              <label>Treino</label>
              <select class="form-control input-treino" data-id="${t.exercicio_id}">
                ${["A","B","C","D","E"].map(l => `<option value="${l}" ${t.treino === l ? "selected" : ""}>${l}</option>`).join("")}
              </select>
            </div>

            <div class="form-group col-6 col-sm-4 col-md-2">
              <label>Séries</label>
              <input type="number" class="form-control input-series" data-id="${t.exercicio_id}" value="${t.series}">
            </div>

            <div class="form-group col-6 col-sm-4 col-md-2">
              <label>Repetições</label>
              <input type="number" class="form-control input-repeticoes" data-id="${t.exercicio_id}" value="${t.repeticoes}">
            </div>

            <div class="form-group col-6 col-sm-4 col-md-2">
              <label>Peso</label>
              <input type="number" class="form-control input-peso" data-id="${t.exercicio_id}" value="${t.peso}">
            </div>

            <div class="form-group col-6 col-sm-4 col-md-2">
              <label>Intervalo</label>
              <input type="number" class="form-control input-intervalo" data-id="${t.exercicio_id}" value="${t.intervalo_seg}">
            </div>
          </div>
        </div>
      </div>
    `;
  });

  $("#listaConfigsTreinos").html(html);
  ativarDragOrdem();
}

function atualizarOrdemTreinos() {
  const ordemPorId = {};
  $("#listaConfigsTreinos .card-treino").each(function (index) {
    const id = Number($(this).data("id"));
    ordemPorId[id] = index + 1;
  });

  treinosSelecionados.forEach(t => {
    if (ordemPorId[t.exercicio_id] != null) t.ordem = ordemPorId[t.exercicio_id];
  });
}

function salvarValoresInputsVisiveis() {
  $("#listaConfigsTreinos .card-treino").each(function () {
    const exercicioId = Number($(this).data("id"));
    const treinoObj = treinosSelecionados.find(t => t.exercicio_id === exercicioId);
    if (!treinoObj) return;

    treinoObj.series = Number($(this).find(".input-series").val()) || 0;
    treinoObj.repeticoes = Number($(this).find(".input-repeticoes").val()) || 0;
    treinoObj.peso = Number($(this).find(".input-peso").val()) || 0;
    treinoObj.intervalo_seg = Number($(this).find(".input-intervalo").val()) || 0;
    treinoObj.descricao = $(this).find(".input-descricao").val().trim();
    treinoObj.treino = $(this).find(".input-treino").val();
  });
}

function ativarDragOrdem() {
  const container = document.getElementById("listaConfigsTreinos");
  if (!container) return;

  if (sortableTreinos) {
    sortableTreinos.destroy();
    sortableTreinos = null;
  }

  sortableTreinos = Sortable.create(container, {
    animation: 150,
    handle: ".drag-handle",
    forceFallback: true,
    fallbackOnBody: true,
    scroll: true,
    scrollSensitivity: 60,
    scrollSpeed: 15,
    touchStartThreshold: 5,
    ghostClass: "drag-ghost",
    chosenClass: "drag-chosen",
    onEnd() {
      atualizarOrdemTreinos();
    }
  });
}

function normalizarOrdemPorCategoria(treinos) {
  const resultado = [];
  const porTreino = {};

  treinos.forEach(t => {
    if (!porTreino[t.treino]) porTreino[t.treino] = [];
    porTreino[t.treino].push(t);
  });

  Object.keys(porTreino).sort().forEach(treinoLetra => {
    const lista = porTreino[treinoLetra];
    lista.sort((a, b) => (a.ordem || 999) - (b.ordem || 999));

    const categoriasMap = new Map();
    lista.forEach(item => {
      const cat = item.categoria_nome || "Outros";
      if (!categoriasMap.has(cat)) categoriasMap.set(cat, []);
      categoriasMap.get(cat).push(item);
    });

    let ordemGlobal = 1;
    categoriasMap.forEach(listaCategoria => {
      listaCategoria.forEach(item => {
        item.ordem = ordemGlobal++;
        resultado.push(item);
      });
    });
  });

  return resultado;
}

/* ============================================================
   EVENTOS
============================================================ */
$("#btnCriarAluno").on("click", criarAluno);
$("#btnSalvarAluno").on("click", editarAluno);
$("#btnConfirmarExcluir").on("click", excluirAluno);

$("#btnConfirmLogout").on("click", async function () {
  setLoadingBotaoLogout(true);

  try {
    sessionStorage.clear();
    window.location.href = "login.html";
  } catch (err) {
    console.error(err);
    mostrarToast("Erro", "Não foi possível sair.", "danger");
  } finally {
    setLoadingBotaoLogout(false);
  }
});


$('#dataTable tbody').on('click', '.btn-editar', function () {
  const id = $(this).data('id');
  alunoSelecionado = alunos.find(a => a.id === id);
  if (!alunoSelecionado) return;

  $("#editEmail").val(alunoSelecionado.email);
  $("#editNome").val(alunoSelecionado.nome);
  $("#editFoco").val(alunoSelecionado.foco);
  $("#editIdade").val(alunoSelecionado.idade);
  $("#editData").val(alunoSelecionado.data_matricula ? alunoSelecionado.data_matricula.split('T')[0] : '');

  // limpa temporários e inputs
  fotoAntesUrlTemp = null;
  fotoDepoisUrlTemp = null;
  $("#fotoAntesFile").val("");
  $("#fotoDepoisFile").val("");

  // previews existentes (se o backend retornar)
  if (alunoSelecionado.foto_antes_url) {
    $("#previewFotoAntes").attr("src", alunoSelecionado.foto_antes_url).show();
  } else {
    $("#previewFotoAntes").hide().attr("src", "");
  }

  if (alunoSelecionado.foto_depois_url) {
    $("#previewFotoDepois").attr("src", alunoSelecionado.foto_depois_url).show();
  } else {
    $("#previewFotoDepois").hide().attr("src", "");
  }

  $("#modalEditarAluno").modal("show");
});

$('#dataTable tbody').on('click', '.btn-excluir', function () {
  const id = $(this).data('id');
  const nome = $(this).data('nome');
  alunoSelecionado = alunos.find(a => a.id === id);
  $("#nomeAlunoExcluir").text(nome);
  $("#modalExcluirAluno").modal("show");
});

/* ---------- Modal treinos ---------- */
$('#dataTable tbody').on('click', '.btn-treino', function () {
  treinosSelecionados = [];
  $("#listaCategorias").empty();
  $("#listaConfigsTreinos").empty();

  const nome = $(this).data('nome');
  alunoParaTreino = alunos.find(a => a.nome === nome);
  if (!alunoParaTreino) return;

  $("#nomeAlunoTreino").text(alunoParaTreino.nome);
  $("#modalTreinos").modal("show");

  $("#modalTreinos").one('shown.bs.modal', async function () {
    $("#loaderTreinosVincular").removeClass("d-none");
    $("#listaCategorias").addClass("d-none");

    try {
      categorias = await carregarCategoriasExerciciosComNomes();
      const treinosVinculados = await carregarTreinosDoAluno(alunoParaTreino.id);

      $("#modalTreinos").data('treinosVinculados', treinosVinculados);
      const idsVinculados = treinosVinculados.map(t => Number(t.exercicio_id));

      let html = '';

      for (const cat of categorias) {
        if (!cat.exercicios?.length) continue;

        let exHtml = '';
        for (const ex of cat.exercicios) {
          const checked = idsVinculados.includes(Number(ex.id)) ? 'checked' : '';
          exHtml += `
            <div class="form-check">
              <input class="form-check-input exercicio-checkbox" type="checkbox"
                     value="${ex.id}" id="exercicio-${ex.id}" ${checked}>
              <label class="form-check-label" for="exercicio-${ex.id}">
                ${ex.nome}
              </label>
            </div>
          `;
        }

        html += `
          <div class="card mb-2 card-categoria">
            <div class="card-header bg-light d-flex justify-content-between align-items-center header-categoria" style="cursor:pointer;">
              <span>
                <i class="fas fa-chevron-down mr-2 toggle-icon-categoria"></i>
                ${cat.nome}
              </span>
              <span class="badge badge-secondary">${cat.exercicios.length}</span>
            </div>
            <div class="card-body body-categoria">
              ${exHtml}
            </div>
          </div>
        `;
      }

      $("#listaCategorias").html(html);

    } catch (err) {
      console.error(err);
      mostrarToast("Erro", "Erro ao carregar treinos", "danger");
    } finally {
      $("#loaderTreinosVincular").addClass("d-none");
      $("#listaCategorias").removeClass("d-none");
    }
  });
});

$("#btnSalvarTreinos").on("click", async function () {
  if ($(this).prop("disabled")) return;
  setLoadingBotaoConfigurar(true);

  try {
    const treinosVinculados = $("#modalTreinos").data('treinosVinculados') || [];
    const idsVinculados = treinosVinculados.map(t => t.exercicio_id);

    treinosSelecionados = [];
    const idsSelecionados = $(".exercicio-checkbox:checked").map(function () {
      return Number($(this).val());
    }).get();

    const idsParaAdicionar = idsSelecionados.filter(id => !idsVinculados.includes(id));
    const idsParaDeletar = idsVinculados.filter(id => !idsSelecionados.includes(id));

    for (const cat of categorias) {
      for (const ex of cat.exercicios) {
        if (idsSelecionados.includes(ex.id)) {
          const treinoAntigo = treinosVinculados.find(t => t.exercicio_id === ex.id);

          treinosSelecionados.push({
            exercicio_id: ex.id,
            treino: treinoAntigo?.treino || 'A',
            exercicio_nome: ex.nome,
            categoria_nome: ex.categoria_nome,
            series: treinoAntigo?.series || 0,
            repeticoes: treinoAntigo?.repeticoes || 0,
            peso: treinoAntigo?.peso || 0,
            intervalo_seg: treinoAntigo?.intervalo_seg || 0,
            ordem: treinoAntigo?.ordem || 0,
            descricao: treinoAntigo?.descricao || ""
          });
        }
      }
    }

    $("#modalTreinos").modal("hide");
    $("#modalConfigTreinos").modal("show");

    $("#modalConfigTreinos").data('idsParaAdicionar', idsParaAdicionar);
    $("#modalConfigTreinos").data('idsParaDeletar', idsParaDeletar);

    $("#modalConfigTreinos").one("shown.bs.modal", () => {
      renderizarConfigTreinos();
      setLoadingBotaoConfigurar(false);
    });

  } catch (err) {
    console.error(err);
    mostrarToast("Erro", "Erro ao configurar treinos", "danger");
    setLoadingBotaoConfigurar(false);
  }
});

/* ---------- Filtro / accordions ---------- */
$(document).on("click", ".filtro-treino", function (e) {
  e.preventDefault();
  salvarValoresInputsVisiveis();

  const treinoSelecionado = $(this).data("treino");
  treinosSelecionados = normalizarOrdemPorCategoria(treinosSelecionados);
  renderizarPorFiltroTreino(treinoSelecionado);
});

$(document).on("change", ".input-treino", function () {
  const exercicioId = $(this).data("id");
  const novoTreino = $(this).val();

  const card = $(`.card-treino[data-id="${exercicioId}"], .card-treino:has(.input-treino[data-id="${exercicioId}"])`);
  card.attr("data-treino", novoTreino);

  const badge = $(`.badge-treino[data-id="${exercicioId}"]`);
  badge.text(`Treino ${novoTreino}`);

  const treinoObj = treinosSelecionados.find(t => t.exercicio_id === exercicioId);
  if (treinoObj) treinoObj.treino = novoTreino;
});

$(document).on("click", ".header-treino", function (e) {
  if ($(e.target).is("select, option, .badge, .badge *")) return;

  const card = $(this).closest(".card");
  const body = card.find(".body-treino");
  const icon = $(this).find(".toggle-icon");

  body.slideToggle(200);
  icon.toggleClass("fa-chevron-down fa-chevron-right");
});

$(document).on("click", ".header-categoria", function (e) {
  if ($(e.target).is("input, label")) return;

  const card = $(this).closest(".card-categoria");
  const body = card.find(".body-categoria");
  const icon = $(this).find(".toggle-icon-categoria");

  body.slideToggle(200);
  icon.toggleClass("fa-chevron-down fa-chevron-right");
});

/* ============================================================
   MENU PERFIL / FECHAMENTOS
============================================================ */
document.getElementById("btnLogoutMenu")?.addEventListener("click", (e) => {
  e.preventDefault();
  $("#logoutModal").modal("show");
});

/* ============================================================
   LOADINGS
============================================================ */
function setLoadingBotaoCriar(loading) {
  const btn = document.getElementById("btnCriarAluno");
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-border");

  if (loading) {
    btn.disabled = true;
    text.classList.add("d-none");
    spinner.classList.remove("d-none");
  } else {
    btn.disabled = false;
    text.classList.remove("d-none");
    spinner.classList.add("d-none");
  }
}

function setLoadingBotaoConfigurar(loading) {
  const btn = document.getElementById("btnSalvarTreinos");
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-border");

  if (loading) {
    btn.disabled = true;
    text.classList.add("d-none");
    spinner.classList.remove("d-none");
  } else {
    btn.disabled = false;
    text.classList.remove("d-none");
    spinner.classList.add("d-none");
  }
}

function setLoadingBotaoSalvarConfig(loading) {
  const btn = document.getElementById("btnSalvarConfigTreinos");
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-border");

  if (loading) {
    btn.disabled = true;
    text.classList.add("d-none");
    spinner.classList.remove("d-none");
  } else {
    btn.disabled = false;
    text.classList.remove("d-none");
    spinner.classList.add("d-none");
  }
}

function setLoadingBotaoLogout(loading) {
  const btn = document.getElementById("btnConfirmLogout");
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-border");

  if (loading) {
    btn.disabled = true;
    text.classList.add("d-none");
    spinner.classList.remove("d-none");
  } else {
    btn.disabled = false;
    text.classList.remove("d-none");
    spinner.classList.add("d-none");
  }
}

function setLoadingBotaoEditar(loading) {
  const btn = document.getElementById("btnSalvarAluno");
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-border");

  if (loading) {
    btn.disabled = true;
    text.classList.add("d-none");
    spinner.classList.remove("d-none");
  } else {
    btn.disabled = false;
    text.classList.remove("d-none");
    spinner.classList.add("d-none");
  }
}

function setLoadingBotaoExcluir(loading) {
  const btn = document.getElementById("btnConfirmarExcluir");
  if (!btn) return;
  const text = btn.querySelector(".btn-text");
  const spinner = btn.querySelector(".spinner-border");

  if (loading) {
    btn.disabled = true;
    text.classList.add("d-none");
    spinner.classList.remove("d-none");
  } else {
    btn.disabled = false;
    text.classList.remove("d-none");
    spinner.classList.add("d-none");
  }
}

/* ============================================================
   INIT (ÚNICO)
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
  const token = getToken();
  if (!token) {
    logout();
    return;
  }

  // previews antes/depois
  setPreviewImagem("fotoAntesFile", "previewFotoAntes");
  setPreviewImagem("fotoDepoisFile", "previewFotoDepois");

  // menu perfil
  const fotoTopbar = document.getElementById("btnPerfil");
  const menuPerfil = document.getElementById("menuPerfil");

  fotoTopbar?.addEventListener("click", (e) => {
    e.stopPropagation();
    menuPerfil.style.display = menuPerfil.style.display === "block" ? "none" : "block";
  });

  document.addEventListener("click", () => {
    if (menuPerfil) menuPerfil.style.display = "none";
  });

  carregarPersonalLogado();
  carregarAlunos();
});
