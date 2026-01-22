const API_URL = "https://sistema-personal.vercel.app";

let feedbacksRaw = [];
let alunosAgrupados = [];
let alunoSelecionado = null;

/* ============================================================
   AUTH (igual ao seu index.js)
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
function escapeHtml(str) {
    if (!str) return "";
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatarDataHoraBR(dataStr) {
    if (!dataStr) return "";
    const d = new Date(dataStr);
    return d.toLocaleString("pt-BR");
}

function estrelasString(qtd) {
    const n = Math.max(0, Math.min(5, Number(qtd || 0)));
    return "★".repeat(n) + "☆".repeat(5 - n);
}

function calcularStats(feedbacks) {
    const total = feedbacks.length;
    const soma = feedbacks.reduce((acc, f) => acc + Number(f.estrelas || 0), 0);
    const media = total ? (soma / total) : 0;

    const sorted = [...feedbacks].sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
    const ultimo = sorted[0];

    return {
        total,
        media,
        ultimo_em: ultimo?.criado_em || null,
        ultimo_preview: ultimo?.mensagem ? ultimo.mensagem : ""
    };
}

function agruparPorAluno(feedbacks) {
    const map = new Map();

    feedbacks.forEach(f => {
        const aluno_id = f.aluno_id;

        if (!map.has(aluno_id)) {
            map.set(aluno_id, {
                aluno_id,
                aluno_nome: f.aluno_nome || "Aluno",
                aluno_email: f.aluno_email || "",
                feedbacks: []
            });
        }

        map.get(aluno_id).feedbacks.push(f);
    });

    const lista = Array.from(map.values()).map(item => {
        item.feedbacks.sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em));
        item.stats = calcularStats(item.feedbacks);
        return item;
    });

    return lista;
}

/* ============================================================
   ORDER / FILTER
============================================================ */
function aplicarOrdenacao(lista, tipo) {
    const arr = [...lista];

    if (tipo === "recentes") {
        arr.sort((a, b) => new Date(b.stats.ultimo_em || 0) - new Date(a.stats.ultimo_em || 0));
    } else if (tipo === "melhor") {
        arr.sort((a, b) => (b.stats.media || 0) - (a.stats.media || 0));
    } else if (tipo === "pior") {
        arr.sort((a, b) => (a.stats.media || 0) - (b.stats.media || 0));
    } else if (tipo === "maisFeedbacks") {
        arr.sort((a, b) => (b.stats.total || 0) - (a.stats.total || 0));
    }

    return arr;
}

function aplicarBusca(lista, termo) {
    if (!termo) return lista;
    const t = termo.toLowerCase().trim();
    return lista.filter(a =>
        (a.aluno_nome || "").toLowerCase().includes(t) ||
        (a.aluno_email || "").toLowerCase().includes(t)
    );
}

/* ============================================================
   RENDER CARDS
============================================================ */
function renderCards(lista) {
    const container = document.getElementById("listaCardsFeedbacks");
    if (!container) return;

    if (!lista.length) {
        container.innerHTML = `
      <div class="col-12">
        <div class="alert alert-info">Nenhum feedback encontrado.</div>
      </div>
    `;
        return;
    }

    let html = "";

    lista.forEach(a => {
        const media = (a.stats.media || 0).toFixed(1);
        const total = a.stats.total || 0;
        const dataUltimo = a.stats.ultimo_em ? formatarDataHoraBR(a.stats.ultimo_em) : "-";

        const previewBruto = a.stats.ultimo_preview || "";
        const preview = previewBruto
            ? escapeHtml(previewBruto).slice(0, 90) + (previewBruto.length > 90 ? "..." : "")
            : "Sem mensagem";

        html += `
      <div class="col-12 col-md-6 col-lg-4 mb-4">
        <div class="card shadow feedback-card">
          <div class="card-body">

            <div class="feedback-card-top">
              <div>
                <h5 class="feedback-card-title">${escapeHtml(a.aluno_nome)}</h5>
                <div class="feedback-card-subtitle">${escapeHtml(a.aluno_email || "")}</div>
              </div>

              <div class="feedback-card-score">
                <div class="label">Média</div>
                <div class="value">${media}</div>
              </div>
            </div>

            <div class="feedback-card-meta">
              <div class="feedback-meta-item">
                <i class="fas fa-comment-dots"></i>
                ${total} feedback(s)
              </div>

              <div class="feedback-meta-item">
                <i class="far fa-clock"></i>
                ${dataUltimo}
              </div>
            </div>

            <div class="feedback-last">
              <div class="label">Último comentário</div>
              <div class="text">${preview}</div>
            </div>

            <button class="btn btn-outline-primary btn-sm btn-block mt-3 btn-ver-feedbacks"
              data-aluno-id="${a.aluno_id}">
              Ver todos os feedbacks
            </button>

          </div>
        </div>
      </div>
    `;
    });

    container.innerHTML = html;
}

function atualizarTela() {
    const termo = document.getElementById("inputBuscaFeedback")?.value || "";
    const ordenacao = document.getElementById("selectOrdenacao")?.value || "recentes";

    let lista = [...alunosAgrupados];
    lista = aplicarBusca(lista, termo);
    lista = aplicarOrdenacao(lista, ordenacao);

    renderCards(lista);
}

/* ============================================================
   MODAL
============================================================ */
function abrirModalFeedbacks(alunoId) {
    alunoSelecionado = alunosAgrupados.find(a => String(a.aluno_id) === String(alunoId));
    if (!alunoSelecionado) return;

    // título/subtitulo
    document.getElementById("modalFeedbacksTitulo").textContent = `Feedbacks de ${alunoSelecionado.aluno_nome}`;
    document.getElementById("modalFeedbacksSubtitulo").textContent =
        alunoSelecionado.aluno_email ? alunoSelecionado.aluno_email : "";

    // resumo
    const total = alunoSelecionado.stats.total || 0;
    const media = (alunoSelecionado.stats.media || 0).toFixed(1);
    const ultimo = alunoSelecionado.stats.ultimo_em ? formatarDataHoraBR(alunoSelecionado.stats.ultimo_em) : "-";

    document.getElementById("modalFeedbacksResumo").innerHTML = `
    <div class="item"><i class="fas fa-comment-dots"></i> <strong>${total}</strong> feedback(s)</div>
    <div class="item"><i class="fas fa-star"></i> Média <strong>${media}</strong></div>
    <div class="item"><i class="far fa-clock"></i> Último: <strong>${ultimo}</strong></div>
  `;

    // lista
    const lista = document.getElementById("modalFeedbacksLista");
    if (!alunoSelecionado.feedbacks.length) {
        lista.innerHTML = `<div class="feedback-empty">Este aluno ainda não enviou feedbacks.</div>`;
    } else {
        lista.innerHTML = alunoSelecionado.feedbacks.map(f => {
            const msg = f.mensagem ? escapeHtml(f.mensagem) : "<span class='text-muted'>Sem mensagem</span>";
            const treino = escapeHtml(f.treino || "-");
            const nomeTreino = f.nome_treino ? ` — ${escapeHtml(f.nome_treino)}` : "";
            const estrelas = estrelasString(f.estrelas);

            return `
                <div class="feedback-item">
                    <div class="feedback-item-top">
                    <div class="feedback-item-left">
                        <span class="badge badge-primary badge-treino">Treino ${treino}${nomeTreino}</span>
                        <span class="feedback-stars">${estrelas}</span>
                    </div>
                    <span class="feedback-date">${formatarDataHoraBR(f.criado_em)}</span>
                    </div>
                    <div class="feedback-msg">${msg}</div>
                </div>
                `;
        }).join("");
    }

    $("#modalFeedbacksAluno").modal("show");
}

/* ============================================================
   LOAD
============================================================ */
async function carregarFeedbacks() {
    const loader = document.getElementById("loaderFeedbacks");
    const container = document.getElementById("listaCardsFeedbacks");

    try {
        if (loader) loader.style.display = "block";
        if (container) container.style.display = "none";

        const res = await retryFetch(`${API_URL}/personal/feedbacks`);
        const data = await res.json().catch(() => ([]));

        if (!res.ok) throw new Error(data.message || "Erro ao carregar feedbacks");

        feedbacksRaw = Array.isArray(data) ? data : [];
        alunosAgrupados = agruparPorAluno(feedbacksRaw);

        atualizarTela();

    } catch (err) {
        console.error(err);
        if (container) {
            container.style.display = "block";
            container.innerHTML = `
        <div class="col-12">
          <div class="alert alert-danger">${escapeHtml(err.message || "Erro ao carregar feedbacks")}</div>
        </div>
      `;
        }
    } finally {
        if (loader) loader.style.display = "none";
        if (container) container.style.display = "flex";
    }
}

/* ============================================================
   INIT + EVENTS
============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    const token = getToken();
    if (!token) {
        logout();
        return;
    }

    carregarFeedbacks();

    document.getElementById("inputBuscaFeedback")?.addEventListener("input", atualizarTela);
    document.getElementById("selectOrdenacao")?.addEventListener("change", atualizarTela);

    // clique no botão do card (delegação)
    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-ver-feedbacks");
        if (!btn) return;
        const alunoId = btn.getAttribute("data-aluno-id");
        abrirModalFeedbacks(alunoId);
    });
});
