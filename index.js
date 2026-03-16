async function fazerLogin() {
    const input = document.getElementById("username");
    const inputEmail = document.getElementById("email");
    const inputSenha = document.getElementById("senha");

    // Mantemos o nome e senha como digitados, apenas o email vai para minúsculo
    const nome = input.value.trim();
    const email = (inputEmail && inputEmail.value.trim().toLowerCase()) || "";
    const senha = (inputSenha && inputSenha.value.trim()) || "";

    if (nome === "") {
        alert("Pela honra do reino, um duelista precisa de um nome!");
        input.focus();
        return;
    }

    // Validação de Email Real e Obrigatório
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email === "") {
        alert("Para sua segurança, informe um email para receber suas credenciais!");
        inputEmail.focus();
        return;
    }
    if (!emailRegex.test(email)) {
        alert("O pergaminho de email parece inválido! Por favor, digite um email real.");
        inputEmail.focus();
        return;
    }

    // Validação de Senha Obrigatória
    if (senha === "") {
        alert("Nobre guerreiro, você precisa de uma senha para proteger suas cartas!");
        inputSenha.focus();
        return;
    }

    localStorage.setItem("usuarioLogado", nome);
    localStorage.setItem(`email_${nome}`, email);
    localStorage.setItem(`senha_${nome}`, senha);

    // Exibe um aviso visual de que o e-mail está sendo enviado
    const btn = document.querySelector(".btn-entrar");
    const textoOriginal = btn.innerText;
    btn.innerText = "ENVIANDO CREDENCIAIS...";
    btn.disabled = true;

    // Dispara o email via PHP sem travar o login (Fire and Forget)
    console.log("Enviando credenciais para: " + email);
    enviarCredenciaisPorEmail(nome, email, senha);

    // Pequena pausa apenas para dar feedback visual, mas sem depender da resposta do PHP
    setTimeout(() => {
        // Se o jogador não tiver deck...
        if (!localStorage.getItem(`deck_${nome}`)) {
            const deckInicial = [];
            function criarMonstro(nomeCarta, imagem, atk, def) {
                return { nome: nomeCarta, imagem: imagem, tipo: "monstro", ataque: atk, defesa: def, nivel: 1 };
            }
            function criarEspecial(nomeCarta, imagem, efeito) {
                return { nome: nomeCarta, imagem: imagem, tipo: "especial", efeito: efeito };
            }

        // Deck inicial: 28 cartas
        // 7x Planta 1, 5x Inseto 1, 5x Guerreiro 1, 5x Orc 1, 2x Vida, 2x PowerUp, 2x Equipar
        for (let i = 0; i < 7; i++) deckInicial.push(criarMonstro("Planta 1", "imagens/plantas/planta1.jpg", 500, 400));
        for (let i = 0; i < 5; i++) deckInicial.push(criarMonstro("Inseto 1", "imagens/insetos/inseto1.jpg", 600, 650));
        for (let i = 0; i < 5; i++) deckInicial.push(criarMonstro("Guerreiro 1", "imagens/guerreiros/guerreiro1.jpg", 1050, 860));
        for (let i = 0; i < 5; i++) deckInicial.push(criarMonstro("Orc 1", "imagens/orcs/orc1.jpg", 1200, 950));
        
        for (let i = 0; i < 2; i++) deckInicial.push(criarEspecial("Vida", "imagens/especiais/vida.jpg", "cura500"));
        for (let i = 0; i < 2; i++) deckInicial.push(criarEspecial("Powerup", "imagens/especiais/powerup.jpg", "aumenta500"));
        for (let i = 0; i < 2; i++) deckInicial.push(criarEspecial("Equipar", "imagens/especiais/equipar.jpg", "transformar"));

            localStorage.setItem(`deck_${nome}`, JSON.stringify(deckInicial));
            localStorage.setItem(`deck_inventory_${nome}`, JSON.stringify(deckInicial));
            localStorage.setItem(`deck_build_${nome}`, JSON.stringify(deckInicial));
            localStorage.setItem(`moedas_${nome}`, "0");
            localStorage.setItem(`nivel_${nome}`, "1");
            localStorage.setItem(`vitorias_${nome}`, "0");
        }
        window.location.href = "deck.html";
    }, 800);
}

function enviarCredenciaisPorEmail(nome, email, senha) {
    const formData = new FormData();
    formData.append('nome', nome);
    formData.append('email', email);
    formData.append('senha', senha);

    return fetch('enviar_email.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.text())
    .then(data => {
        console.log("Status do envio de email:", data);
        return data;
    })
    .catch(error => {
        console.error("Erro ao enviar email:", error);
        throw error;
    });
}

document.addEventListener("keypress", function(e) {
    if (e.key === "Enter") {
        fazerLogin();
    }
});
function salvarSeguro(chave, valor){
    const texto = JSON.stringify(valor);
    const codificado = btoa(texto); 
    localStorage.setItem(chave, codificado);
}

function carregarSeguro(chave){
    const dado = localStorage.getItem(chave);
    if(!dado) return null;
    try{
        return JSON.parse(atob(dado));
    }catch{
        return null;
    }
}