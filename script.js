let vidaJogador = 5000, vidaOponente = 5000;  
let turnoAtual = "";
let primeiroTurnoDoJogo = true;
let cartaPendente = null;
let atacanteSelecionadoIdx = null;
let jaInvocouMonstro = false;
let jaComprou = false;
let jaMudouPosicao = false;
let callbackSelecao = null;

// === LOG DE BATALHA ===
const batalhaLog = [];
function addLog(msg, tipo = "info") {
    batalhaLog.unshift({ msg, tipo });
    if (batalhaLog.length > 40) batalhaLog.pop();
    const el = document.getElementById("logConteudo");
    if (!el) return;
    el.innerHTML = batalhaLog
        .map(e => `<div class="log-item ${e.tipo}">${e.msg}</div>`)
        .join("");
}

const usuario = localStorage.getItem("usuarioLogado") || "Duelista";
let meuDeck = JSON.parse(localStorage.getItem(`deck_build_${usuario}`))
    || JSON.parse(localStorage.getItem(`deck_${usuario}`))
    || JSON.parse(localStorage.getItem(`deck_inventory_${usuario}`))
    || [];
let minhaMao = [];
let deckOponente = [];
let maoOponente = [];

let monstrosJogador = [null, null, null];
let especiaisJogador = [null, null, null];
let monstrosOponente = [null, null, null];
let especiaisOponente = [null, null, null];

let cemiterioJogador = [];
let cemiterioOponente = [];

document.getElementById("nomeUser").innerText = usuario.toUpperCase();
meuDeck.sort(() => Math.random() - 0.5);

// === INÍCIO DO JOGO ===
function girarRoleta() {
    const btnGirar = document.getElementById("btnGirar");
    const r = document.getElementById("roleta");
    btnGirar.disabled = true;

    const sortei = Math.random() > 0.5 ? "VOCÊ" : "MÁQUINA";
    deckOponente = [...meuDeck].sort(() => Math.random() - 0.5);

    r.style.transform = sortei === "VOCÊ" ? "rotate(1800deg)" : "rotate(1980deg)";

    setTimeout(() => {
        turnoAtual = sortei;
        document.getElementById("modalRoleta").style.display = "none";
        document.getElementById("btnPassarTurno").style.display = "block";

        for (let i = 0; i < 3; i++) {
            if (meuDeck.length > 0) minhaMao.push(meuDeck.pop());
            if (deckOponente.length > 0) maoOponente.push(deckOponente.pop());
        }

        addLog(`Quem começa: <b>${turnoAtual}</b>`, "info");
        addLog("Cada jogador recebeu 3 cartas.", "info");
        atualizarTela();
        if (turnoAtual === "MÁQUINA") setTimeout(turnoDaMaquina, 1500);
    }, 3200);
}

// === MECÂNICAS DE TURNO ===
function comprarCarta() {
    if (turnoAtual !== "VOCÊ" || jaComprou || meuDeck.length === 0) return;
    minhaMao.push(meuDeck.pop());
    jaComprou = true;
    addLog("Você comprou uma carta.", "info");
    atualizarTela();
}

function passarTurno() {
    if (turnoAtual !== "VOCÊ") return;
    addLog("Você passou o turno. Vez da MÁQUINA.", "info");
    turnoAtual = "MÁQUINA";
    primeiroTurnoDoJogo = false;
    resetarTurno();
    atualizarTela();
    setTimeout(turnoDaMaquina, 1500);
}

function resetarTurno() {
    jaInvocouMonstro = false;
    jaComprou = false;
    jaMudouPosicao = false;
    atacanteSelecionadoIdx = null;
    monstrosJogador.forEach(m => { if (m) m.jaAtacou = false; });
    monstrosOponente.forEach(m => { if (m && m.bloqueadoPor > 0) m.bloqueadoPor--; });
    monstrosJogador.forEach(m => { if (m && m.bloqueadoPor > 0) m.bloqueadoPor--; });
}

// === AÇÕES DO JOGADOR ===
function usarDaMao(idx) {
    if (turnoAtual !== "VOCÊ") return;
    const carta = minhaMao[idx];
    cartaPendente = { carta, idxNaMao: idx };

    const botoes = document.getElementById("botoesAcao");
    botoes.innerHTML = "";

    if (carta.tipo === "monstro") {
        if (jaInvocouMonstro) return alert("Apenas 1 invocação por turno!");
        if (monstrosJogador.findIndex(s => s === null) === -1) return alert("Campo cheio!");
        botoes.innerHTML = `
            <button onclick="definirPosicao('ataque')">ATAQUE</button>
            <button onclick="definirPosicao('defesa')">DEFESA</button>`;
    } else {
        const slotDisp = especiaisJogador.findIndex(s => s === null);
        botoes.innerHTML = "";
        if (slotDisp !== -1) {
            botoes.innerHTML += `<button onclick="definirPosicao('baixar')">BAIXAR VIRADA</button>`;
        }
        botoes.innerHTML += `<button onclick="definirPosicao('ativar')">ATIVAR</button>`;
    }

    document.getElementById("textoModal").innerText = carta.nome ? carta.nome.toUpperCase() : "ESCOLHA UMA AÇÃO";
    document.getElementById("modalPosicao").style.display = "flex";
}

function definirPosicao(acao) {
    const { carta, idxNaMao } = cartaPendente;

    if (carta.tipo === "monstro") {
        let slot = monstrosJogador.findIndex(s => s === null);
        if (slot !== -1) {
            monstrosJogador[slot] = {
                ...carta,
                modo: acao,
                revelada: acao === "ataque",
                jaAtacou: false,
                bloqueadoPor: 0
            };
            jaInvocouMonstro = true;
            minhaMao.splice(idxNaMao, 1);
            addLog(`Você invocou um monstro em modo ${acao === "ataque" ? "ATAQUE" : "<i>oculto</i>"}.`, "info");
        }
        fecharModal();
        atualizarTela();
    } else {
        if (acao === "baixar") {
            let slot = especiaisJogador.findIndex(s => s === null);
            if (slot !== -1) {
                especiaisJogador[slot] = { ...carta, revelada: false };
                minhaMao.splice(idxNaMao, 1);
                addLog(`Você fez um <i>movimento oculto</i>.`, "info");
            }
            fecharModal();
            atualizarTela();
        } else {
            fecharModal();
            addLog(`Você ativou <b>${carta.nome}</b>.`, "info");
            ativarEfeito(carta, "VOCÊ", () => {
                minhaMao.splice(idxNaMao, 1);
                atualizarTela();
            });
        }
    }
}

// === COMBATE ===
function clicarMonstroJogador(i) {
    if (turnoAtual !== "VOCÊ" || !monstrosJogador[i]) return;

    if (atacanteSelecionadoIdx === i) {
        atacanteSelecionadoIdx = null;
        atualizarTela();
        return;
    }

    const m = monstrosJogador[i];
    const botoes = document.getElementById("botoesAcao");
    botoes.innerHTML = "";

    const podeAtacar = m.modo === "ataque" && !m.jaAtacou && !primeiroTurnoDoJogo && (m.bloqueadoPor || 0) === 0;
    if (podeAtacar) {
        botoes.innerHTML += `<button onclick="selecionarAtacante(${i}); fecharModal()">ATACAR</button>`;
    }
    if ((m.bloqueadoPor || 0) > 0) {
        botoes.innerHTML += `<div style="color:#a00;padding:8px;">BLOQUEADO (${m.bloqueadoPor} rodadas)</div>`;
    }
    if (!jaMudouPosicao && !m.jaAtacou) {
        const novaModo = m.modo === "ataque" ? "DEFESA" : "ATAQUE";
        botoes.innerHTML += `<button onclick="mudarPosicao(${i}); fecharModal()">MUDAR PARA ${novaModo}</button>`;
    }

    if (botoes.innerHTML === "") return;
    document.getElementById("textoModal").innerText = (m.nome || "MONSTRO").toUpperCase();
    document.getElementById("modalPosicao").style.display = "flex";
}

function mudarPosicao(i) {
    if (turnoAtual !== "VOCÊ" || !monstrosJogador[i] || jaMudouPosicao) return;
    const m = monstrosJogador[i];
    m.modo = m.modo === "ataque" ? "defesa" : "ataque";
    m.revelada = m.modo === "ataque";
    m.jaAtacou = true;
    jaMudouPosicao = true;
    addLog(`<b>${m.nome}</b> mudou para modo ${m.modo.toUpperCase()}.`, "info");
    atualizarTela();
}

function selecionarAtacante(i) {
    if (turnoAtual !== "VOCÊ" || !monstrosJogador[i]) return;
    if (monstrosJogador[i].modo !== "ataque") return;
    if (monstrosJogador[i].jaAtacou) return;
    if ((monstrosJogador[i].bloqueadoPor || 0) > 0) return alert("Este monstro está bloqueado!");
    atacanteSelecionadoIdx = i;
    atualizarTela();
}

function atacar(alvoIdx) {
    if (turnoAtual !== "VOCÊ" || atacanteSelecionadoIdx === null) return;
    if (primeiroTurnoDoJogo) return alert("Quem começa a partida não pode atacar!");

    const atkMonstro = monstrosJogador[atacanteSelecionadoIdx];
    const defMonstro = monstrosOponente[alvoIdx];
    const temMonstrosOponente = monstrosOponente.some(m => m !== null);

    if (!temMonstrosOponente) {
        vidaOponente -= atkMonstro.ataque;
        addLog(`<b>${atkMonstro.nome}</b> ataca direto! Máquina perde ${atkMonstro.ataque} LP.`, "dano");
    } else if (defMonstro) {
        defMonstro.revelada = true;

        if (defMonstro.modo === "ataque") {
            if (atkMonstro.ataque > defMonstro.ataque) {
                const dif = atkMonstro.ataque - defMonstro.ataque;
                vidaOponente -= dif;
                cemiterioOponente.push({ ...monstrosOponente[alvoIdx] });
                monstrosOponente[alvoIdx] = null;
                addLog(`<b>${atkMonstro.nome}</b> destruiu <b>${defMonstro.nome}</b>! Máquina perde ${dif} LP.`, "dano");
            } else if (atkMonstro.ataque < defMonstro.ataque) {
                const dif = defMonstro.ataque - atkMonstro.ataque;
                vidaJogador -= dif;
                cemiterioJogador.push({ ...monstrosJogador[atacanteSelecionadoIdx] });
                monstrosJogador[atacanteSelecionadoIdx] = null;
                addLog(`<b>${atkMonstro.nome}</b> foi destruído por <b>${defMonstro.nome}</b>! Você perde ${dif} LP.`, "morte");
            } else {
                cemiterioOponente.push({ ...monstrosOponente[alvoIdx] });
                monstrosOponente[alvoIdx] = null;
                cemiterioJogador.push({ ...monstrosJogador[atacanteSelecionadoIdx] });
                monstrosJogador[atacanteSelecionadoIdx] = null;
                addLog(`<b>${atkMonstro.nome}</b> e <b>${defMonstro.nome}</b> se destruíram mutuamente!`, "morte");
            }
        } else {
            const defVal = defMonstro.defesa || defMonstro.ataque;
            if (atkMonstro.ataque > defVal) {
                cemiterioOponente.push({ ...monstrosOponente[alvoIdx] });
                monstrosOponente[alvoIdx] = null;
                addLog(`<b>${atkMonstro.nome}</b> destruiu <b>${defMonstro.nome}</b> (defesa).`, "dano");
            } else if (atkMonstro.ataque < defVal) {
                const dif = defVal - atkMonstro.ataque;
                vidaJogador -= dif;
                addLog(`Defesa de <b>${defMonstro.nome}</b> resistiu! Você perde ${dif} LP.`, "dano");
            } else {
                addLog(`Ataque igualou a defesa de <b>${defMonstro.nome}</b>. Nada acontece.`, "info");
            }
        }
    } else {
        return;
    }

    if (monstrosJogador[atacanteSelecionadoIdx]) atkMonstro.jaAtacou = true;
    atacanteSelecionadoIdx = null;
    verificarFimDeJogo();
    atualizarTela();
}

// === INTELIGÊNCIA DA MÁQUINA ===
function turnoDaMaquina() {
    if (deckOponente.length > 0) maoOponente.push(deckOponente.pop());

    // Máquina usa cartas especiais antes de invocar monstro
    for (let idx = maoOponente.length - 1; idx >= 0; idx--) {
        const carta = maoOponente[idx];
        if (carta.tipo !== "especial") continue;
        const efeito = carta.efeito || "";
        const img = carta.imagem || "";

        if (efeito === "aumenta500" || img.includes("powerup")) {
            const alvos = monstrosOponente.map((m, i) => m ? i : null).filter(i => i !== null);
            if (alvos.length > 0) {
                const alvoIdx = alvos.reduce((best, i) =>
                    monstrosOponente[i].ataque > monstrosOponente[best].ataque ? i : best, alvos[0]);
                monstrosOponente[alvoIdx].ataque += 300;
                monstrosOponente[alvoIdx].defesa = (monstrosOponente[alvoIdx].defesa || 0) + 300;
                addLog(`Máquina ativou <b>Power Up</b>! <b>${monstrosOponente[alvoIdx].nome}</b> ficou mais forte! +300 ATK/DEF.`, "dano");
                maoOponente.splice(idx, 1);
            }
        } else if (efeito === "diminui500" || img.includes("powerdown")) {
            const alvos = monstrosJogador.map((m, i) => m ? i : null).filter(i => i !== null);
            if (alvos.length > 0) {
                const alvoIdx = alvos.reduce((best, i) =>
                    monstrosJogador[i].ataque > monstrosJogador[best].ataque ? i : best, alvos[0]);
                const nome = monstrosJogador[alvoIdx].nome;
                monstrosJogador[alvoIdx].ataque = Math.max(0, monstrosJogador[alvoIdx].ataque - 300);
                monstrosJogador[alvoIdx].defesa = Math.max(0, (monstrosJogador[alvoIdx].defesa || 0) - 300);
                addLog(`Máquina ativou <b>Power Down</b>! <b>${nome}</b> ficou mais fraco! -300 ATK/DEF.`, "morte");
                maoOponente.splice(idx, 1);
            }
        }
    }

    // Invoca monstro
    let monIdx = maoOponente.findIndex(c => c.tipo === "monstro");
    let slotM = monstrosOponente.findIndex(s => s === null);
    if (monIdx !== -1 && slotM !== -1) {
        let modo = Math.random() > 0.4 ? "ataque" : "defesa";
        monstrosOponente[slotM] = {
            ...maoOponente[monIdx],
            modo: modo,
            revelada: modo === "ataque",
            jaAtacou: false,
            bloqueadoPor: 0
        };
        addLog(`Máquina invocou um monstro em modo ${modo === "ataque" ? "ATAQUE" : "<i>oculto</i>"}.`, "info");
        maoOponente.splice(monIdx, 1);
    }

    if (!primeiroTurnoDoJogo) {
        monstrosOponente.forEach((m, idx) => {
            if (!m || m.modo !== "ataque" || (m.bloqueadoPor || 0) > 0) return;

            const alvosVivos = monstrosJogador.map((mj, i) => mj ? i : null).filter(i => i !== null);
            if (alvosVivos.length === 0) {
                vidaJogador -= m.ataque;
                addLog(`<b>${m.nome}</b> (máq) ataca direto! Você perde ${m.ataque} LP.`, "dano");
            } else {
                let alvoIdx = alvosVivos[0];
                let alvo = monstrosJogador[alvoIdx];

                if (alvo.modo === "ataque") {
                    if (m.ataque > alvo.ataque) {
                        const dif = m.ataque - alvo.ataque;
                        vidaJogador -= dif;
                        cemiterioJogador.push({ ...monstrosJogador[alvoIdx] });
                        monstrosJogador[alvoIdx] = null;
                        addLog(`<b>${m.nome}</b> (máq) destruiu <b>${alvo.nome}</b>! Você perde ${dif} LP.`, "morte");
                    } else if (m.ataque < alvo.ataque) {
                        const dif = alvo.ataque - m.ataque;
                        vidaOponente -= dif;
                        cemiterioOponente.push({ ...monstrosOponente[idx] });
                        monstrosOponente[idx] = null;
                        addLog(`<b>${alvo.nome}</b> destruiu <b>${m.nome}</b> (máq)! Máquina perde ${dif} LP.`, "dano");
                    } else {
                        cemiterioJogador.push({ ...monstrosJogador[alvoIdx] });
                        monstrosJogador[alvoIdx] = null;
                        cemiterioOponente.push({ ...monstrosOponente[idx] });
                        monstrosOponente[idx] = null;
                        addLog(`<b>${m.nome}</b> e <b>${alvo.nome}</b> se destruíram mutuamente!`, "morte");
                    }
                } else {
                    const defVal = alvo.defesa || alvo.ataque;
                    if (m.ataque > defVal) {
                        cemiterioJogador.push({ ...monstrosJogador[alvoIdx] });
                        monstrosJogador[alvoIdx] = null;
                        addLog(`<b>${m.nome}</b> (máq) destruiu <b>${alvo.nome}</b> em defesa.`, "morte");
                    } else if (m.ataque < defVal) {
                        const dif = defVal - m.ataque;
                        vidaOponente -= dif;
                        cemiterioOponente.push({ ...monstrosOponente[idx] });
                        monstrosOponente[idx] = null;
                        addLog(`Defesa de <b>${alvo.nome}</b> resistiu! Máquina perde ${dif} LP.`, "dano");
                    }
                }
            }
        });
    }

    setTimeout(() => {
        verificarFimDeJogo();
        if (vidaJogador > 0 && vidaOponente > 0) {
            addLog("Vez de <b>VOCÊ</b>.", "info");
            turnoAtual = "VOCÊ";
            primeiroTurnoDoJogo = false;
            resetarTurno();
            atualizarTela();
        }
    }, 1500);
}

// === EFEITOS DE CARTAS ESPECIAIS ===
function ativarEfeito(carta, dono, callback) {
    const efeito = carta.efeito || "";
    const img = carta.imagem || "";

    function nivelJogadorAtual() {
        return parseInt(localStorage.getItem(`nivel_${usuario}`)) || 1;
    }
    function faixaNivel(n) {
        if (n <= 5) return 1;
        if (n <= 10) return 2;
        if (n <= 15) return 3;
        if (n <= 20) return 4;
        return 5;
    }
    function chanceFusaoFaixa(faixa) {
        if (faixa === 1) return 0.98;
        if (faixa === 2) return 0.90;
        if (faixa === 3) return 0.85;
        if (faixa === 4) return 0.80;
        return 0.75;
    }
    function imagemMutanteFaixa(faixa) {
        if (faixa === 1) return "imagens/mutantes/mutante1.jpg";
        if (faixa === 2) return "imagens/mutantes/mutante2.jpg";
        if (faixa === 3) return "imagens/mutantes/mutante3.jpg";
        if (faixa === 4) return "imagens/mutantes/mutante4.jpg";
        return "imagens/mutantes/mutante4.jpg";
    }

    if (efeito === "aumenta500" || img.includes("powerup")) {
        const alvos = monstrosJogador
            .map((m, i) => m ? { i, nome: m.nome, atk: m.ataque } : null)
            .filter(Boolean);
        if (alvos.length === 0) { alert("Nenhum monstro seu em campo!"); return; }
        mostrarSelecao(
            "POTENCIALIZAR QUAL MONSTRO?",
            alvos.map(a => `${a.nome} (ATK ${a.atk})`),
            sel => {
                monstrosJogador[alvos[sel].i].ataque += 300;
                monstrosJogador[alvos[sel].i].defesa = (monstrosJogador[alvos[sel].i].defesa || 0) + 300;
                monstrosJogador[alvos[sel].i].buffState = "up";
                addLog(`<b>${alvos[sel].nome}</b> ficou mais forte! +300 ATK/DEF.`, "cura");
                if (callback) callback();
            }
        );
        return;
    }

    if (efeito === "diminui500" || img.includes("powerdown")) {
        const alvos = monstrosOponente
            .map((m, i) => m ? { i, nome: m.nome, atk: m.ataque } : null)
            .filter(Boolean);
        if (alvos.length === 0) { alert("Nenhum monstro inimigo em campo!"); return; }
        mostrarSelecao(
            "ENFRAQUECER QUAL MONSTRO?",
            alvos.map(a => `${a.nome} (ATK ${a.atk})`),
            sel => {
                monstrosOponente[alvos[sel].i].ataque = Math.max(0, monstrosOponente[alvos[sel].i].ataque - 300);
                monstrosOponente[alvos[sel].i].defesa = Math.max(0, (monstrosOponente[alvos[sel].i].defesa || 0) - 300);
                monstrosOponente[alvos[sel].i].buffState = "down";
                addLog(`<b>${alvos[sel].nome}</b> (inimigo) enfraqueceu! -300 ATK/DEF.`, "dano");
                if (callback) callback();
            }
        );
        return;
    }

    if (efeito === "fusao" || img.includes("fusao") || img.includes("trocal")) {
        const maoMons = minhaMao
            .map((c, i) => c && c.tipo === "monstro" ? { i, c } : null)
            .filter(Boolean);
        if (maoMons.length === 0) { alert("Nenhum monstro na sua mão!"); return; }
        mostrarSelecao(
            "ESCOLHA UM MONSTRO DA SUA MÃO",
            maoMons.map(x => `${x.c.nome} (Nível ${x.c.nivel || 1})`),
            selMao => {
                const escolhidoMao = maoMons[selMao];
                const nv = escolhidoMao.c.nivel || 1;
                const campoCompat = monstrosJogador
                    .map((m, i) => m && m.tipo === "monstro" && (m.nivel || 1) === nv ? { i, m } : null)
                    .filter(Boolean);
                if (campoCompat.length === 0) { alert("Nenhum monstro do mesmo nível no campo!"); return; }
                mostrarSelecao(
                    "ESCOLHA UM MONSTRO DO CAMPO PARA FUSÃO",
                    campoCompat.map(x => `${x.m.nome} (Nível ${x.m.nivel || 1})`),
                    selCampo => {
                        const escCampo = campoCompat[selCampo];
                        const faixa = faixaNivel(nivelJogadorAtual());
                        const chance = chanceFusaoFaixa(faixa);
                        const sucesso = Math.random() < chance;
                        if (!sucesso) {
                            addLog("Fusão falhou.", "info");
                            if (callback) callback();
                            return;
                        }
                        const idxMao = escolhidoMao.i;
                        const idxCampo = escCampo.i;
                        const cM = escolhidoMao.c;
                        const cF = escCampo.m;
                        const novoAtk = Math.floor(((cM.ataque || 0) + (cF.ataque || 0)) / 2) + 300;
                        const baseDefM = cM.defesa || cM.ataque || 0;
                        const baseDefF = cF.defesa || cF.ataque || 0;
                        const novoDef = Math.floor((baseDefM + baseDefF) / 2) + 300;
                        cemiterioJogador.push({ ...cM });
                        minhaMao.splice(idxMao, 1);
                        cemiterioJogador.push({ ...cF });
                        monstrosJogador[idxCampo] = {
                            nome: "Mutante",
                            imagem: imagemMutanteFaixa(faixa),
                            tipo: "monstro",
                            ataque: novoAtk,
                            defesa: novoDef,
                            nivel: nv,
                            modo: "ataque",
                            revelada: true,
                            jaAtacou: false,
                            bloqueadoPor: 0
                        };
                        addLog("Fusão bem-sucedida! Um Mutante nasceu.", "cura");
                        atualizarTela();
                        if (callback) callback();
                    }
                );
            }
        );
        return;
    }

    if (efeito === "bloqueio" || img.includes("bloqueio")) {
        const alvos = monstrosOponente
            .map((m, i) => m && m.modo === "ataque" ? { i, nome: m.nome } : null)
            .filter(Boolean);
        if (alvos.length === 0) { alert("Nenhum monstro inimigo em modo de ATAQUE!"); return; }
        mostrarSelecao(
            "BLOQUEAR QUAL MONSTRO? (3 rodadas)",
            alvos.map(a => a.nome),
            sel => {
                monstrosOponente[alvos[sel].i].bloqueadoPor = 3;
                if (callback) callback();
            }
        );
        return;
    }

    if (efeito === "chamado" || img.includes("chamado")) {
        const alvos = monstrosOponente
            .map((m, i) => m ? { i, nome: m.nome, modo: m.modo } : null)
            .filter(Boolean);
        if (alvos.length === 0) { alert("Nenhum monstro inimigo em campo!"); return; }
        mostrarSelecao(
            "ENVIAR AO CEMITÉRIO QUAL MONSTRO?",
            alvos.map(a => `${a.nome} (${a.modo.toUpperCase()})`),
            sel => {
                cemiterioOponente.push({ ...monstrosOponente[alvos[sel].i] });
                monstrosOponente[alvos[sel].i] = null;
                if (callback) callback();
            }
        );
        return;
    }

    if (efeito === "despertar" || img.includes("despertar")) {
        const todos = [
            ...cemiterioJogador.map((c, i) => ({ c, origem: "J", i })),
            ...cemiterioOponente.map((c, i) => ({ c, origem: "O", i }))
        ].filter(x => x.c.tipo === "monstro");

        if (todos.length === 0) { alert("Nenhum monstro no cemitério!"); return; }
        mostrarSelecao(
            "DESPERTAR QUAL MONSTRO?",
            todos.map(x => `${x.c.nome} (${x.origem === "J" ? "Seu" : "Inimigo"})`),
            sel => {
                const escolhido = todos[sel];
                minhaMao.push({ ...escolhido.c, modo: undefined, revelada: undefined, jaAtacou: undefined, bloqueadoPor: undefined });
                if (escolhido.origem === "J") cemiterioJogador.splice(escolhido.i, 1);
                else cemiterioOponente.splice(escolhido.i, 1);
                if (callback) callback();
            }
        );
        return;
    }

    if (callback) callback();
}

function mostrarSelecao(titulo, opcoes, callback) {
    callbackSelecao = callback;
    document.getElementById("textoModal").innerText = titulo;
    const botoes = document.getElementById("botoesAcao");
    botoes.innerHTML = "";
    opcoes.forEach((op, i) => {
        const btn = document.createElement("button");
        btn.innerText = op;
        btn.onclick = () => {
            fecharModal();
            if (callbackSelecao) {
                const cb = callbackSelecao;
                callbackSelecao = null;
                cb(i);
            }
        };
        botoes.appendChild(btn);
    });
    document.getElementById("modalPosicao").style.display = "flex";
}

function ativacaoSlot(i) {
    if (turnoAtual !== "VOCÊ" || !especiaisJogador[i]) return;
    const carta = especiaisJogador[i];
    if (!carta.revelada) {
        const botoes = document.getElementById("botoesAcao");
        botoes.innerHTML = `
            <button onclick="revelarEAtivarSlot(${i})">REVELAR E ATIVAR</button>`;
        document.getElementById("textoModal").innerText = "CARTA VIRADA";
        document.getElementById("modalPosicao").style.display = "flex";
    } else {
        ativarEfeito(carta, "VOCÊ", () => {
            especiaisJogador[i] = null;
            atualizarTela();
        });
    }
}

function revelarEAtivarSlot(i) {
    fecharModal();
    if (!especiaisJogador[i]) return;
    especiaisJogador[i].revelada = true;
    const carta = especiaisJogador[i];
    ativarEfeito(carta, "VOCÊ", () => {
        especiaisJogador[i] = null;
        atualizarTela();
    });
}

// === RENDERIZAÇÃO ===
function atualizarTela() {
    document.getElementById("vidaJogador").innerText = vidaJogador;
    document.getElementById("vidaOponente").innerText = vidaOponente;
    document.getElementById("contador-deck").innerText = meuDeck.length;
    document.getElementById("turnoAviso").innerText = `TURNO: ${turnoAtual}`;

    renderLinha("monstrosJogador", monstrosJogador, i => clicarMonstroJogador(i), true, false);
    renderLinha("especiaisJogador", especiaisJogador, i => ativacaoSlot(i), true, true);
    renderLinha("monstrosOponente", monstrosOponente, i => atacar(i), false, false);
    renderLinha("especiaisOponente", especiaisOponente, null, false, true);

    // Botão ataque direto: aparece quando atacante selecionado e oponente sem monstros
    const semMonstrosOp = !monstrosOponente.some(m => m !== null);
    const btnDireto = document.getElementById("btnAtaqueDireto");
    if (btnDireto) {
        btnDireto.style.display =
            (atacanteSelecionadoIdx !== null && semMonstrosOp && !primeiroTurnoDoJogo)
                ? "block" : "none";
    }

    atualizarCemiterio("cemiterioJogador", cemiterioJogador);
    atualizarCemiterio("cemiterioOponente", cemiterioOponente);

    const maoDiv = document.getElementById("minhaMao");    maoDiv.innerHTML = "";
    const total = minhaMao.length;
    minhaMao.forEach((c, i) => {
        const img = document.createElement("img");
        img.src = c.imagem;
        img.className = "carta-mao";
        const offset = total > 1 ? (i - (total - 1) / 2) : 0;
        const angle  = offset * 6;
        const yLift  = Math.abs(offset) * 5;
        img.style.transform = `rotate(${angle}deg) translateY(${yLift}px)`;
        img.style.zIndex = i;
        img.onclick = () => usarDaMao(i);
        maoDiv.appendChild(img);
    });

    const maoOpDiv = document.getElementById("maoOponente"); if (maoOpDiv) {
        maoOpDiv.innerHTML = "";
        const totOp = maoOponente.length;
        maoOponente.forEach((c, i) => {
            const img = document.createElement("img");
            img.src = "imagens/back.jpg";
            img.className = "carta-mao";
            const offset = totOp > 1 ? (i - (totOp - 1) / 2) : 0;
            const angle  = offset * -6;
            const yLift  = Math.abs(offset) * 5;
            img.style.transform = `rotate(${angle}deg) translateY(${yLift}px)`;
            img.style.zIndex = i;
            maoOpDiv.appendChild(img);
        });
    }

    // Auto-pass: se for turno do jogador e não houver mais ações disponíveis
    if (turnoAtual === "VOCÊ") {
        clearTimeout(window._autoPassTimer);
        window._autoPassTimer = setTimeout(() => {
            if (turnoAtual === "VOCÊ" && !jogadorPodeAgir()) {
                addLog("Nenhuma ação disponível — passando turno automaticamente...", "info");
                setTimeout(passarTurno, 600);
            }
        }, 2000);
    }
}

function atualizarCemiterio(id, lista) {
    const el = document.getElementById(id);
    if (lista.length > 0) {
        const ultima = lista[lista.length - 1];
        el.innerHTML = `
            <img src="${ultima.imagem}" style="width:100%;height:100%;object-fit:cover;opacity:0.75;">
            <span class="gy-count">${lista.length}</span>`;
    } else {
        el.innerHTML = "";
    }
}

function renderLinha(id, lista, clique, isJogador, isEspecial) {
    const el = document.getElementById(id);
    el.innerHTML = "";
    lista.forEach((c, i) => {
        const div = document.createElement("div");
        div.className = "slot";

        if (c) {
            if (c.modo === "defesa") div.classList.add("modo-defesa");
            if (isJogador && !isEspecial && atacanteSelecionadoIdx === i) div.classList.add("selecionada");
            if (clique) div.onclick = () => clique(i);

            const imgPath = !c.revelada ? "imagens/back.jpg" : c.imagem;
            div.innerHTML = `<img src="${imgPath}" class="carta-img">`;

            if (c.tipo === "monstro") {
                if (isJogador || c.revelada) {
                    const cls = c.buffState === "up" ? "buff-up" : (c.buffState === "down" ? "buff-down" : "");
                    const defVal = (c.defesa || c.ataque);
                    div.innerHTML += `<div class="status-dual ${cls}"><span class="stat atk">ATK ${c.ataque}</span><span class="stat def">DEF ${defVal}</span></div>`;
                }
                if ((c.bloqueadoPor || 0) > 0) {
                    div.innerHTML += `<div class="status-badge bloq-badge">BLOQ ${c.bloqueadoPor}</div>`;
                }
            }
        } else {
            if (clique) div.onclick = () => clique(i);
        }

        el.appendChild(div);
    });
}

// === FIM DE JOGO ===
function verificarFimDeJogo() {
    if (vidaJogador <= 0) {
        addLog("Seus LP chegaram a ZERO. DERROTA!", "morte");
        const titulo = document.getElementById("resultadoTitulo");
        titulo.innerText = "DERROTA";
        titulo.className = "resultado-titulo derrota";
        document.getElementById("resultadoMensagem").innerHTML =
            "Seus pontos de vida chegaram a zero.<br>Tente novamente!";
        document.getElementById("modalResultado").style.display = "flex";
        return;
    }
    if (vidaOponente <= 0) {
        addLog("LP da máquina chegaram a ZERO. VITÓRIA!", "cura");

        let vitorias = parseInt(localStorage.getItem(`vitorias_${usuario}`)) || 0;
        vitorias++;
        localStorage.setItem(`vitorias_${usuario}`, vitorias);

        const novaCarta = sortearCartaRecompensa();
        const inv = JSON.parse(localStorage.getItem(`deck_inventory_${usuario}`)) || JSON.parse(localStorage.getItem(`deck_${usuario}`)) || [];
        inv.push({ nome: novaCarta.nome, imagem: novaCarta.imagem, tipo: "monstro", ataque: novaCarta.atk, defesa: novaCarta.def });
        localStorage.setItem(`deck_inventory_${usuario}`, JSON.stringify(inv));

        const titulo = document.getElementById("resultadoTitulo");
        titulo.innerText = "VITÓRIA!";
        titulo.className = "resultado-titulo vitoria";

        document.getElementById("resultadoCartaImg").src = novaCarta.imagem;
        document.getElementById("resultadoCartaInfo").innerHTML =
            `<b>${novaCarta.nome}</b> — ATK ${novaCarta.ataque} / DEF ${novaCarta.defesa}`;
        document.getElementById("resultadoCartaBox").style.display = "flex";

        let extra = "";
        let nivel = parseInt(localStorage.getItem(`nivel_${usuario}`)) || 1;
        if (vitorias >= 5 && nivel < 2) {
            nivel = 2;
            localStorage.setItem(`nivel_${usuario}`, nivel);
            let moedas = parseInt(localStorage.getItem(`moedas_${usuario}`)) || 0;
            moedas += 300000;
            localStorage.setItem(`moedas_${usuario}`, moedas);
            extra = `<div class="resultado-nivel">NÍVEL 2 DESBLOQUEADO! +300000 moedas</div>`;
        }

        document.getElementById("resultadoMensagem").innerHTML =
            `Vitória ${vitorias} registrada!${extra}`;

        document.getElementById("modalResultado").style.display = "flex";
    }
}

function sortearCartaRecompensa() {
    const nivel = parseInt(localStorage.getItem(`nivel_${usuario}`)) || 1;
    const pool = [];

    if (nivel >= 2) {
        // === POOL NÍVEL 2 ===
        pool.push({ nome: "Guerreiro",  imagem: "imagens/guerreiros/guerreiro1.jpg", atk: 800,  def: 600,  nivel: 1 }); // 100%
        if (Math.random() < 0.55) pool.push({ nome: "Orc",      imagem: "imagens/orcs/orc1.jpg",          atk: 900,  def: 700,  nivel: 1 });
        if (Math.random() < 0.55) pool.push({ nome: "Troll",    imagem: "imagens/trolls/troll1.jpg",      atk: 1000, def: 800,  nivel: 1 });
        if (Math.random() < 0.55) pool.push({ nome: "Gigante",  imagem: "imagens/gigantes/gigante1.jpg",  atk: 1050, def: 800,  nivel: 1 });
        if (Math.random() < 0.55) pool.push({ nome: "Morte",    imagem: "imagens/mortes/morte1.jpg",      atk: 1300, def: 1100, nivel: 1 });
        if (Math.random() < 0.55) pool.push({ nome: "Guerreiro 2", imagem: "imagens/guerreiros/guerreiro2.jpg", atk: 1400, def: 1100, nivel: 2 });
        if (Math.random() < 0.25) pool.push({ nome: "Orc 2",    imagem: "imagens/orcs/orc2.jpg",          atk: 1450, def: 1150, nivel: 2 });
        if (Math.random() < 0.15) pool.push({ nome: "Troll 2",  imagem: "imagens/trolls/troll2.jpg",      atk: 1500, def: 1200, nivel: 2 });
        if (Math.random() < 0.05) pool.push({ nome: "Gigante 2",imagem: "imagens/gigantes/gigante2.jpg",  atk: 1600, def: 1300, nivel: 2 });
        if (Math.random() < 0.02) pool.push({ nome: "Morte 2",  imagem: "imagens/mortes/morte2.jpg",      atk: 1800, def: 1400, nivel: 2 });
    } else {
        // === POOL NÍVEL 1 ===
        pool.push({ nome: "Guerreiro", imagem: "imagens/guerreiros/guerreiro1.jpg", atk: 800,  def: 600 }); // 100%
        if (Math.random() < 0.30) pool.push({ nome: "Orc",     imagem: "imagens/orcs/orc1.jpg",     atk: 900,  def: 700 });
        if (Math.random() < 0.30) pool.push({ nome: "Troll",   imagem: "imagens/trolls/troll1.jpg", atk: 1000, def: 800 });
        if (Math.random() < 0.30) pool.push({ nome: "Gigante", imagem: "imagens/gigantes/gigante1.jpg", atk: 1050, def: 800 });
        if (Math.random() < 0.30) pool.push({ nome: "Morte",   imagem: "imagens/mortes/morte1.jpg",   atk: 1300, def: 1100 });
    }

    const carta = pool[Math.floor(Math.random() * pool.length)];
    return {
        nome: carta.nome,
        imagem: carta.imagem,
        tipo: "monstro",
        ataque: carta.atk,
        defesa: carta.def,
        nivel: carta.nivel || 1
    };
}

function jogadorPodeAgir() {
    // Pode comprar carta
    if (!jaComprou && meuDeck.length > 0) return true;

    // Pode invocar monstro da mão
    if (!jaInvocouMonstro
        && minhaMao.some(c => c.tipo === "monstro")
        && monstrosJogador.some(s => s === null)) return true;

    // Tem carta especial na mão para usar ou baixar
    if (minhaMao.some(c => c.tipo === "especial")) return true;

    // Pode atacar com algum monstro em ATK
    if (!primeiroTurnoDoJogo && monstrosJogador.some(m =>
        m && m.modo === "ataque" && !m.jaAtacou && (m.bloqueadoPor || 0) === 0
    )) return true;

    return false;
    // Nota: mudar posição e ativar especial do campo são ações OPCIONAIS —
    // não bloqueiam o auto-pass. O jogador as usa antes do timer disparar.
}

function ataqueDireto() {
    if (turnoAtual !== "VOCÊ" || atacanteSelecionadoIdx === null) return;
    if (primeiroTurnoDoJogo) return alert("Não pode atacar no turno 1!");
    const atk = monstrosJogador[atacanteSelecionadoIdx];
    vidaOponente -= atk.ataque;
    addLog(`<b>${atk.nome}</b> ataca direto! Máquina perde ${atk.ataque} LP.`, "dano");
    atk.jaAtacou = true;
    atacanteSelecionadoIdx = null;
    verificarFimDeJogo();
    atualizarTela();
}

function fecharModal() {
    document.getElementById("modalPosicao").style.display = "none";
    callbackSelecao = null;
}
