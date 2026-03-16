/* === js/efeitos.js === */

function acaoEspecial(idx) {
    if (turnoAtual !== "VOCÊ") return;
    let esp = especiaisJogador[idx];
    if (!esp || esp.revelada) return;
    
    mostrarSelecao("ESPECIAL", ["ATIVAR"], (sel) => {
        if (sel === 0) {
            ativarEfeitoEspecialCampo(idx);
        }
    });
}

function ativarEfeitoEspecialCampo(idx) {
    const esp = especiaisJogador[idx];
    ativarEfeitoEspecial(esp, () => {
        if (!esp.imagem.toLowerCase().includes("bloqueio.jpg")) {
            cemiterioJogador.push(especiaisJogador[idx]);
            especiaisJogador[idx] = null;
        }
    });
}

function ativarEfeitoEspecial(cartaParaUsar, callbackRemover) {
    const img = cartaParaUsar.imagem.toLowerCase();

    // LÓGICA DE TRANSFORMAÇÃO EM ROBÔ (EQUIPAR)
    if (img.includes("equipar.jpg")) {
        let alvos = monstrosJogador.map((m, i) => m ? {i, nome: m.nome, imagem: m.imagem} : null)
            .filter(m => m !== null && !m.imagem.toLowerCase().includes("robo"));
        if (alvos.length === 0) return alert("Sem monstros válidos no campo para equipar! (Robôs não podem ser re-equipados)");
        const opcoes = [
            { nome: "Robô A1", imagem: "imagens/robos/robo1.jpg", ataque: 2000, defesa: 1800, nivelReq: 1 },
            { nome: "Robô A2", imagem: "imagens/robos/robo2.jpg", ataque: 2200, defesa: 2000, nivelReq: 2 },
            { nome: "Robô A3", imagem: "imagens/robos/robo3.jpg", ataque: 2500, defesa: 2200, nivelReq: 3 },
            { nome: "Robô A4", imagem: "imagens/robos/robo4.jpg", ataque: 2800, defesa: 2500, nivelReq: 4 },
            { nome: "Robô A5", imagem: "imagens/robos/robo5.jpg", ataque: 3100, defesa: 2800, nivelReq: 5 }
        ].filter(r => nivelAtual >= r.nivelReq);
        if (opcoes.length === 0) return alert("Nenhum robô disponível no seu nível.");
        mostrarSelecao("ESCOLHA O MONSTRO", alvos.map(a => a.nome), (selMon) => {
            const mIdx = alvos[selMon].i;
            mostrarSelecao("ESCOLHA O ROBÔ", opcoes.map(o => o.nome), (selRobo) => {
                const r = opcoes[selRobo];
                monstrosJogador[mIdx].imagem = r.imagem;
                monstrosJogador[mIdx].nome = r.nome;
                monstrosJogador[mIdx].ataque = r.ataque;
                monstrosJogador[mIdx].defesa = r.defesa;
                const removida = callbackRemover();
                if (removida) cemiterioJogador.push(removida);
                logBatalha(`Transformação em ${r.nome}`, "info");
                atualizarTela();
            });
        });
    } else if (img.includes("powerup")) {
        let alvos = monstrosJogador.map((m, i) => m ? {i, nome: m.nome} : null).filter(Boolean);
        if (alvos.length === 0) return alert("Sem monstros no campo!");
        mostrarSelecao("POWERUP (+300 ATK/DEF)", alvos.map(a => a.nome), (sel) => {
            const mIdx = alvos[sel].i;
            monstrosJogador[mIdx].ataque += 300; 
            monstrosJogador[mIdx].defesa += 300;
            const removida = callbackRemover();
            if (removida) cemiterioJogador.push(removida);
            logBatalha(`PowerUp em ${monstrosJogador[mIdx].nome}`, "info");
            atualizarTela();
        });
    } else if (img.includes("powerdown")) {
        let alvos = monstrosOponente.map((m, i) => m ? {i, nome: m.nome} : null).filter(Boolean);
        if (alvos.length === 0) return alert("Oponente sem monstros!");
        mostrarSelecao("POWERDOWN (-300 ATK/DEF)", alvos.map(a => a.nome), (sel) => {
            const mIdx = alvos[sel].i;
            monstrosOponente[mIdx].ataque = Math.max(0, monstrosOponente[mIdx].ataque - 300); 
            monstrosOponente[mIdx].defesa = Math.max(0, monstrosOponente[mIdx].defesa - 300);
            const removida = callbackRemover();
            if (removida) cemiterioJogador.push(removida);
            logBatalha(`PowerDown em ${monstrosOponente[mIdx].nome}`, "dano");
            atualizarTela();
        });
    } else if (img.includes("bloqueio.jpg")) {
        let alvos = monstrosOponente.map((m, i) => m ? {i, nome: m.nome} : null).filter(Boolean);
        if (alvos.length === 0) return alert("Oponente sem monstros para bloquear!");
        mostrarSelecao("BLOQUEAR MONSTRO (3 TURNOS)", alvos.map(a => a.nome), (sel) => {
            const mIdx = alvos[sel].i;
            monstrosOponente[mIdx].bloqueado = true;
            monstrosOponente[mIdx].turnosBloqueio = 3;
            const removida = callbackRemover(); 
            if (removida && !removida.vinculo) {
                const slotEsp = especiaisJogador.findIndex(s => s === null);
                if (slotEsp === -1) return alert("Sem slots de especiais vazios!");
                especiaisJogador[slotEsp] = { 
                    ...removida, 
                    revelada: true, 
                    vinculo: mIdx, 
                    turnosRestantes: 3 
                };
            } else {
                cartaParaUsar.revelada = true;
                cartaParaUsar.vinculo = mIdx;
                cartaParaUsar.turnosRestantes = 3;
            }
            logBatalha(`Bloqueio ativado em ${monstrosOponente[mIdx].nome}`, "info");
            atualizarTela();
        });
    } else if (img.includes("chamado.jpg")) {
        let alvos = monstrosOponente.map((m, i) => m ? {i, nome: m.nome} : null).filter(Boolean);
        if (alvos.length === 0) return alert("Oponente sem monstros para o chamado!");
        mostrarSelecao("ENVIAR AO CEMITÉRIO", alvos.map(a => a.nome), (sel) => {
            const mIdx = alvos[sel].i;
            logBatalha(`${monstrosOponente[mIdx].nome} foi enviado ao cemitério!`, "info");
            cemiterioOponente.push(monstrosOponente[mIdx]);
            monstrosOponente[mIdx] = null;
            const removida = callbackRemover();
            if (removida) cemiterioJogador.push(removida);
            atualizarTela();
        });
    } else if (img.includes("vida.jpg")) {
        vidaJogador += 500;
        logBatalha(`Você recuperou 500 LP!`, "cura");
        const removida = callbackRemover();
        if (removida) cemiterioJogador.push(removida);
        atualizarTela();
    } else if (img.includes("fusao.jpg")) {
        let monstrosNoCampo = monstrosJogador.map((m, i) => m ? {i, nome: m.nome} : null).filter(Boolean);
        let monstrosNaMao = minhaMao.filter(c => c.tipo === "monstro" && c !== cartaParaUsar);
        if (monstrosNoCampo.length === 0 || monstrosNaMao.length === 0) return alert("Você precisa de 1 monstro no campo e 1 na mão para a fusão!");
        mostrarSelecao("MONSTRO DO CAMPO", monstrosNoCampo.map(m => m.nome), (selCampo) => {
            const mCampoIdx = monstrosNoCampo[selCampo].i;
            mostrarSelecao("MONSTRO DA MÃO", monstrosNaMao.map(m => m.nome), (selMao) => {
                const mMaoObj = monstrosNaMao[selMao];
                const mMaoIdx = minhaMao.indexOf(mMaoObj);
                let mutante;
                if (nivelAtual <= 5) mutante = { nome: "Mutante 1", imagem: "imagens/mutantes/mutante1.jpg", ataque: 2500, defesa: 2000, tipo: "monstro" };
                else if (nivelAtual <= 10) mutante = { nome: "Mutante 2", imagem: "imagens/mutantes/mutante2.jpg", ataque: 3000, defesa: 2500, tipo: "monstro" };
                else mutante = { nome: "Mutante 3", imagem: "imagens/mutantes/mutante3.jpg", ataque: 3500, defesa: 2900, tipo: "monstro" };
                cemiterioJogador.push(monstrosJogador[mCampoIdx]);
                cemiterioJogador.push(minhaMao.splice(mMaoIdx, 1)[0]);
                monstrosJogador[mCampoIdx] = { ...mutante, modo: "ataque", revelada: true, jaAtacou: false, acabouDeSerInvocado: true, mudouPosicaoNesteTurno: false };
                const removida = callbackRemover();
                if (removida) cemiterioJogador.push(removida);
                logBatalha(`Fusão realizada: ${mutante.nome}!`, "info");
                atualizarTela();
            });
        });
    } else if (img.includes("trocal.jpg")) {
        let alvos = monstrosOponente.map((m, i) => m ? {i, nome: m.nome} : null).filter(Boolean);
        if (alvos.length === 0) return alert("Oponente sem monstros para roubar!");
        const slotLivre = monstrosJogador.findIndex(s => s === null);
        if (slotLivre === -1) return alert("Você não tem espaço no campo para o monstro roubado!");
        mostrarSelecao("ROUBAR MONSTRO (2 TURNOS)", alvos.map(a => a.nome), (sel) => {
            const mIdxOponente = alvos[sel].i;
            const monstroRoubado = monstrosOponente[mIdxOponente];
            monstrosJogador[slotLivre] = { ...monstroRoubado, roubado: true, turnosRoubo: 2, donoOriginal: "oponente", revelada: true, jaAtacou: false };
            monstrosOponente[mIdxOponente] = null;
            const removida = callbackRemover();
            if (removida) cemiterioJogador.push(removida);
            logBatalha(`Você roubou ${monstroRoubado.nome}!`, "info");
            atualizarTela();
        });
    } else if (img.includes("despertar.jpg")) {
        let todosCemiterio = [...cemiterioJogador, ...cemiterioOponente];
        let monstrosNoCemiterio = todosCemiterio.filter(c => c.tipo === "monstro");
        if (monstrosNoCemiterio.length === 0) return alert("Nenhum monstro no cemitério!");
        mostrarSelecao("DESPERTAR MONSTRO", monstrosNoCemiterio.map(m => m.nome), (sel) => {
            const mGanhado = monstrosNoCemiterio[sel];
            let idxJ = cemiterioJogador.indexOf(mGanhado);
            if (idxJ !== -1) cemiterioJogador.splice(idxJ, 1);
            else {
                let idxO = cemiterioOponente.indexOf(mGanhado);
                if (idxO !== -1) cemiterioOponente.splice(idxO, 1);
            }
            if (minhaMao.length >= 5) escolherDescarte(mGanhado);
            else minhaMao.push(mGanhado);
            const removida = callbackRemover();
            if (removida) cemiterioJogador.push(removida);
            logBatalha(`${mGanhado.nome} despertou do cemitério!`, "info");
            atualizarTela();
        });
    }
}