const API_URL = "https://sistema-personal.vercel.app";

let dataTableCreditos = null;
let cachePersonal = null;

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

function formatarData(dataStr) {
    if (!dataStr) return "-";

    const date = new Date(dataStr);
    const dia = String(date.getUTCDate()).padStart(2, "0");
    const mes = String(date.getUTCMonth() + 1).padStart(2, "0");
    const ano = date.getUTCFullYear();

    return `${dia}/${mes}/${ano}`;
}

function formatarDataHora(dataStr) {
    if (!dataStr) return "-";

    const date = new Date(dataStr);
    const dia = String(date.getDate()).padStart(2, "0");
    const mes = String(date.getMonth() + 1).padStart(2, "0");
    const ano = date.getFullYear();
    const hora = String(date.getHours()).padStart(2, "0");
    const min = String(date.getMinutes()).padStart(2, "0");

    return `${dia}/${mes}/${ano} ${hora}:${min}`;
}

function formatarTipo(tipo) {
    if (tipo === "cadastro_aluno") return "Cadastro de aluno";
    if (tipo === "renovacao_pagamento") return "Renovação de pagamento";
    return tipo;
}

async function carregarPersonalLogado(forceReload = false) {
    if (!forceReload && cachePersonal) return cachePersonal;

    try {
        const res = await authFetch(`${API_URL}/personal/logado`);
        if (!res.ok) throw new Error("Erro ao carregar personal.");

        const data = await res.json();
        const personal = data.personal;

        const fotoFinal = personal.foto_url
            ? personal.foto_url.startsWith("http")
                ? personal.foto_url
                : `${API_URL}${personal.foto_url}`
            : "img/undraw_profile.svg";

        document.getElementById("nomePersonal").textContent = personal.nome;
        document.getElementById("fotoTopbar").src = fotoFinal;

        const creditosEl = document.getElementById("creditosPersonal");
        const creditos = personal.creditos_disponiveis ?? 0;

        creditosEl.textContent = `${creditos}/100 créditos`;
        creditosEl.classList.remove("badge-success", "badge-warning", "badge-danger");

        if (creditos <= 0) {
            creditosEl.classList.add("badge-danger");
        } else if (creditos <= 10) {
            creditosEl.classList.add("badge-warning");
        } else {
            creditosEl.classList.add("badge-success");
        }

        cachePersonal = personal;
        return personal;

    } catch (err) {
        console.error(err);
        mostrarToast("Erro", err.message, "danger");
        return null;
    }
}

function renderCreditos(creditos) {
    const total = creditos.reduce((soma, item) => {
        return soma + Number(item.creditos_usados || 0);
    }, 0);

    $("#totalCreditosConsumidos").text(`${total} consumidos`);

    const linhas = creditos.map(c => [
        c.aluno_nome,
        formatarTipo(c.tipo),
        c.creditos_usados,
        `${formatarData(c.ciclo_inicio)} até ${formatarData(c.ciclo_fim)}`,
        formatarDataHora(c.criado_em)
    ]);

    if (dataTableCreditos) {
        dataTableCreditos.clear();
        linhas.forEach(linha => dataTableCreditos.row.add(linha));
        dataTableCreditos.draw();
        return;
    }

    dataTableCreditos = $("#dataTableCreditos").DataTable({
        data: linhas,
        columns: [
            { title: "Aluno" },
            { title: "Tipo" },
            { title: "Créditos" },
            { title: "Ciclo" },
            { title: "Data" }
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
            lengthMenu: "Mostrar _MENU_ registros",
            info: "Mostrando _START_ a _END_ de _TOTAL_ registros",
            infoEmpty: "Mostrando 0 a 0 de 0 registros",
            zeroRecords: "Nenhum consumo encontrado",
            emptyTable: "Nenhum consumo encontrado"
        }
    });
}

async function carregarCreditos() {
    const loader = document.getElementById("loaderCreditos");
    const wrapper = document.getElementById("tabelaCreditosWrapper");

    loader.style.display = "block";
    wrapper.style.display = "none";

    try {
        const inicio = $("#filtroCicloInicio").val();
        const fim = $("#filtroCicloFim").val();

        let url = `${API_URL}/personal/creditos/consumidos`;

        if (inicio && fim) {
            url += `?data_inicio=${inicio}&data_fim=${fim}`;
        }

        const res = await authFetch(url);
        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Erro ao carregar créditos.");
        }

        renderCreditos(data);
        wrapper.style.display = "block";

    } catch (err) {
        console.error(err);
        mostrarToast("Erro", err.message, "danger");
    } finally {
        loader.style.display = "none";
    }
}

function preencherCicloAtual() {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = hoje.getMonth();

    let inicio;
    let fim;

    if (hoje.getDate() >= 10) {
        inicio = new Date(ano, mes, 10);
        fim = new Date(ano, mes + 1, 10);
    } else {
        inicio = new Date(ano, mes - 1, 10);
        fim = new Date(ano, mes, 10);
    }

    const toSQL = (data) => {
        const y = data.getFullYear();
        const m = String(data.getMonth() + 1).padStart(2, "0");
        const d = String(data.getDate()).padStart(2, "0");
        return `${y}-${m}-${d}`;
    };

    $("#filtroCicloInicio").val(toSQL(inicio));
    $("#filtroCicloFim").val(toSQL(fim));
}

$("#btnFiltrarCreditos").on("click", carregarCreditos);

$("#btnLimparFiltroCreditos").on("click", async function () {
    $("#filtroCicloInicio").val("");
    $("#filtroCicloFim").val("");
    await carregarCreditos();
});

document.addEventListener("DOMContentLoaded", async () => {
    const token = getToken();

    if (!token) {
        logout();
        return;
    }

    preencherCicloAtual();

    await carregarPersonalLogado(true);
    await carregarCreditos();
});