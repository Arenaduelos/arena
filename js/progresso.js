/* === js/progresso.js === */

function concederPremios() {
    if (nivelAtual <= 5) save.moedas += 300000;
    else save.moedas += 100000;
    
    save.vitorias += 1;

    let vitoriasParaProximoNivel = 5;
    if (nivelAtual >= 30) vitoriasParaProximoNivel = 15;
    else if (nivelAtual >= 25) vitoriasParaProximoNivel = 10;
    else if (nivelAtual >= 20) vitoriasParaProximoNivel = 8;
    else if (nivelAtual >= 15) vitoriasParaProximoNivel = 6;

    save.vitsNoNivel += 1;
    
    let subiuDeNivel = false;
    if (save.vitsNoNivel >= vitoriasParaProximoNivel) {
        nivelAtual += 1;
        save.vitsNoNivel = 0;
        subiuDeNivel = true;
        alert("PARABÉNS! Você subiu para o Nível " + nivelAtual);
    }
    
    salvarJogo();

    let cartaSacrificio = null;
    if (subiuDeNivel) {
        let rSac = Math.random() * 100;
        if (nivelAtual >= 15 && nivelAtual <= 19 && rSac <= 35) cartaSacrificio = { nome: "Sacrifício 1", imagem: "imagens/sacrificios/sacrificio1.jpg", tipo: "monstro", ataque: 3000, defesa: 2500, sacrifio: 2 };
        else if (nivelAtual >= 20 && nivelAtual <= 24 && rSac <= 30) cartaSacrificio = { nome: "Sacrifício 2", imagem: "imagens/sacrificios/sacrificio2.jpg", tipo: "monstro", ataque: 3500, defesa: 3000, sacrifio: 2 };
        else if (nivelAtual >= 25 && nivelAtual <= 29 && rSac <= 25) cartaSacrificio = { nome: "Sacrifício 3", imagem: "imagens/sacrificios/sacrificio3.jpg", tipo: "monstro", ataque: 4000, defesa: 3500, sacrifio: 2 };
        else if (nivelAtual >= 30 && nivelAtual <= 39 && rSac <= 20) cartaSacrificio = { nome: "Sacrifício 4", imagem: "imagens/sacrificios/sacrificio4.jpg", tipo: "monstro", ataque: 4500, defesa: 4000, sacrifio: 2 };
        else if (nivelAtual >= 40 && rSac <= 10) cartaSacrificio = { nome: "Sacrifício 5", imagem: "imagens/sacrificios/sacrificio5.jpg", tipo: "monstro", ataque: 5000, defesa: 4500, sacrifio: 2 };

        if (cartaSacrificio) {
            save.inventario.push(cartaSacrificio);
            salvarJogo();
            alert("BÔNUS DE NÍVEL: Você ganhou um Monstro de Sacrifício!");
        }
    }

    const lv = Math.min(5, nivelAtual);
    let r = Math.random() * 100;
    const poolsPorNivel = {
        1: { pool60: ["especiais/vida.jpg", "especiais/chamado.jpg", "guerreiros/guerreiro1.jpg", "orcs/orc1.jpg", "trolls/troll1.jpg", "gigantes/gigante1.jpg", "mortes/morte1.jpg"], pool40: ["ogros/ogro1.jpg", "fadas/fada1.jpg", "dragoes/dragao1.jpg", "magos/mago1.jpg"] },
        2: { pool60: ["especiais/despertar.jpg", "guerreiros/guerreiro2.jpg", "orcs/orc2.jpg", "trolls/troll2.jpg", "gigantes/gigante2.jpg", "mortes/morte2.jpg"], pool40: ["ogros/ogro2.jpg", "fadas/fada2.jpg", "dragoes/dragao2.jpg", "magos/mago2.jpg"] },
        3: { pool60: ["especiais/fusao.jpg", "guerreiros/guerreiro3.jpg", "orcs/orc3.jpg", "trolls/troll3.jpg", "gigantes/gigante3.jpg", "mortes/morte3.jpg"], pool40: ["ogros/ogro3.jpg", "fadas/fada3.jpg", "dragoes/dragao3.jpg", "magos/mago3.jpg"] },
        4: { pool60: ["especiais/trocal.jpg", "guerreiros/guerreiro4.jpg", "orcs/orc4.jpg", "trolls/troll4.jpg", "gigantes/gigante4.jpg", "mortes/morte4.jpg"], pool40: ["ogros/ogro4.jpg", "fadas/fada4.jpg", "dragoes/dragao4.jpg", "magos/mago4.jpg"] },
        5: { pool60: ["especiais/bloqueio.jpg", "guerreiros/guerreiro5.jpg", "orcs/orc5.jpg", "trolls/troll5.jpg", "gigantes/gigante5.jpg", "mortes/morte5.jpg"], pool40: ["ogros/ogro5.jpg", "fadas/fada5.jpg", "dragoes/dragao5.jpg", "magos/mago5.jpg"] }
    };
    const poolAtual = poolsPorNivel[lv];
    let pathSorteado = (r <= 60) ? poolAtual.pool60[Math.floor(Math.random() * poolAtual.pool60.length)] : poolAtual.pool40[Math.floor(Math.random() * poolAtual.pool40.length)];
    const imgPath = `imagens/${pathSorteado}`;
    const isEspecial = pathSorteado.includes("especiais/");
    const atributosMonstros = {
        guerreiro: [[800,600], [1000,700], [1200,800], [1300,600], [1500,800]], orc: [[900,700], [1100,750], [1250,750], [1350,800], [1800,900]], troll: [[1000,800], [1100,800], [1250,800], [1450,900], [2000,1000]], gigante: [[1050,800], [1150,800], [1500,900], [1600,900], [2050,1000]], morte: [[1300,1100], [1350,1100], [1700,1200], [1750,1200], [2200,1250]], ogro: [[1200,1000], [1300,1000], [1600,1050], [1650,1050], [2100,1100]], fada: [[1350,1150], [1400,1200], [1800,1300], [1850,1300], [2300,1350]], dragao: [[1500,1500], [1600,1500], [1850,1550], [1900,1550], [2350,1550]], mago: [[1700,1600], [1800,1600], [1900,1600], [1950,1650], [2500,1700]]
    };
    let cartaGanha;
    if (isEspecial) {
        let nomeEsp = pathSorteado.split("/")[1].replace(".jpg", "");
        nomeEsp = nomeEsp.charAt(0).toUpperCase() + nomeEsp.slice(1);
        cartaGanha = { nome: nomeEsp, imagem: imgPath, tipo: "especial" };
    } else {
        const partes = pathSorteado.split("/");
        const tipoKey = partes[0].slice(0, -1);
        const stats = atributosMonstros[tipoKey][lv - 1];
        cartaGanha = { nome: tipoKey.charAt(0).toUpperCase() + tipoKey.slice(1), imagem: imgPath, tipo: "monstro", ataque: stats[0], defesa: stats[1] };
    }
    
    save.inventario.push(cartaGanha);
    salvarJogo();

    const box = document.createElement("div");
    box.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.9);display:flex;align-items:center;justify-content:center;z-index:10000;color:gold;text-align:center;font-family:sans-serif;";
    box.innerHTML = `<div style="border:3px solid gold;padding:30px;background:#111;border-radius:20px;"><h1>VITÓRIA!</h1><p style="color:white">Você ganhou moedas e uma nova carta!</p><img src="${cartaGanha.imagem}" style="width:150px;border-radius:10px;margin:10px 0; border: 2px solid gold;"><h3>${cartaGanha.nome} (Nv. ${lv})</h3><p>Nível Atual: ${nivelAtual}</p><button onclick="window.location.href='mdeck.html'" style="padding:10px 20px;cursor:pointer;background:gold;border:none;font-weight:bold;margin-top:10px;">IR AO MEU DECK</button></div>`;
    document.body.appendChild(box);
}

function comprarCarta(alvo = "jogador") {
    if (alvo === "jogador") {
        if (turnoAtual !== "VOCÊ") return;
        if (jaComprouCarta) return alert("Você já comprou uma carta neste turno!");
        if (meuDeck.length > 0) {
            let novaCarta = meuDeck.pop();
            jaComprouCarta = true;
            if (minhaMao.length >= 5) escolherDescarte(novaCarta);
            else { minhaMao.push(novaCarta); logBatalha("Você comprou uma carta.", "info"); }
        } else logBatalha("Seu deck acabou!", "morte");
    } else if (deckOponente.length > 0) {
        let nc = deckOponente.pop();
        if (maoOponente.length >= 5) cemiterioOponente.push(maoOponente.shift()); 
        maoOponente.push(nc);
    }
    atualizarTela();
}

function escolherDescarte(novaCarta) {
    const ops = minhaMao.map(c => c.nome);
    ops.push("DESCARTAR NOVA: " + novaCarta.nome);
    mostrarSelecao("MÃO CHEIA", ops, (sel) => {
        if (sel < minhaMao.length) { cemiterioJogador.push(minhaMao[sel]); minhaMao[sel] = novaCarta; }
        else cemiterioJogador.push(novaCarta);
        atualizarTela();
    });
}

function girarRoleta() {
    const r = document.getElementById("roleta");
    const sortei = Math.random() > 0.5 ? "VOCÊ" : "MÁQUINA";
    meuDeck = meuDeck.map(c => (c && Math.random() <= 0.10) ? { nome: "Equipar", imagem: "imagens/especiais/equipar.jpg", tipo: "especial" } : c);
    meuDeck = meuDeck.filter(c => c !== null);
    deckOponente = [...meuDeck].sort(() => Math.random() - 0.5);
    meuDeck.sort(() => Math.random() - 0.5);
    r.style.transform = sortei === "VOCÊ" ? "rotate(1800deg)" : "rotate(1980deg)";
    setTimeout(() => {
        turnoAtual = sortei;
        document.getElementById("modalRoleta").style.display = "none";
        document.getElementById("btnPassarTurno").style.display = "block";
        minhaMao = []; maoOponente = [];
        for (let i = 0; i < 3; i++) {
            if (meuDeck.length > 0) minhaMao.push(meuDeck.pop());
            if (deckOponente.length > 0) maoOponente.push(deckOponente.pop());
        }
        atualizarTela();
        if (turnoAtual === "MÁQUINA") setTimeout(turnoDaMaquina, 1500);
    }, 3200);
}