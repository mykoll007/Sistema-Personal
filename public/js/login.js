const API_URL = "http://localhost:4000";

function mostrarToast(titulo, mensagem, tipo = "info") {
    const header = document.querySelector("#toastMessage .toast-header");
    header.classList.remove("bg-danger", "bg-success", "bg-primary", "text-white");

    if (tipo === "success") header.classList.add("bg-success", "text-white");
    if (tipo === "danger") header.classList.add("bg-danger", "text-white");
    if (tipo === "primary") header.classList.add("bg-primary", "text-white");

    $("#toastTitle").text(titulo);
    $("#toastBody").text(mensagem);

    $("#toastMessage").toast("show");
}

async function loginPersonal(event) {
    event.preventDefault();

    const email = $("#exampleInputEmail").val();
    const senha = $("#exampleInputPassword").val();

    if (!email || !senha) {
        mostrarToast("Erro", "Preencha email e senha", "danger");
        return;
    }

    try {
        const res = await fetch(`${API_URL}/personal/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, senha })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || "Erro ao autenticar");
        }

        sessionStorage.setItem("token", data.token);
        mostrarToast("Sucesso", "Login realizado!", "success");

        // Aguarda 1 segundo para o toast aparecer e então redireciona
        setTimeout(() => {
            window.location.href = "index.html";
        }, 1000);

    } catch (err) {
        console.error(err);
        mostrarToast("Erro", err.message, "danger");
    }
}

$(document).ready(function () {
    // Captura submit do form
    $(".user").on("submit", loginPersonal);

    // Caso use <a> como botão de login
    $(".btn-user").on("click", loginPersonal);
});
