/* === js/batalha.js === */

function acaoMonstro(idx) {
    if (turnoAtual !== "VOCÊ") return;
    let m = monstrosJogador[idx];
    if (!m) return;
    let acoes = [];
    if (m.modo === "ataque" && !m.jaAtacou && !m.bloqueado && !primeiroTurnoDoJogo) acoes.push("ATACAR");
    if (!m.jaAtacou && !m.acabouDeSerInvocado) {
        acoes.push(m.modo === "ataque" ? "MUDAR PARA DEFESA" : "MUDAR PARA ATAQUE");
    }
    if (acoes.length === 0) return;
    mostrarSelecao(m.nome.toUpperCase(), acoes, (sel) => {
        if (acoes[sel] === "ATACAR") prepararAtaque(idx);
        else {
            m.modo = (m.modo === "ataque" ? "defesa" : "ataque");
            m.revelada = (m.modo === "ataque");
            m.mudouPosicaoNesteTurno = true;
            atualizarTela();
        }
    });
}

function ataqueDireto() {
    // Esta função pode ser expandida se houver um botão fixo de ataque direto
    alert("Escolha um monstro para atacar!");
}

function prepararAtaque(idx) {
    let meu = monstrosJogador[idx];
    let alvos = monstrosOponente.map((m, i) => m ? {i, label: m.revelada ? m.nome : `MONSTRO OCULTO (${i+1})`} : null).filter(Boolean);
    if (alvos.length === 0) {
        if (confirm("Atacar diretamente?")) {
            vidaOponente -= meu.ataque;
            meu.jaAtacou = true;
            logBatalha(`Ataque direto! -${meu.ataque} LP`, "dano");
            verificarFimJogo();
            atualizarTela();
        }
    } else {
        mostrarSelecao("ALVO", alvos.map(a => a.label), (s) => resolverCombate(idx, alvos[s].i, true));
    }
}

function resolverCombate(mIdx, oIdx, atacanteEhJogador) {
    let atacante = atacanteEhJogador ? monstrosJogador[mIdx] : monstrosOponente[mIdx];
    let defensor = atacanteEhJogador ? monstrosOponente[oIdx] : monstrosJogador[oIdx];
    if (!atacante || !defensor) return;
    defensor.revelada = true;
    let pontosDef = defensor.modo === "ataque" ? defensor.ataque : defensor.defesa;
    let dif = atacante.ataque - pontosDef;
    if (dif > 0) {
        logBatalha(`${atacante.nome} destruiu ${defensor.nome}!`, "cura");
        if (defensor.modo === "ataque") {
            if (atacanteEhJogador) vidaOponente -= dif; else vidaJogador -= dif;
        }
        if (atacanteEhJogador) { cemiterioOponente.push(defensor); monstrosOponente[oIdx] = null; }
        else { cemiterioJogador.push(defensor); monstrosJogador[oIdx] = null; }
    } else if (dif < 0) {
        let danoRef = Math.abs(dif);
        if (atacanteEhJogador) vidaJogador -= danoRef; else vidaOponente -= danoRef;
        logBatalha(`Contra-ataque! Perda de ${danoRef} LP.`, "dano");
        if (defensor.modo === "ataque") {
            if (atacanteEhJogador) { cemiterioJogador.push(atacante); monstrosJogador[mIdx] = null; }
            else { cemiterioOponente.push(atacante); monstrosOponente[mIdx] = null; }
        }
    } else {
        logBatalha("Empate!", "morte");
        cemiterioJogador.push(atacanteEhJogador ? atacante : defensor);
        cemiterioOponente.push(atacanteEhJogador ? defensor : atacante);
        monstrosJogador[atacanteEhJogador ? mIdx : oIdx] = null;
        monstrosOponente[atacanteEhJogador ? oIdx : mIdx] = null;
    }
    if (atacante) atacante.jaAtacou = true;
    verificarFimJogo();
    atualizarTela();
}

function passarTurno() {
    if (turnoAtual !== "VOCÊ") return;
    
    especiaisJogador.forEach((esp, i) => {
        if (esp && esp.imagem.includes("bloqueio.jpg")) {
            esp.turnosRestantes--;
            const alvoIdx = esp.vinculo;
            if (esp.turnosRestantes <= 0 || !monstrosOponente[alvoIdx]) {
                if (monstrosOponente[alvoIdx]) {
                    monstrosOponente[alvoIdx].bloqueado = false;
                    monstrosOponente[alvoIdx].turnosBloqueio = 0;
                }
                cemiterioJogador.push(especiaisJogador[i]);
                especiaisJogador[i] = null;
                logBatalha("O efeito de Bloqueio acabou.", "info");
            }
        }
    });

    monstrosJogador.forEach((m, i) => {
        if (m && m.roubado) {
            m.turnosRoubo--;
            if (m.turnosRoubo <= 0) {
                logBatalha(`${m.nome} voltou para o dono original e foi ao cemitério.`, "info");
                cemiterioOponente.push(monstrosJogador[i]);
                monstrosJogador[i] = null;
            }
        }
    });

    turnoAtual = "MÁQUINA";
    jaComprouCarta = false; jaInvocouMonstro = false; primeiroTurnoDoJogo = false;
    monstrosOponente.forEach(m => { if(m) { m.jaAtacou = false; m.acabouDeSerInvocado = false; m.mudouPosicaoNesteTurno = false; } });
    atualizarTela();
    setTimeout(turnoDaMaquina, 1500);
}

function verificarFimJogo() {
    if (vidaJogador <= 0) { 
        mostrarDerrota();
        return;
    }
    if (vidaOponente <= 0) { 
        concederPremios(); 
    }
}

function mostrarDerrota() {
    const overlay = document.createElement("div");
    overlay.style = "position:fixed;left:0;top:0;right:0;bottom:0;background:rgba(0,0,0,0.85);z-index:3000;display:flex;flex-direction:column;align-items:center;justify-content:center;";
    const box = document.createElement("div");
    box.style = "background:#c2a679;border:4px solid #3d2b1f;padding:20px;border-radius:8px;text-align:center;width:90%;max-width:360px;";
    const h = document.createElement("div");
    h.innerText = "VOCÊ PERDEU";
    h.style = "font-size:22px;font-weight:900;margin-bottom:10px;";
    const p = document.createElement("div");
    p.innerText = "Tentar novamente?";
    p.style.marginBottom = "15px";
    const btn = document.createElement("button");
    btn.innerText = "JOGAR NOVAMENTE";
    btn.style = "padding:10px 16px;font-weight:bold;cursor:pointer;";
    btn.onclick = () => location.reload();
    box.appendChild(h); box.appendChild(p); box.appendChild(btn);
    overlay.appendChild(box); document.body.appendChild(overlay);
}