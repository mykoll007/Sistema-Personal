const API_URL = "https://sistema-personal.vercel.app"; 

function formatarDataBR(dataIso) {
  if (!dataIso) return "-";
  const d = new Date(dataIso);
  return d.toLocaleString("pt-BR");
}

function estrelasTexto(qtd) {
  const n = Number(qtd || 0);
  return "★".repeat(n) + "☆".repeat(5 - n);
}

async function carregarFeedbacks() {
  const token = localStorage.getItem("token"); // mesmo token do login do personal

  if (!token) {
    alert("Você precisa estar logado.");
    window.location.href = "login.html"; // ajuste se seu login tiver outro nome
    return;
  }

  try {
    const resp = await fetch(`${API_URL}/personal/feedbacks`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    });

    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      throw new Error(err.message || "Erro ao buscar feedbacks");
    }

    const feedbacks = await resp.json();

    const tbody = document.querySelector("#tabelaFeedbacks tbody");
    tbody.innerHTML = "";

    feedbacks.forEach(f => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${f.aluno_nome || "-"}</td>
        <td>${f.treino || "-"}</td>
        <td>${estrelasTexto(f.estrelas)}</td>
        <td>${f.mensagem ? f.mensagem : "-"}</td>
        <td>${formatarDataBR(f.criado_em)}</td>
      `;
      tbody.appendChild(tr);
    });

    // DataTable (recarregar com segurança)
    if ($.fn.DataTable.isDataTable("#tabelaFeedbacks")) {
      $("#tabelaFeedbacks").DataTable().destroy();
    }

    $("#tabelaFeedbacks").DataTable({
      pageLength: 10,
      order: [[4, "desc"]],
      language: {
        url: "vendor/datatables/pt-BR.json" // opcional: se você tiver esse arquivo
      }
    });

  } catch (e) {
    console.error(e);
    alert(e.message);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  carregarFeedbacks();
});
