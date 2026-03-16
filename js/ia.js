/* === js/ia.js === */

function turnoDaMaquina() {
    comprarCarta("oponente");
    
    // --- 1. USO DE CARTAS ESPECIAIS DA MÃO ---
    let especiaisMao = maoOponente.filter(c => c.tipo === "especial");
    especiaisMao.forEach(esp => {
        const img = esp.imagem.toLowerCase();
        let usou = false;

        if (img.includes("vida.jpg") && vidaOponente < 4000) {
            vidaOponente += 500;
            logBatalha(`Máquina usou Vida e recuperou 500 LP!`, "cura");
            usou = true;
        } else if (img.includes("powerup.jpg")) {
            let alvos = monstrosOponente.filter(m => m !== null);
            if (alvos.length > 0) {
                let alvo = alvos.sort((a,b) => b.ataque - a.ataque)[0];
                alvo.ataque += 300; alvo.defesa += 300;
                logBatalha(`Máquina usou PowerUp em ${alvo.nome}`, "info");
                usou = true;
            }
        } else if (img.includes("powerdown.jpg")) {
            let alvosJ = monstrosJogador.filter(m => m !== null);
            if (alvosJ.length > 0) {
                let alvo = alvosJ.sort((a,b) => b.ataque - a.ataque)[0];
                alvo.ataque = Math.max(0, alvo.ataque - 300);
                alvo.defesa = Math.max(0, alvo.defesa - 300);
                logBatalha(`Máquina usou PowerDown em ${alvo.nome}`, "dano");
                usou = true;
            }
        } else if (img.includes("bloqueio.jpg")) {
            let alvosJ = monstrosJogador.filter(m => m !== null && !m.bloqueado);
            if (alvosJ.length > 0) {
                let alvo = alvosJ.sort((a,b) => b.ataque - a.ataque)[0];
                let idxJ = monstrosJogador.indexOf(alvo);
                let slotEsp = especiaisOponente.findIndex(s => s === null);
                if (slotEsp !== -1) {
                    alvo.bloqueado = true;
                    alvo.turnosBloqueio = 3;
                    especiaisOponente[slotEsp] = { ...esp, revelada: true, vinculo: idxJ, turnosRestantes: 3 };
                    logBatalha(`Máquina bloqueou ${alvo.nome}!`, "info");
                    usou = true;
                }
            }
        } else if (img.includes("chamado.jpg")) {
            let alvosJ = monstrosJogador.filter(m => m !== null);
            if (alvosJ.length > 0) {
                let alvo = alvosJ.sort((a,b) => b.ataque - a.ataque)[0];
                let idxJ = monstrosJogador.indexOf(alvo);
                cemiterioJogador.push(monstrosJogador[idxJ]);
                monstrosJogador[idxJ] = null;
                logBatalha(`Máquina usou Chamado e destruiu ${alvo.nome}!`, "info");
                usou = true;
            }
        } else if (img.includes("trocal.jpg")) {
            let alvosJ = monstrosJogador.filter(m => m !== null);
            let slotLivre = monstrosOponente.findIndex(s => s === null);
            if (alvosJ.length > 0 && slotLivre !== -1) {
                let alvo = alvosJ.sort((a,b) => b.ataque - a.ataque)[0];
                let idxJ = monstrosJogador.indexOf(alvo);
                monstrosOponente[slotLivre] = { ...alvo, roubado: true, turnosRoubo: 2, donoOriginal: "jogador", revelada: true, jaAtacou: false };
                monstrosJogador[idxJ] = null;
                logBatalha(`Máquina roubou seu ${alvo.nome}!`, "info");
                usou = true;
            }
        } else if (img.includes("despertar.jpg")) {
            let monstrosCemiterio = cemiterioOponente.filter(c => c.tipo === "monstro");
            if (monstrosCemiterio.length > 0 && maoOponente.length < 5) {
                let m = monstrosCemiterio.sort((a,b) => b.ataque - a.ataque)[0];
                cemiterioOponente.splice(cemiterioOponente.indexOf(m), 1);
                maoOponente.push(m);
                logBatalha(`Máquina despertou ${m.nome} do cemitério!`, "info");
                usou = true;
            }
        } else if (img.includes("equipar.jpg")) {
            let alvos = monstrosOponente.filter(m => m !== null && !m.imagem.includes("robo"));
            if (alvos.length > 0) {
                const robos = [
                    { nome: "Robô A1", imagem: "imagens/robos/robo1.jpg", ataque: 2000, defesa: 1800, nivelReq: 1 },
                    { nome: "Robô A2", imagem: "imagens/robos/robo2.jpg", ataque: 2200, defesa: 2000, nivelReq: 2 },
                    { nome: "Robô A3", imagem: "imagens/robos/robo3.jpg", ataque: 2500, defesa: 2200, nivelReq: 3 },
                    { nome: "Robô A4", imagem: "imagens/robos/robo4.jpg", ataque: 2800, defesa: 2500, nivelReq: 4 },
                    { nome: "Robô A5", imagem: "imagens/robos/robo5.jpg", ataque: 3100, defesa: 2800, nivelReq: 5 }
                ].filter(r => nivelAtual >= r.nivelReq);
                if (robos.length > 0) {
                    let robo = robos[robos.length - 1];
                    let alvo = alvos.sort((a,b) => a.ataque - b.ataque)[0];
                    if (alvo.ataque < robo.ataque) {
                        alvo.nome = robo.nome; alvo.imagem = robo.imagem;
                        alvo.ataque = robo.ataque; alvo.defesa = robo.defesa;
                        logBatalha(`Máquina equipou ${robo.nome}!`, "info");
                        usou = true;
                    }
                }
            }
        } else if (img.includes("fusao.jpg")) {
            let monstrosCampo = monstrosOponente.filter(m => m !== null);
            let monstrosMao = maoOponente.filter(c => c.tipo === "monstro");
            if (monstrosCampo.length > 0 && monstrosMao.length > 0) {
                let mutante;
                if (nivelAtual <= 5) mutante = { nome: "Mutante 1", imagem: "imagens/mutantes/mutante1.jpg", ataque: 2500, defesa: 2000, tipo: "monstro" };
                else if (nivelAtual <= 10) mutante = { nome: "Mutante 2", imagem: "imagens/mutantes/mutante2.jpg", ataque: 3000, defesa: 2500, tipo: "monstro" };
                else mutante = { nome: "Mutante 3", imagem: "imagens/mutantes/mutante3.jpg", ataque: 3500, defesa: 2900, tipo: "monstro" };
                
                let mCampo = monstrosCampo.sort((a,b) => a.ataque - b.ataque)[0];
                let mMao = monstrosMao.sort((a,b) => a.ataque - b.ataque)[0];
                
                cemiterioOponente.push(mCampo);
                cemiterioOponente.push(maoOponente.splice(maoOponente.indexOf(mMao), 1)[0]);
                
                let idxCampo = monstrosOponente.indexOf(mCampo);
                monstrosOponente[idxCampo] = { ...mutante, modo: "ataque", revelada: true, jaAtacou: false, acabouDeSerInvocado: true, mudouPosicaoNesteTurno: false };
                logBatalha(`Máquina realizou Fusão: ${mutante.nome}!`, "info");
                usou = true;
            }
        }

        if (usou) {
            maoOponente.splice(maoOponente.indexOf(esp), 1);
            cemiterioOponente.push(esp);
            atualizarTela();
        }
    });

    // --- 2. INVOCAÇÃO DE MONSTROS ---
    let monstrosMao = maoOponente.filter(c => c.tipo === "monstro");
    if (monstrosMao.length > 0) {
        let monSac = monstrosMao.filter(m => m.sacrifio > 0).sort((a,b) => b.ataque - a.ataque)[0];
        let monstrosNoCampo = monstrosOponente.filter(m => m !== null);
        
        if (monSac && monstrosNoCampo.length >= monSac.sacrifio) {
            let sacrificados = monstrosNoCampo.sort((a,b) => a.ataque - b.ataque).slice(0, monSac.sacrifio);
            sacrificados.forEach(s => {
                cemiterioOponente.push(s);
                monstrosOponente[monstrosOponente.indexOf(s)] = null;
            });
            let slot = monstrosOponente.findIndex(s => s === null);
            monstrosOponente[slot] = { ...monSac, modo: "ataque", revelada: true, jaAtacou: false, acabouDeSerInvocado: true, mudouPosicaoNesteTurno: false };
            maoOponente.splice(maoOponente.indexOf(monSac), 1);
            logBatalha(`Máquina invocou por Sacrifício: ${monSac.nome}!`, "info");
        } else {
            let monNorm = monstrosMao.filter(m => !m.sacrifio).sort((a,b) => b.ataque - a.ataque)[0];
            let slot = monstrosOponente.findIndex(s => s === null);
            if (monNorm && slot !== -1) {
                let modoIA = "ataque";
                let mForteJ = monstrosJogador.filter(m => m && m.modo === "ataque").sort((a,b) => b.ataque - a.ataque)[0];
                if ((mForteJ && mForteJ.ataque > monNorm.ataque) || vidaOponente < 1500) modoIA = "defesa";
                
                monstrosOponente[slot] = { ...monNorm, modo: modoIA, revelada: (modoIA === "ataque"), jaAtacou: false, acabouDeSerInvocado: true, mudouPosicaoNesteTurno: false };
                maoOponente.splice(maoOponente.indexOf(monNorm), 1);
            }
        }
        atualizarTela();
    }

    setTimeout(() => {
        // --- 3. FASE DE BATALHA ---
        monstrosOponente.forEach((m, idx) => {
            if (m && m.modo === "ataque" && !m.jaAtacou && !m.bloqueado && !m.acabouDeSerInvocado && !primeiroTurnoDoJogo) {
                let alvosValidos = monstrosJogador.map((mj, i) => mj ? { ...mj, originalIdx: i } : null).filter(v => v !== null);
                
                if (alvosValidos.length === 0) {
                    vidaJogador -= m.ataque;
                    logBatalha(`Máquina atacou direto! -${m.ataque} LP`, "dano");
                    m.jaAtacou = true;
                } else {
                    let alvosVenciveis = alvosValidos.filter(alvo => m.ataque > (alvo.modo === "ataque" ? alvo.ataque : alvo.defesa));
                    if (alvosVenciveis.length > 0) {
                        alvosVenciveis.sort((a,b) => (a.modo === "ataque" ? a.ataque : 0) - (b.modo === "ataque" ? b.ataque : 0));
                        resolverCombate(idx, alvosVenciveis[alvosVenciveis.length-1].originalIdx, false);
                    } else {
                        let alvosEmpate = alvosValidos.filter(alvo => m.ataque === (alvo.modo === "ataque" ? alvo.ataque : alvo.defesa));
                        if (alvosEmpate.length > 0 && (m.ataque < 1500 || vidaOponente > 3000)) {
                            resolverCombate(idx, alvosEmpate[0].originalIdx, false);
                        }
                    }
                }
            }
        });

        setTimeout(() => {
            // --- 4. FIM DO TURNO ---
            turnoAtual = "VOCÊ"; 
            jaComprouCarta = false; jaInvocouMonstro = false;
            monstrosJogador.forEach(m => { if(m) { m.jaAtacou = false; m.acabouDeSerInvocado = false; m.mudouPosicaoNesteTurno = false; } });
            document.getElementById("turnoAviso").innerText = "TURNO: VOCÊ";
            atualizarTela();
            verificarFimJogo();
        }, 1000);
    }, 1000);
}