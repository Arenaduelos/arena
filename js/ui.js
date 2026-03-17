/* === js/ui.js === */

function logBatalha(msg, tipo) {
    const logConteudo = document.getElementById("logConteudo");
    if (!logConteudo) return;
    
    const d = document.createElement("div");
    d.className = "log-item " + tipo;
    d.innerText = msg;
    logConteudo.prepend(d);
}

function mostrarSelecao(tit, ops, cb) {
    const modal = document.getElementById("modalPosicao");
    const textoModal = document.getElementById("textoModal");
    const botoesAcao = document.getElementById("botoesAcao");
    
    if (!modal || !textoModal || !botoesAcao) return;

    textoModal.innerText = tit;
    botoesAcao.innerHTML = "";
    ops.forEach((o, i) => {
        const b = document.createElement("button");
        b.innerText = o;
        b.onclick = () => {
            modal.style.display = "none";
            cb(i);
        };
        botoesAcao.appendChild(b);
    });
    modal.style.display = "flex";
}

function fecharModal() {
    const modal = document.getElementById("modalPosicao");
    if (modal) modal.style.display = "none";
}

function renderCemiterio() {
    const cj = document.getElementById("cemiterioJogador");
    if (cj) {
        cj.innerHTML = "";
        if (cemiterioJogador.length > 0) {
            const ultima = cemiterioJogador[cemiterioJogador.length - 1];
            cj.innerHTML = `<img src="${ultima.imagem}" class="carta-img">`;
            cj.innerHTML += `<div class="gy-count">${cemiterioJogador.length}</div>`;
        }
    }
    const co = document.getElementById("cemiterioOponente");
    if (co) {
        co.innerHTML = "";
        if (cemiterioOponente.length > 0) {
            const ultimaOp = cemiterioOponente[cemiterioOponente.length - 1];
            co.innerHTML = `<img src="${ultimaOp.imagem}" class="carta-img">`;
            co.innerHTML += `<div class="gy-count">${cemiterioOponente.length}</div>`;
        }
    }
}

function criarCartaHTML(c, isJogador, tipoLinha, index) {
    const imgPath = (c.revelada || isJogador) ? c.imagem : "imagens/back.jpg";
    let html = `<img src="${imgPath}" class="carta-img">`;
    
    if (tipoLinha === "combate" && (c.revelada || isJogador)) {
        // Adiciona o indicador de modo (ATK/DEF)
        const stanceClass = c.modo === 'ataque' ? 'atk' : 'def';
        const stanceText = c.modo === 'ataque' ? 'A' : 'D';
        html += `<div class="stance-indicator ${stanceClass}">${stanceText}</div>`;

        // Adiciona o efeito de bloqueio se a carta estiver bloqueada
        if (c.bloqueado) {
            html += `<div class="bloqueado-effect"></div>`;
            html += `<div class="bloqueio-contador">${c.turnosBloqueio}</div>`;
        }

        html += `
            <div class="status-dual">
                <div class="stat-box">
                    <span class="stat-label">ATK</span>
                    <span class="stat-value atk">${c.ataque}</span>
                </div>
                <div class="stat-box">
                    <span class="stat-label">DEF</span>
                    <span class="stat-value def">${c.defesa}</span>
                </div>
            </div>`;
    }
    
    // Remove a renderização da carta "Bloqueio" no slot de suporte
    // if (tipoLinha === "suporte" && c.revelada && c.imagem.includes("bloqueio.jpg")) {
    //     html += `<div class="alvo-tag">ALVO: ${c.vinculo + 1}</div>`;
    // }
    
    return html;
}

function renderLinha(id, lista, isJogador, tipoLinha) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    lista.forEach((c, i) => {
        const div = document.createElement("div");
        div.className = "slot";
        if (c) {
            if (c.modo === "defesa") div.classList.add("modo-defesa");
            div.innerHTML = criarCartaHTML(c, isJogador, tipoLinha, i);
            
            if (isJogador && tipoLinha === "combate") div.onclick = () => acaoMonstro(i);
            if (isJogador && tipoLinha === "suporte") div.onclick = () => acaoEspecial(i);
        }
        el.appendChild(div);
    });
}

function atualizarTela() {
    const vidaJogadorEl = document.getElementById("vidaJogador");
    const vidaOponenteEl = document.getElementById("vidaOponente");
    const contadorDeckEl = document.getElementById("contador-deck");
    const turnoAvisoEl = document.getElementById("turnoAviso");

    if (vidaJogadorEl) vidaJogadorEl.innerText = vidaJogador;
    if (vidaOponenteEl) vidaOponenteEl.innerText = vidaOponente;
    if (contadorDeckEl) contadorDeckEl.innerText = meuDeck.length;
    if (turnoAvisoEl) turnoAvisoEl.innerText = "TURNO: " + turnoAtual;

    renderLinha("monstrosOponente", monstrosOponente, false, "combate");
    renderLinha("especiaisOponente", especiaisOponente, false, "suporte");
    renderLinha("monstrosJogador", monstrosJogador, true, "combate");
    renderLinha("especiaisJogador", especiaisJogador, true, "suporte");
    renderCemiterio();
    
    const maoDiv = document.getElementById("minhaMao");
    if (maoDiv) {
        maoDiv.innerHTML = "";
        minhaMao.forEach((c, i) => {
            const carta = document.createElement("div");
            carta.className = "carta-mao";
            carta.innerHTML = `<img src="${c.imagem}" class="carta-img">`;
            if (c.tipo === "monstro") {
                carta.innerHTML += `<div class="mao-stats"><span style="color:#3498db">${c.ataque}</span> <span style="color:#ffff00">${c.defesa}</span></div>`;
            }
            carta.onclick = () => usarDaMao(i);
            maoDiv.appendChild(carta);
        });
    }

    const maoOpDiv = document.getElementById("maoOponente");
    if (maoOpDiv) {
        maoOpDiv.innerHTML = "";
        maoOponente.forEach(() => {
            const d = document.createElement("div");
            d.className = "carta-mao";
            d.innerHTML = `<img src="imagens/back.jpg">`;
            maoOpDiv.appendChild(d);
        });
    }
}