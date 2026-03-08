function fazerLogin() {
    const input = document.getElementById("username");
    const inputEmail = document.getElementById("email");
    const inputSenha = document.getElementById("senha");
    const nome = input.value.trim();
    const email = (inputEmail && inputEmail.value.trim()) || "";
    const senha = (inputSenha && inputSenha.value.trim()) || "";

    if (nome === "") {
        alert("Pela honra do reino, um duelista precisa de um nome!");
        input.focus();
        return;
    }

    localStorage.setItem("usuarioLogado", nome);
    if (email) localStorage.setItem(`email_${nome}`, email);
    if (senha) localStorage.setItem(`senha_${nome}`, senha);

    // Se o jogador não tiver deck, cria o inicial com os novos status
    if (!localStorage.getItem(`deck_${nome}`)) {
        const deckInicial = [];
        function criarMonstro(nomeCarta, imagem, atk, def) {
            return { nome: nomeCarta, imagem, tipo: "monstro", ataque: atk, defesa: def, nivel: 1 };
        }
        function criarEspecial(nomeCarta, imagem, efeito) {
            return { nome: nomeCarta, imagem, tipo: "especial", efeito };
        }
        for (let i = 0; i < 8; i++) deckInicial.push(criarMonstro("Guerreiro", "imagens/guerreiros/guerreiro1.jpg", 800, 600));
        for (let i = 0; i < 3; i++) deckInicial.push(criarMonstro("Orc", "imagens/orcs/orc1.jpg", 900, 700));
        // Deck inicial: 24 cartas conforme especificação
        // 8 Guerreiro1, 3 Orc1, 3 Troll1, 3 Gigante1, 3 Morte1, 2 PowerUp, 2 PowerDown
        for (let i = 0; i < 3; i++) deckInicial.push(criarMonstro("Troll", "imagens/trolls/troll1.jpg", 1000, 800));
        for (let i = 0; i < 3; i++) deckInicial.push(criarMonstro("Gigante", "imagens/gigantes/gigante1.jpg", 1050, 800));
        for (let i = 0; i < 3; i++) deckInicial.push(criarMonstro("Morte", "imagens/mortes/morte1.jpg", 1300, 1100));
        for (let i = 0; i < 2; i++) deckInicial.push(criarEspecial("+ Forte", "imagens/especiais/powerup.jpg", "aumenta500"));
        for (let i = 0; i < 2; i++) deckInicial.push(criarEspecial("- Força", "imagens/especiais/powerdown.jpg", "diminui500"));

        localStorage.setItem(`deck_${nome}`, JSON.stringify(deckInicial));
        localStorage.setItem(`deck_inventory_${nome}`, JSON.stringify(deckInicial));
        localStorage.setItem(`deck_build_${nome}`, JSON.stringify(deckInicial));
        localStorage.setItem(`moedas_${nome}`, "0");
        localStorage.setItem(`nivel_${nome}`, "1");
        localStorage.setItem(`vitorias_${nome}`, "0");
    }

    window.location.href = "deck.html";
}

document.addEventListener('keypress', (e) => { if (e.key === 'Enter') fazerLogin(); });
