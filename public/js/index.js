const API_URL = "https://sistema-personal.vercel.app";
let alunos = [];
let dataTable;
let alunoSelecionado = null; // usado para edição e exclusão
let treinosSelecionados = [];
let categorias = [];
let alunoParaTreino = null;

// -----------------------------------
// PEGAR TOKEN
// -----------------------------------
function getToken() {
    return sessionStorage.getItem("token");
}
function logout() {
    sessionStorage.clear();
    window.location.href = "login.html";
}

document.getElementById("btnConfirmLogout")?.addEventListener("click", async function () {
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

    // Token expirado ou inválido
    if (res.status === 401 || res.status === 403) {
        logout();
        throw new Error("Sessão expirada");
    }

    return res;
}


// -----------------------------------
// FORMATAR DATA (dd/mm/yyyy)
// -----------------------------------
function formatarData(dataStr) {
    if (!dataStr) return '';
    const date = new Date(dataStr);
    const dia = String(date.getDate()).padStart(2, '0');
    const mes = String(date.getMonth() + 1).padStart(2, '0');
    const ano = date.getFullYear();
    return `${dia}/${mes}/${ano}`;
}

// -----------------------------------
// MOSTRAR TOAST
// -----------------------------------
function mostrarToast(titulo, mensagem, tipo = "info") {
    const toast = $("#toastMessage");
    const header = toast.find(".toast-header");

    header.removeClass("bg-danger bg-success bg-primary text-white");

    if (tipo === "success") header.addClass("bg-success text-white");
    if (tipo === "danger") header.addClass("bg-danger text-white");
    if (tipo === "primary") header.addClass("bg-primary text-white");

    $("#toastTitle").text(titulo);
    $("#toastBody").text(mensagem);

    toast.css("display", "block"); // 🔥 MOSTRA
    toast.toast("show");
}

$('#toastMessage').on('hidden.bs.toast', function () {
    $(this).css("display", "none"); // 🔥 ESCONDE novamente
});

// -----------------------------------
// CARREGAR DADOS DO PERSONAL LOGADO
// -----------------------------------
async function carregarPersonalLogado() {
    try {
        const token = getToken();
        if (!token) return;

        const res = await authFetch(`${API_URL}/personal/logado`)

        if (!res.ok) throw new Error("Erro ao carregar dados do personal.");

        const data = await res.json();
        const personal = data.personal;

        if (!personal) return;

        const fotoFinal = personal.foto_url
            ? (personal.foto_url.startsWith('http') ? personal.foto_url : `${API_URL}${personal.foto_url}`)
            : "img/undraw_profile.svg";


        document.getElementById("nomePersonal").textContent = personal.nome;
        document.getElementById("fotoTopbar").src = fotoFinal;

    } catch (err) {
        console.error(err);
    }
}


// Rodar ao carregar a página
document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();
    if (token) {
        carregarPersonalLogado();
        carregarAlunos();
    } else {
        mostrarToast("Erro", "Você não está logado.", "danger");
    }
});


// -----------------------------------
// RENDERIZAR TABELA
// -----------------------------------
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
                paginate: {
                    previous: "Anterior",
                    next: "Próximo"
                },
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

// -----------------------------------
// CARREGAR ALUNOS
// -----------------------------------
async function carregarAlunos() {
    const loader = document.getElementById("loaderTabelaAlunos");
    const tabelaWrapper = document.getElementById("tabelaAlunosWrapper");

    loader.style.display = "block";      // mostrar loader
    tabelaWrapper.style.display = "none"; // esconder tabela

    try {
        const token = getToken();
        if (!token) throw new Error("Token não encontrado. Faça login novamente.");

        const res = await authFetch(`${API_URL}/personal/alunos`);

        if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || "Erro ao carregar alunos");
        }

        alunos = await res.json();
        renderAlunos();

        tabelaWrapper.style.display = "block"; // mostrar tabela
    } catch (err) {
        console.error(err);
        mostrarToast("Erro", err.message, "danger");
    } finally {
        loader.style.display = "none"; // esconder loader
    }
}



// -----------------------------------
// CRIAR ALUNO
// -----------------------------------
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
            body: JSON.stringify({
                email, senha, confirmarSenha, nome, foco, idade, data_matricula
            })
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


// -----------------------------------
// EDITAR ALUNO
// -----------------------------------
async function editarAluno() {
    if (!alunoSelecionado) return;

    setLoadingBotaoEditar(true);

    const email = $("#editEmail").val();
    const nome = $("#editNome").val();
    const foco = $("#editFoco").val();
    const idade = $("#editIdade").val();
    const data_matricula = $("#editData").val();

    try {
        const token = getToken();
        const res = await authFetch(`${API_URL}/personal/alunos/${alunoSelecionado.id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ email, nome, foco, idade, data_matricula })
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Erro ao editar aluno");

        mostrarToast("Sucesso", "Aluno atualizado com sucesso!", "success");
        $("#modalEditarAluno").modal("hide");
        alunoSelecionado = null;
        carregarAlunos();
    } catch (err) {
        console.error(err);
        mostrarToast("Erro", err.message, "danger");
    } finally {
        setLoadingBotaoEditar(false);
    }
}


// -----------------------------------
// EXCLUIR ALUNO
// -----------------------------------
async function excluirAluno() {
    if (!alunoSelecionado) return;

    setLoadingBotaoExcluir(true);

    try {
        const token = getToken();
        const res = await authFetch(`${API_URL}/personal/alunos/${alunoSelecionado.id}`, {
            method: "DELETE",
            headers: { "Authorization": `Bearer ${token}` }
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

// -----------------------------------
// EVENTOS
// -----------------------------------
$("#btnCriarAluno").on("click", criarAluno);
$("#btnSalvarAluno").on("click", editarAluno);
$("#btnConfirmarExcluir").on("click", excluirAluno);

// Delegação de eventos para botões da tabela
$('#dataTable tbody').on('click', '.btn-editar', function () {
    const id = $(this).data('id');
    alunoSelecionado = alunos.find(a => a.id === id);
    if (!alunoSelecionado) return;

    $("#editEmail").val(alunoSelecionado.email);
    $("#editNome").val(alunoSelecionado.nome);
    $("#editFoco").val(alunoSelecionado.foco);
    $("#editIdade").val(alunoSelecionado.idade);
    $("#editData").val(alunoSelecionado.data_matricula ? alunoSelecionado.data_matricula.split('T')[0] : '');
    $("#modalEditarAluno").modal("show");
});

$('#dataTable tbody').on('click', '.btn-excluir', function () {
    const id = $(this).data('id');
    const nome = $(this).data('nome');
    alunoSelecionado = alunos.find(a => a.id === id);
    $("#nomeAlunoExcluir").text(nome);
    $("#modalExcluirAluno").modal("show");
});

$('#dataTable tbody').on('click', '.btn-treino', function () {

    treinosSelecionados = [];
    $("#listaCategorias").empty();
    $("#listaConfigsTreinos").empty();

    const nome = $(this).data('nome');
    alunoParaTreino = alunos.find(a => a.nome === nome);
    if (!alunoParaTreino) return;

    $("#nomeAlunoTreino").text(alunoParaTreino.nome);

    // Abre o modal
    $("#modalTreinos").modal("show");

    // 🔥 Quando o modal terminar de abrir
    $("#modalTreinos").one('shown.bs.modal', async function () {

        // MOSTRA LOADER
        $("#loaderTreinosVincular").removeClass("d-none");
        $("#listaCategorias").addClass("d-none");

        try {
            categorias = await carregarCategoriasExerciciosComNomes();
            const treinosVinculados = await carregarTreinosDoAluno(alunoParaTreino.id);

            // 🔥 SALVA NO MODAL (ESSENCIAL)
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
                            <input class="form-check-input exercicio-checkbox"
                                   type="checkbox"
                                   value="${ex.id}"
                                   id="exercicio-${ex.id}"
                                   ${checked}>
                            <label class="form-check-label" for="exercicio-${ex.id}">
                                ${ex.nome}
                            </label>
                        </div>
                    `;
                }

                html += `
                    <div class="card mb-2">
                        <div class="card-header bg-light">${cat.nome}</div>
                        <div class="card-body">${exHtml}</div>
                    </div>
                `;
            }

            $("#listaCategorias").html(html);

        } catch (err) {
            console.error(err);
            mostrarToast("Erro", "Erro ao carregar treinos", "danger");
        } finally {
            // ESCONDE LOADER
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
                        intervalo_seg: treinoAntigo?.intervalo_seg || 0
                    });
                }
            }
        }

        // Fecha o modal de seleção e abre o modal de configuração
        $("#modalTreinos").modal("hide");
        $("#modalConfigTreinos").modal("show");

        // Salva IDs para adicionar/deletar no modal de configuração
        $("#modalConfigTreinos").data('idsParaAdicionar', idsParaAdicionar);
        $("#modalConfigTreinos").data('idsParaDeletar', idsParaDeletar);

        // Renderiza os exercícios no modal de configuração quando abrir
        $("#modalConfigTreinos").one("shown.bs.modal", () => {
            renderizarConfigTreinos();   // 🔥 Renderiza os inputs
            setLoadingBotaoConfigurar(false);
        });

    } catch (err) {
        console.error(err);
        mostrarToast("Erro", "Erro ao configurar treinos", "danger");
        setLoadingBotaoConfigurar(false);
    }
});

// Função para renderizar os exercícios selecionados no modal de configuração
function renderizarConfigTreinos() {
    let html = "";

    treinosSelecionados.forEach(t => {
        html += `
            <div class="card mb-3">
                <div class="card-header font-weight-bold">
                    ${t.exercicio_nome}
                    <span class="text-muted">(${t.categoria_nome})</span>
                </div>

                <div class="card-body">
                    <div class="form-row d-flex flex-wrap">

                        <div class="form-group col-6 col-sm-4 col-md-2">
                            <label>Treino</label>
                            <select class="form-control input-treino" data-id="${t.exercicio_id}">
                                <option value="A" ${t.treino === 'A' ? 'selected' : ''}>A</option>
                                <option value="B" ${t.treino === 'B' ? 'selected' : ''}>B</option>
                                <option value="C" ${t.treino === 'C' ? 'selected' : ''}>C</option>
                            </select>
                        </div>

                        <div class="form-group col-6 col-sm-4 col-md-2">
                            <label>Séries</label>
                            <input type="number"
                                   class="form-control input-series"
                                   data-id="${t.exercicio_id}"
                                   value="${t.series}">
                        </div>

                        <div class="form-group col-6 col-sm-4 col-md-2">
                            <label>Repetições</label>
                            <input type="number"
                                   class="form-control input-repeticoes"
                                   data-id="${t.exercicio_id}"
                                   value="${t.repeticoes}">
                        </div>

                        <div class="form-group col-6 col-sm-4 col-md-2">
                            <label>Peso</label>
                            <input type="number"
                                   class="form-control input-peso"
                                   data-id="${t.exercicio_id}"
                                   value="${t.peso}">
                        </div>

                        <div class="form-group col-6 col-sm-4 col-md-2">
                            <label>Intervalo (seg)</label>
                            <input type="number"
                                   class="form-control input-intervalo"
                                   data-id="${t.exercicio_id}"
                                   value="${t.intervalo_seg}">
                        </div>

                    </div>
                </div>
            </div>
        `;
    });

    $("#listaConfigsTreinos").html(html);
}







$("#btnSalvarConfigTreinos").on("click", async function () {
    setLoadingBotaoSalvarConfig(true);

    // Pegar valores digitados
    treinosSelecionados.forEach(t => {
        t.series = Number($(`.input-series[data-id="${t.exercicio_id}"]`).val());
        t.repeticoes = Number($(`.input-repeticoes[data-id="${t.exercicio_id}"]`).val());
        t.peso = Number($(`.input-peso[data-id="${t.exercicio_id}"]`).val());
        t.intervalo_seg = Number($(`.input-intervalo[data-id="${t.exercicio_id}"]`).val());
        t.treino = $(`.input-treino[data-id="${t.exercicio_id}"]`).val();
    });

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
    }  finally {
        setLoadingBotaoSalvarConfig(false); // termina o loading
    }
});





function carregarPersonalTopo() {
    const nome = sessionStorage.getItem("personal_nome");
    const foto = sessionStorage.getItem("personal_foto");

    if (nome) {
        const nomeEl = document.getElementById("nomePersonal");
        if (nomeEl) nomeEl.textContent = nome;
    }

    if (foto) {
        const fotoEl = document.getElementById("fotoTopbar");
        if (fotoEl) fotoEl.src = foto;
    }
}

async function carregarCategoriasExercicios() {
    try {
        const res = await authFetch(`${API_URL}/personal/categorias`);
        if (!res.ok) throw new Error("Erro ao carregar categorias");
        const categorias = await res.json();

        let html = '';

        for (const cat of categorias) {
            // Buscar exercícios da categoria
            const resEx = await authFetch(`${API_URL}/personal/exercicios/categoria/${cat.id}`);
            if (!resEx.ok) continue;
            const exercicios = await resEx.json();

            // Se a categoria não tiver exercícios, pula
            if (!exercicios.length) continue;

            let exHtml = '';
            for (const ex of exercicios) {
                exHtml += `
                    <div class="form-check">
                        <input class="form-check-input exercicio-checkbox" type="checkbox" 
                               value="${ex.id}" id="exercicio-${ex.id}">
                        <label class="form-check-label" for="exercicio-${ex.id}">
                            ${ex.nome}
                        </label>
                    </div>
                `;
            }

            html += `<div class="card mb-2">
                        <div class="card-header bg-light">${cat.nome}</div>
                        <div class="card-body" id="categoria-${cat.id}">
                            ${exHtml}
                        </div>
                     </div>`;
        }

        // Renderiza apenas categorias com exercícios
        $("#listaCategorias").html(html);

    } catch (err) {
        console.error(err);
        mostrarToast("Erro", err.message, "danger");
    }
}
// Função para buscar categorias junto com exercícios
async function carregarCategoriasExerciciosComNomes() {
    try {
        const res = await authFetch(`${API_URL}/personal/categorias`);
        const categorias = await res.json();

        // Para cada categoria, buscar seus exercícios
        for (const cat of categorias) {
            const resEx = await authFetch(`${API_URL}/personal/exercicios/categoria/${cat.id}`);
            const exercicios = await resEx.json();
            // Adiciona o nome da categoria a cada exercício
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
        return treinos; // array de objetos { exercicio_id, ... }
    } catch (err) {
        console.error(err);
        mostrarToast("Erro", err.message, "danger");
        return [];
    }
}









// -----------------------------------
// INÍCIO
// -----------------------------------
document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();

    if (!token) {
        logout();
        return;
    }

    carregarPersonalLogado();
    carregarAlunos();
});

//Funções pra fechar o Modal com a opção do X
// Fechar modais
document.querySelectorAll(".btnFecharModal").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.getAttribute("data-target");
        if (target) $(target).modal("hide");
    });
});

// Fechar toast
document.querySelectorAll(".btnFecharToast").forEach(btn => {
    btn.addEventListener("click", () => {
        $('#toastMessage').toast('hide');
    });
});



document.addEventListener("DOMContentLoaded", () => {

    document.getElementById("fechar-btnAdd")?.addEventListener("click", () => {
        $("#modalCriarAluno").modal("hide");
    });

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

// Funções de Loading (bolinha)
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

