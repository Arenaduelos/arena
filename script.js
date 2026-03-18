/* === VARIÁVEIS DE ESTADO === */
let vidaJogador = 5000, vidaOponente = 5000;
let turnoAtual = "";
let jaInvocouMonstro = false;
let jaComprouCarta = false;     
let totalTurnosPartida = 0; // Contador de turnos global  

// Variáveis para Melhor de 3
let vitoriasRodadaJogador = 0;
let vitoriasRodadaOponente = 0;
let rodadaAtual = 1;
let fimDeRodadaProcessando = false;

const usuario = localStorage.getItem("usuarioLogado") || "Duelista";
let nivelAtual = parseInt(localStorage.getItem(`nivel_${usuario}`)) || 1;

const monstrosPorNivel = {
    1:  { nome: "Planta",    pasta: "plantas",    imgPrefix: "planta",    atk: 500,  def: 400 },
    2:  { nome: "Inseto",    pasta: "insetos",    imgPrefix: "inseto",    atk: 600,  def: 650 },
    3:  { nome: "Guerreiro", pasta: "guerreiros", imgPrefix: "guerreiro", atk: 1050, def: 860 },
    4:  { nome: "Orc",       pasta: "orcs",       imgPrefix: "orc",       atk: 1200, def: 950 },
    5:  { nome: "Troll",     pasta: "trolls",     imgPrefix: "troll",     atk: 1700, def: 1010 },
    6:  { nome: "Ogro",      pasta: "ogros",      imgPrefix: "ogro",      atk: 2200, def: 1500 },
    7:  { nome: "Fada",      pasta: "fadas",      imgPrefix: "fada",      atk: 2700, def: 1750 },
    8:  { nome: "Dragão",    pasta: "dragoes",    imgPrefix: "dragao",    atk: 3200, def: 2000 },
    9:  { nome: "Mago",      pasta: "magos",      imgPrefix: "mago",      atk: 3800, def: 2700 },
    10: { nome: "Ceifeiro",  pasta: "mortes",     imgPrefix: "morte",     atk: 4300, def: 3100 }
};

// --- FUNÇÃO AUXILIAR PARA SONS ---
function tocarSom(caminho) {
    // Corrige caminhos que possam estar vindo com diretório duplicado ou errado
    let caminhoLimpo = caminho.replace("efeitosonoros/efeitosonoros/", "efeitosonoros/");
    caminhoLimpo = caminhoLimpo.replace("sons/", "efeitosonoros/");
    
    // Mapeamento de sons que mudaram de nome ou precisam de correção
    const mapaSons = {
        "efeitosonoros/trocal.ogg": "efeitosonoros/trocal.ogg", // já está correto se existir
        "efeitosonoros/trcal.ogg": "efeitosonoros/trocal.ogg",
        "efeitosonoros/inserircarta.ogg": "efeitosonoros/carta.ogg",
        "efeitosonoros/porcarta.ogg": "efeitosonoros/carta.ogg"
    };

    if (mapaSons[caminhoLimpo]) {
        caminhoLimpo = mapaSons[caminhoLimpo];
    }

    const audio = new Audio(caminhoLimpo);
    audio.play().catch(e => console.log("Erro ao tocar som:", e, "Caminho:", caminhoLimpo));
}

// --- FUNÇÃO PARA ANIMAR CONTAGEM DE HP ---
function animarContagemHP(id, inicio, fim, duracao) {
    const obj = document.getElementById(id);
    if (!obj) return;
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duracao, 1);
        const valorAtual = Math.floor(progress * (fim - inicio) + inicio);
        obj.innerText = valorAtual;
        if (progress < 1) {
            window.requestAnimationFrame(step);
        } else {
            obj.innerText = fim;
        }
    };
    window.requestAnimationFrame(step);
}

// --- FUNÇÃO PARA EXIBIR EFEITO DE DANO/CURA ---
function mostrarEfeitoPontos(alvo, valor) {
    const elId = alvo === "jogador" ? "vidaJogador" : "vidaOponente";
    const el = document.getElementById(elId);
    if (!el) return;
    
    const rect = el.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top;
    
    const div = document.createElement("div");
    div.className = `floating-number ${valor < 0 ? 'dano' : 'cura'}`;
    div.innerText = (valor > 0 ? "+" : "") + valor;
    div.style.left = x + "px";
    div.style.top = y + "px";
    
    document.body.appendChild(div);
    setTimeout(() => div.remove(), 1500);
}

// --- FUNÇÕES PARA ATUALIZAR VIDA COM SOM ---
function alterarVida(alvo, novoValor) {
    const antigoValor = alvo === "jogador" ? vidaJogador : vidaOponente;
    if (antigoValor !== novoValor) {
        const diferenca = novoValor - antigoValor;
        
        // Primeiro mostra o efeito visual (números flutuantes)
        mostrarEfeitoPontos(alvo, diferenca);
        
        // Delay maior para o jogador ver os pontos antes de mudar o valor e tocar o som
        setTimeout(() => {
            if (alvo === "jogador") vidaJogador = Math.max(0, novoValor);
            else vidaOponente = Math.max(0, novoValor);
            
            // Toca o som APÓS o efeito visual de pontos flutuantes
            tocarSom("efeitosonoros/prpontos.ogg");
            atualizarTela();
            verificarFimJogo();
        }, 800);
    }
}

// --- SOM DE HOVER GLOBAL ---
function configurarHoverSons() {
    document.body.addEventListener("mouseover", (e) => {
        const target = e.target.closest(".slot, .carta-img, .carta-deck, .slot-deck-vazio, .slot-deck-vazio.preenchido, .item-loja, .carta-bau");
        if (target) {
            tocarSom("efeitosonoros/carta.ogg");
        }
    });
}
configurarHoverSons();
atualizarPlacarMelhorDe3();

// --- FUNÇÃO PARA ANIMAÇÃO DE ATAQUE ---
function animarAtaque(idxAtacante, idxAlvo, atacanteEhJogador, callback) {
    const atacanteId = atacanteEhJogador ? "monstrosJogador" : "monstrosOponente";
    const alvoId = atacanteEhJogador ? "monstrosOponente" : "monstrosJogador";
    
    const containerAtacante = document.getElementById(atacanteId);
    const containerAlvo = document.getElementById(alvoId);
    
    // Se for ataque direto (alvo null ou undefined)
    if (idxAlvo === null || idxAlvo === undefined) {
        const slotAtacante = containerAtacante.children[idxAtacante];
        if (!slotAtacante) return callback();
        
        slotAtacante.style.transition = "transform 0.3s ease-in-out";
        slotAtacante.style.zIndex = "10000";
        // Avança um pouco para frente
        const direcao = atacanteEhJogador ? -50 : 50;
        slotAtacante.style.transform = `translateY(${direcao}px) scale(1.1)`;
        
        setTimeout(() => {
            slotAtacante.style.transform = "translateY(0)";
            setTimeout(() => {
                slotAtacante.style.transition = "";
                slotAtacante.style.zIndex = "";
                callback();
            }, 300);
        }, 300);
        return;
    }

    if (!containerAtacante || !containerAlvo) return callback();

    const slotAtacante = containerAtacante.children[idxAtacante];
    const slotAlvo = containerAlvo.children[idxAlvo];

    if (!slotAtacante || !slotAlvo) return callback();

    const rectAtacante = slotAtacante.getBoundingClientRect();
    const rectAlvo = slotAlvo.getBoundingClientRect();

    const distX = rectAlvo.left - rectAtacante.left;
    const distY = rectAlvo.top - rectAtacante.top;

    slotAtacante.style.transition = "transform 0.4s ease-in-out";
    slotAtacante.style.zIndex = "10000";
    slotAtacante.style.transform = `translate(${distX}px, ${distY}px) scale(1.2)`;

    setTimeout(() => {
        // Impacto no alvo
        slotAlvo.style.transition = "transform 0.1s";
        slotAlvo.style.transform = "scale(0.8)";
        
        setTimeout(() => {
            slotAlvo.style.transform = "scale(1)";
            // Retorno do atacante
            slotAtacante.style.transform = "translate(0, 0)";
            setTimeout(() => {
                slotAtacante.style.transition = "";
                slotAtacante.style.zIndex = "";
                callback();
            }, 300);
        }, 100);
    }, 400);
}

let monstrosJogador = [null, null, null], especiaisJogador = [null, null, null];
let monstrosOponente = [null, null, null], especiaisOponente = [null, null, null];
let cemiterioJogador = [], cemiterioOponente = [];

// --- AJUSTE: Carrega o Deck de 24 cartas do mdeck.html ---
let meuDeck = JSON.parse(localStorage.getItem(`deck_build_${usuario}`)) || [];
let deckOponente = []; 
let minhaMao = [], maoOponente = [];

/* === SISTEMA DE PRÊMIO E ROLETA DE SACRIFÍCIO === */
function concederPremios() {
    let moedasAtuais = parseInt(localStorage.getItem(`moedas_${usuario}`)) || 0;
    let vitoriasAtuais = parseInt(localStorage.getItem(`vitorias_${usuario}`)) || 0;
    
    // Cada rodada vencida no Melhor de 3 dá uma estrela
    // Se o jogador ganhou o melhor de 3, ele obrigatoriamente ganhou 2 rodadas.
    // Mas a lógica pede 1 estrela por rodada de batalha GANHA.
    // vitoriasRodadaJogador já contém quantas rodadas ele ganhou nesta partida (serão 2 se ele chegou aqui)
    
    let estrelasAtuais = parseInt(localStorage.getItem(`vits_no_nivel_${usuario}`)) || 0;
    estrelasAtuais += vitoriasRodadaJogador; // Ganha estrelas pelas rodadas vencidas

    // Lógica de Moedas baseada na quantidade de vitórias (cada vez que ganha diminui)
    let premioMoedas = 2000; // Padrão da 9ª vitória em diante
    const vitoriaNumero = vitoriasAtuais + 1; // Próxima vitória (a que estamos ganhando agora)

    if (vitoriaNumero === 1) premioMoedas = 300000;
    else if (vitoriaNumero === 2) premioMoedas = 200000;
    else if (vitoriaNumero === 3) premioMoedas = 100000;
    else if (vitoriaNumero === 4) premioMoedas = 50000;
    else if (vitoriaNumero === 5) premioMoedas = 35000;
    else if (vitoriaNumero === 6) premioMoedas = 25000;
    else if (vitoriaNumero === 7) premioMoedas = 13000;
    else if (vitoriaNumero === 8) premioMoedas = 5000;
    else if (vitoriaNumero >= 9) premioMoedas = 2000;

    moedasAtuais += premioMoedas;
    vitoriasAtuais += 1; // Vitória de partida (Melhor de 3)

    let subiuNivel = false;
    // SISTEMA DE SUBIDA DE NÍVEL (5 estrelas)
    if (estrelasAtuais >= 5) {
        nivelAtual += 1;
        estrelasAtuais = 0; // Recomeça a contar
        subiuNivel = true;
        localStorage.setItem(`nivel_${usuario}`, nivelAtual);
    }

    localStorage.setItem(`moedas_${usuario}`, moedasAtuais);
    localStorage.setItem(`vitorias_${usuario}`, vitoriasAtuais);
    localStorage.setItem(`vits_no_nivel_${usuario}`, estrelasAtuais);

    let msg = `Você ganhou <strong>${premioMoedas.toLocaleString('pt-BR')}</strong> moedas.`;
    if (subiuNivel) {
        msg += `<br><br><span style="color:gold; font-size:20px;">PARABÉNS!</span><br>Você subiu para o <strong>Nível ${nivelAtual}</strong>!`;
    } else {
        msg += `<br>Estrelas: ${estrelasAtuais}/5 para o próximo nível.`;
    }

    // Custom box para vitória
    const overlay = document.createElement("div");
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.85);display:flex;align-items:center;justify-content:center;z-index:10000;";
    const box = document.createElement("div");
    box.style = "background:#c2a679; border:4px solid #3d2b1f; padding:30px; border-radius:10px; text-align:center; max-width:400px; width:90%;";
    box.innerHTML = `
        <h2 style="margin-top:0; color:#3d2b1f;">VITÓRIA NO MELHOR DE 3!</h2>
        <p style="font-size:18px; color:#1a0f08;">${msg}</p>
        <button id="btnOkVitoria" style="padding:12px 25px; background:#3d2b1f; color:gold; border:none; border-radius:5px; font-family:'Cinzel', serif; font-weight:bold; cursor:pointer; margin-top:15px;">COLETAR PRÊMIOS</button>
    `;
    overlay.appendChild(box);
    document.body.appendChild(overlay);

    document.getElementById("btnOkVitoria").onclick = () => {
        document.body.removeChild(overlay);
        
        const falasVitoria = [
            "Impressionante... você realmente possui uma força incomum.",
            "Talvez eu tenha subestimado você. Reconheço sua vitória.",
            "Você provou seu valor na arena. Pegue suas recompensas."
        ];
        const fala = falasVitoria[Math.floor(Math.random() * falasVitoria.length)];
        
        mostrarNarrador(fala, () => {
            abrirRoletaSacrificio();
        });
    };
}

function abrirRoletaSacrificio() {
    const overlay = document.createElement("div");
    overlay.id = "overlayRoletaSacrificio";
    // overflow: hidden para evitar scroll horizontal durante a rotação
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.95);display:flex;align-items:center;justify-content:center;z-index:20000;color:gold;font-family:'Cinzel',serif;overflow:hidden;";
    
    const container = document.createElement("div");
    // Removido overflow-y:auto para evitar conflitos de scroll e centralizar melhor
    container.style = "background:#111;border:3px solid gold;padding:20px;border-radius:20px;text-align:center;max-width:95vw;position:relative;";
    
    container.innerHTML = `
        <h2 style="margin-top:0; font-size:1.5rem;">VITÓRIA!</h2>
        <p style="margin-bottom:15px; font-size:0.9rem;">Gire a roleta para um prêmio especial!</p>
        <div style="position:relative; width:320px; height:320px; margin:0 auto; display:flex; align-items:center; justify-content:center;">
            <!-- will-change e backface-visibility para evitar o tremor/shaking -->
            <canvas id="canvasSacrificio" width="320" height="320" style="border-radius:50%; transition: transform 5s cubic-bezier(0.15, 0, 0.15, 1); will-change: transform; backface-visibility: hidden;"></canvas>
            <div style="position:absolute; top:-15px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:15px solid transparent; border-right:15px solid transparent; border-top:30px solid #ff4500; z-index:100; filter: drop-shadow(0 0 5px #000);"></div>
        </div>
        <button id="btnGirarSacrificio" style="padding:12px 25px;font-size:1.1rem;background:gold;border:none;cursor:pointer;font-weight:bold;color:black;border-radius:5px; margin-top:20px; box-shadow: 0 0 10px gold;">GIRAR ROLETA</button>
    `;
    
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    const canvas = document.getElementById("canvasSacrificio");
    const ctx = canvas.getContext("2d");
    const radius = canvas.width / 2;
    const itens = [
        { nome: "NADA", prob: 10, cor: "#2C2C2C" },
        { nome: "NÍVEL 1", prob: 10, cor: "#4A4A4A" },
        { nome: "NÍVEL 2", prob: 10, cor: "#4A4A4A" },
        { nome: "NÍVEL 3", prob: 10, cor: "#4A4A4A" },
        { nome: "NÍVEL 4", prob: 10, cor: "#4A4A4A" },
        { nome: "NÍVEL 5", prob: 10, cor: "#4A4A4A" },
        { nome: "NÍVEL 6", prob: 10, cor: "#4A4A4A" },
        { nome: "NÍVEL 7", prob: 5, cor: "#B8860B" },
        { nome: "NÍVEL 8", prob: 5, cor: "#B8860B" },
        { nome: "NÍVEL 9", prob: 5, cor: "#B8860B" },
        { nome: "NÍVEL 10", prob: 5, cor: "#B8860B" },
        { nome: "SACRIFÍCIO 1-3", prob: 5, cor: "#DAA520" },
        { nome: "SACRIFÍCIO 4-5", prob: 5, cor: "#DAA520" }
    ];

    const imageCache = {};
    let imagesToLoad = itens.filter(i => i.img).length;
    let imagesLoaded = 0;

    function drawRoulette() {
        const totalProb = itens.reduce((a, b) => a + b.prob, 0);
        let currentAngle = -Math.PI / 2; // Começa no topo (ponteiro)

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        itens.forEach(item => {
            const sliceAngle = (item.prob / totalProb) * 2 * Math.PI;
            const endAngle = currentAngle + sliceAngle;
            const midAngle = currentAngle + sliceAngle / 2;

            // 1. Desenhar a fatia (slice)
            ctx.beginPath();
            ctx.fillStyle = item.cor;
            ctx.moveTo(radius, radius);
            ctx.arc(radius, radius, radius, currentAngle, endAngle);
            ctx.closePath();
            ctx.fill();

            // 2. Borda da fatia
            ctx.strokeStyle = 'rgba(255,215,0,0.5)';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 3. Conteúdo (Apenas Texto com Estilo Melhorado)
            ctx.save();
            ctx.translate(radius, radius);
            ctx.rotate(midAngle);
            
            ctx.textAlign = "right";
            ctx.fillStyle = "#FFF";
            // Fonte mais bonita e maior para o texto
            ctx.font = "bold 14px 'Cinzel', serif";
            ctx.shadowBlur = 5;
            ctx.shadowColor = "rgba(0,0,0,0.8)";
            
            // Exibe Nome e Nível
            let textoExibicao = item.nome;
            
            ctx.fillText(textoExibicao, radius - 25, 5);

            ctx.restore();
            currentAngle = endAngle;
        });
        
        // Círculo central decorativo maior e mais bonito
        ctx.beginPath();
        ctx.arc(radius, radius, 20, 0, 2 * Math.PI);
        const grad = ctx.createRadialGradient(radius, radius, 5, radius, radius, 20);
        grad.addColorStop(0, "gold");
        grad.addColorStop(1, "#8b4513");
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.strokeStyle = "gold";
        ctx.lineWidth = 2;
        ctx.stroke();
    }

    function allImagesLoaded() {
        imagesLoaded++;
        if (imagesLoaded === imagesToLoad) drawRoulette();
    }

    itens.forEach(item => {
        if (item.img) {
            imageCache[item.img] = new Image();
            imageCache[item.img].onload = allImagesLoaded;
            imageCache[item.img].onerror = allImagesLoaded;
            imageCache[item.img].src = item.img;
        }
    });

    if (imagesToLoad === 0) drawRoulette();

    document.getElementById("btnGirarSacrificio").onclick = function() {
        this.disabled = true;
        this.style.opacity = "0.5";
        
        // Som de roleta girando
        tocarSom("efeitosonoros/roleta.ogg");

        const totalPeso = itens.reduce((acc, curr) => acc + curr.prob, 0);
        let sorteio = Math.random() * totalPeso;
        let itemGanhado = null;
        let anguloAcumulado = 0;

        for (let i = 0; i < itens.length; i++) {
            const sliceDeg = (itens[i].prob / totalPeso) * 360;
            if (sorteio < itens[i].prob) {
                itemGanhado = itens[i];
                // Ângulo para parar no ponteiro (topo)
                // O meio da fatia sorteada deve ficar em -90 graus (topo)
                const anguloMeioFatia = anguloAcumulado + sliceDeg / 2;
                const anguloParaPonteiro = 360 - anguloMeioFatia;
                const voltasExtras = 360 * 6; // 6 voltas completas
                
                canvas.style.transform = `rotate(${voltasExtras + anguloParaPonteiro}deg)`;
                break;
            }
            sorteio -= itens[i].prob;
            anguloAcumulado += sliceDeg;
        }

        setTimeout(() => {
            if (itemGanhado.nome === "GIRAR NOVAMENTE") {
                this.disabled = false;
                this.style.opacity = "1";
                alert("Você ganhou outra chance! Gire novamente!");
                // Reset sem animação para girar de novo
                canvas.style.transition = 'none';
                canvas.style.transform = `rotate(0deg)`;
                setTimeout(() => { 
                    canvas.style.transition = 'transform 5s cubic-bezier(0.15, 0, 0.15, 1)';
                    drawRoulette(); 
                }, 50);
                return;
            }
            overlay.remove();
            sortearCartaRecompensa(itemGanhado);
        }, 5600);
    };
}

function sortearCartaRecompensa(itemGanhado) {
    let cartaFinal = null;

    if (itemGanhado.nome === "NADA") {
        cartaFinal = null;
    } else if (itemGanhado.nome.startsWith("NÍVEL")) {
        const nivel = parseInt(itemGanhado.nome.split(" ")[1]);
        const mInfo = monstrosPorNivel[nivel];
        const imgNum = Math.floor(Math.random() * 5) + 1;
        cartaFinal = {
            nome: `${mInfo.nome} ${imgNum}`,
            img: `imagens/${mInfo.pasta}/${mInfo.imgPrefix}${imgNum}.jpg`,
            atk: mInfo.atk,
            def: mInfo.def
        };
    } else if (itemGanhado.nome === "SACRIFÍCIO 1-3") {
        const num = Math.floor(Math.random() * 3) + 1;
        const stats = {
            1: { atk: 5000, def: 4500 },
            2: { atk: 5100, def: 4600 },
            3: { atk: 5200, def: 4700 }
        };
        cartaFinal = {
            nome: `Sacrifício ${num}`,
            img: `imagens/sacrificios/sacrificio${num}.jpg`,
            atk: stats[num].atk,
            def: stats[num].def
        };
    } else if (itemGanhado.nome === "SACRIFÍCIO 4-5") {
        const num = Math.floor(Math.random() * 2) + 4;
        const stats = {
            4: { atk: 5300, def: 4800 },
            5: { atk: 5400, def: 4900 }
        };
        cartaFinal = {
            nome: `Sacrifício ${num}`,
            img: `imagens/sacrificios/sacrificio${num}.jpg`,
            atk: stats[num].atk,
            def: stats[num].def
        };
    }

    exibirBoxResultado(cartaFinal);
}

function exibirBoxResultado(carta) {
    const overlay = document.createElement("div");
    overlay.style = "position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.98);display:flex;align-items:center;justify-content:center;z-index:30000;color:white;font-family:'Cinzel',serif; padding:15px;";
    
    let contentHTML = "";
    if (!carta) {
        contentHTML = `
            <div class="reward-column">
                <div class="reward-title">RESULTADO</div>
                <div class="card-placeholder">NENHUM PRÊMIO</div>
            </div>
        `;
    } else {
        contentHTML = `
            <div class="reward-column">
                <div class="reward-title">PRÊMIO GANHO</div>
                <div class="card-container">
                    <div class="card-inner">
                        <div class="card-front">
                            <img src="${carta.img}" alt="${carta.nome}">
                        </div>
                        <div class="card-back">
                            <img src="imagens/back.jpg" alt="Verso da Carta">
                        </div>
                    </div>
                </div>
                <div class="card-name">${carta.nome}</div>
                <div style="color: gold; margin-top: 5px;">ATK: ${carta.atk} / DEF: ${carta.def}</div>
            </div>
        `;
    }

    const box = document.createElement("div");
    box.style = "background:linear-gradient(45deg, #1a1a1a, #2c2c2c); border:2px solid gold; border-radius:15px; text-align:center; width:100%; max-width:500px; padding:20px; box-shadow: 0 0 30px rgba(255,215,0,0.5);";
    box.innerHTML = `
        <style>
            .reward-column { display: flex; flex-direction: column; align-items: center; }
            .reward-title { font-size: 1.2rem; color: gold; margin-bottom: 15px; text-transform: uppercase; }
            .card-container { perspective: 1000px; width: 160px; height: 230px; }
            .card-inner { position: relative; width: 100%; height: 100%; transition: transform 0.8s; transform-style: preserve-3d; animation: flipIn 1.5s ease-out; }
            .card-front, .card-back { position: absolute; width: 100%; height: 100%; backface-visibility: hidden; border-radius: 10px; overflow: hidden; border: 2px solid #DAA520; }
            .card-front { background: #000; }
            .card-back { transform: rotateY(180deg); }
            .card-container img { width: 100%; height: 100%; object-fit: cover; }
            .card-name { margin-top: 15px; font-size: 1rem; font-weight: bold; color: #fff; }
            .card-placeholder { width: 160px; height: 230px; border: 2px dashed #555; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #777; font-size: 0.9rem; }
            @keyframes flipIn { from { transform: rotateY(180deg); } to { transform: rotateY(0); } }
            .main-title { font-size: 2rem; color: gold; margin-bottom: 20px; text-shadow: 0 0 10px gold; }
            .action-button { padding: 12px 25px; background: gold; border: none; cursor: pointer; font-weight: bold; margin-top: 20px; border-radius: 8px; font-size: 1rem; color: #111; transition: all 0.3s; }
            .action-button:hover { background: #fff; color: #000; box-shadow: 0 0 15px #fff; }
        </style>
        <div class="main-title">RECOMPENSAS DA VITÓRIA</div>
        <div style="display: flex; justify-content: center; margin: 20px 0;">
            ${contentHTML}
        </div>
        <button class="action-button" onclick="window.location.href='mdeck.html'">VER MEU DECK</button>
    `;

    overlay.appendChild(box);
    document.body.appendChild(overlay);

    if (carta) {
        adicionarAoBau({
            nome: carta.nome,
            imagem: carta.img,
            ataque: carta.atk,
            defesa: carta.def
        });
    }
}

function adicionarAoBau(c) {
    let inv = JSON.parse(localStorage.getItem(`deck_inventory_${usuario}`)) || [];
    inv.push({
        nome: c.nome || c.n,
        imagem: c.img || c.imagem,
        tipo: "monstro",
        ataque: c.atk || c.ataque || 0,
        defesa: c.def || c.defesa || 0,
        sacrifio: c.sacrifio || (c.nome && c.nome.includes("Sacrifício") ? 2 : 0)
    });
    localStorage.setItem(`deck_inventory_${usuario}`, JSON.stringify(inv));
}

/* === LÓGICA DE COMPRA E ROLETA === */
function comprarCarta(alvo = "jogador") {
    if (alvo === "jogador") {
        if (turnoAtual !== "VOCÊ") return;
        if (jaComprouCarta) return alert("Você já comprou uma carta neste turno!");
        
        let novaCarta = null;

        // --- LÓGICA DE COMPRA DE CARTAS ESPECIAIS POR NÍVEL (70% de chance) ---
        const rEspecial = Math.random() * 100;
        if (rEspecial <= 70) {
            if (nivelAtual >= 1 && nivelAtual <= 3) {
                const pool = [
                    { nome: "PowerUp", imagem: "imagens/especiais/powerup.jpg", tipo: "especial" },
                    { nome: "PowerDown", imagem: "imagens/especiais/powerdown.jpg", tipo: "especial" },
                    { nome: "Vida", imagem: "imagens/especiais/vida.jpg", tipo: "especial" }
                ];
                novaCarta = pool[Math.floor(Math.random() * pool.length)];
            } else if (nivelAtual >= 4 && nivelAtual <= 7) {
                const pool = [
                    { nome: "Bloqueio", imagem: "imagens/especiais/bloqueio.jpg", tipo: "especial" },
                    { nome: "Chamado", imagem: "imagens/especiais/chamado.jpg", tipo: "especial" },
                    { nome: "Despertar", imagem: "imagens/especiais/despertar.jpg", tipo: "especial" }
                ];
                novaCarta = pool[Math.floor(Math.random() * pool.length)];
            } else if (nivelAtual >= 8 && nivelAtual <= 10) { // Corrigido range para 8-10
                const pool = [
                    { nome: "Fusão", imagem: "imagens/especiais/fusao.jpg", tipo: "especial" },
                    { nome: "Trocal", imagem: "imagens/especiais/trocal.jpg", tipo: "especial" }
                ];
                novaCarta = pool[Math.floor(Math.random() * pool.length)];
            }
        }

        // Se não sorteou especial ou não está no range, compra do deck normal
        if (!novaCarta && meuDeck.length > 0) {
            novaCarta = meuDeck.pop();
        }

        if (novaCarta) {
            jaComprouCarta = true;
            tocarSom("efeitosonoros/click.ogg");
            tocarSom("efeitosonoros/comprar.ogg");
            
            // Efeito visual de compra
            const btnDeck = document.getElementById("btnComprar");
            if (btnDeck) {
                btnDeck.style.transform = "scale(1.1) translateY(-10px)";
                setTimeout(() => btnDeck.style.transform = "", 300);
            }

            if (minhaMao.length >= 5) escolherDescarte(novaCarta);
            else { minhaMao.push(novaCarta); logBatalha(`Você comprou: ${novaCarta.nome}`, "info"); }
        } else {
            logBatalha("Seu deck acabou!", "morte");
        }
    } else {
        if (deckOponente.length > 0) {
            let nc = deckOponente.pop();
            if (maoOponente.length >= 5) cemiterioOponente.push(maoOponente.shift()); 
            maoOponente.push(nc);
        }
    }
    atualizarTela();
}

function escolherDescarte(novaCarta) {
    const ops = minhaMao.map(c => c.nome);
    ops.push("DESCARTAR NOVA: " + novaCarta.nome);
    mostrarSelecao("MÃO CHEIA", ops, (sel) => {
        if (sel < minhaMao.length) {
            cemiterioJogador.push(minhaMao[sel]);
            minhaMao[sel] = novaCarta;
        } else {
            cemiterioJogador.push(novaCarta);
        }
        atualizarTela();
    });
}

function girarRoleta() {
    const btn = document.getElementById("btnGirar");
    const r = document.getElementById("roleta");
    const modal = document.getElementById("modalRoleta");

    if (btn) {
        btn.disabled = true;
        btn.innerText = "SORTEANDO...";
    }

    try {
        // --- 1. RESET E GIRO VISUAL ---
        if (r) {
            r.style.transition = "none";
            r.style.transform = "rotate(0deg)";
            void r.offsetWidth; // Força reset visual
            
            setTimeout(() => {
                const sortei = Math.random() > 0.5 ? "VOCÊ" : "MÁQUINA";
                const graus = sortei === "VOCÊ" ? 1800 : 1980;
                
                r.style.transition = "transform 3s cubic-bezier(0.1, 0, 0.2, 1)";
                r.style.transform = `rotate(${graus}deg)`;
                
                // Toca sons sem bloquear
                tocarSom("efeitosonoros/roleta.ogg");
                new Audio("efeitosonoros/abertura.ogg").play();
                // Inicia a lógica da arena após o giro
                setTimeout(() => iniciarPartidaAposGiro(sortei), 3200);
            }, 50);
        } else {
            // Se a roleta não existir, inicia direto (segurança)
            iniciarPartidaAposGiro(Math.random() > 0.5 ? "VOCÊ" : "MÁQUINA");
        }
    } catch (err) {
        console.error("Erro crítico na roleta:", err);
        iniciarPartidaAposGiro("VOCÊ"); // Força início em caso de erro
    }
}

function iniciarPartidaAposGiro(sortei) {
    const modal = document.getElementById("modalRoleta");
    const btn = document.getElementById("btnGirar");

    try {
        turnoAtual = sortei;
        tocarSom("efeitosonoros/entrarena.ogg");

        // --- 2. PREPARAÇÃO DE DADOS (DENTRO DE TRY-CATCH) ---
        let deckBase = [];
        try {
            const storedDeck = localStorage.getItem(`deck_build_${usuario}`);
            deckBase = storedDeck ? JSON.parse(storedDeck) : [];
        } catch(e) { deckBase = []; }

        if (!Array.isArray(deckBase)) deckBase = [];
        
        meuDeck = deckBase.map(c => {
            if (c && typeof c === 'object' && Math.random() <= 0.10) {
                return { nome: "Equipar", imagem: "imagens/especiais/equipar.jpg", tipo: "especial" };
            }
            return c;
        }).filter(Boolean);

        // Deck Máquina
        let mInfo = (monstrosPorNivel && monstrosPorNivel[nivelAtual]) || { nome: "Guerreiro", pasta: "guerreiros", imgPrefix: "guerreiro", atk: 1000, def: 800 };
        deckOponente = [];
        for (let i = 0; i < 21; i++) {
            let imgNum = Math.floor(Math.random() * 5) + 1;
            deckOponente.push({ 
                nome: `${mInfo.nome} ${imgNum}`, 
                imagem: `imagens/${mInfo.pasta}/${mInfo.imgPrefix}${imgNum}.jpg`, 
                tipo: "monstro", ataque: mInfo.atk, defesa: mInfo.def 
            });
        }
        const esps = ["vida", "powerup", "powerdown", "bloqueio", "chamado", "trocal", "equipar"];
        esps.forEach(e => deckOponente.push({ nome: e.toUpperCase(), imagem: `imagens/especiais/${e}.jpg`, tipo: "especial" }));
        
        deckOponente.sort(() => Math.random() - 0.5);
        meuDeck.sort(() => Math.random() - 0.5);

        // --- 3. DISTRIBUIÇÃO INICIAL DE CARTAS (ANTES DA ANIMAÇÃO) ---
        minhaMao = []; maoOponente = [];
        for (let i = 0; i < 3; i++) {
            if (meuDeck && meuDeck.length > 0) minhaMao.push(meuDeck.pop());
            if (deckOponente && deckOponente.length > 0) maoOponente.push(deckOponente.pop());
        }

        // --- 4. ANIMAÇÃO DE ENTRADA ---
        vidaJogador = 0; vidaOponente = 0;
        atualizarTela();
        
        animarContagemHP("vidaJogador", 0, 5000, 1500);
        animarContagemHP("vidaOponente", 0, 5000, 1500);
        
        vidaJogador = 5000; vidaOponente = 5000;

        // --- 5. LIBERAÇÃO DO JOGO ---
        setTimeout(() => {
            if (modal) modal.style.display = "none";
            const btnPassar = document.getElementById("btnPassarTurno");
            if (btnPassar) btnPassar.style.display = "block";
            
            const aviso = document.getElementById("turnoAviso");
            if (aviso) aviso.innerText = "TURNO: " + turnoAtual;
            
            if (btn) {
                btn.disabled = false;
                btn.innerText = "GIRAR";
            }

            atualizarTela();
            if (turnoAtual === "MÁQUINA") setTimeout(turnoDaMaquina, 1000);
        }, 1800);

    } catch (err) {
        console.error("Erro ao iniciar partida:", err);
        if (modal) modal.style.display = "none";
        atualizarTela();
    }
}

/* === LÓGICA DE COMBATE === */
function acaoMonstro(idx) {
    if (turnoAtual !== "VOCÊ") return;
    let m = monstrosJogador[idx];
    if (!m) return;
    let acoes = [];
    // Regra: Não pode atacar se for o primeiríssimo turno da partida (quem começou)
    const podeAtacarTurno = totalTurnosPartida > 0;
    if (m.modo === "ataque" && !m.jaAtacou && !m.bloqueado && podeAtacarTurno) acoes.push("ATACAR");
    if (!m.jaAtacou && !m.acabouDeSerInvocado) {
        acoes.push(m.modo === "ataque" ? "MUDAR PARA DEFESA" : "MUDAR PARA ATAQUE");
    }
    if (acoes.length === 0) return;
    mostrarSelecao(m.nome.toUpperCase(), acoes, (sel) => {
        if (acoes[sel] === "ATACAR") prepararAtaque(idx);
        else {
            m.modo = (m.modo === "ataque" ? "defesa" : "ataque");
            m.revelada = (m.modo === "ataque");
            m.mudouPosicaoNesteTurno = true; // pode atacar após mudar para ATK
            atualizarTela();
        }
    });
}

function prepararAtaque(idx) {
    let meu = monstrosJogador[idx];
    let alvos = monstrosOponente.map((m, i) => m ? {i, label: m.revelada ? m.nome : `MONSTRO OCULTO (${i+1})`} : null).filter(Boolean);
    if (alvos.length === 0) {
        if (confirm("Atacar diretamente?")) {
            tocarSom("efeitosonoros/ataque.ogg"); // Toca logo que clica no alvo/confirm
            animarAtaque(idx, null, true, () => {
                alterarVida("oponente", vidaOponente - meu.ataque);
                meu.jaAtacou = true;
                logBatalha(`Ataque direto! -${meu.ataque} LP`, "dano");
                verificarFimJogo();
            });
        }
    } else {
        mostrarSelecao("ALVO", alvos.map(a => a.label), (s) => {
            tocarSom("efeitosonoros/ataque.ogg"); // Toca logo que escolhe o monstro a ser atacado
            animarAtaque(idx, alvos[s].i, true, () => {
                resolverCombate(idx, alvos[s].i, true);
            });
        });
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
        
        // --- REMOVER BLOQUEIO SE O ALVO FOR DESTRUÍDO ---
        if (defensor.bloqueado) {
            const listaEspeciais = atacanteEhJogador ? especiaisJogador : especiaisOponente;
            const cemiterioDestino = atacanteEhJogador ? cemiterioJogador : cemiterioOponente;
            
            const idxEsp = listaEspeciais.findIndex(e => e && e.vinculo === oIdx && e.imagem.includes("bloqueio.jpg"));
            if (idxEsp !== -1) {
                cemiterioDestino.push(listaEspeciais[idxEsp]);
                listaEspeciais[idxEsp] = null;
                logBatalha("Efeito de Bloqueio encerrado pois o alvo foi destruído.", "info");
            }
        }

        if (defensor.modo === "ataque") {
            if (atacanteEhJogador) {
                alterarVida("oponente", vidaOponente - dif);
            } else {
                alterarVida("jogador", vidaJogador - dif);
            }
        }
        if (atacanteEhJogador) { cemiterioOponente.push(defensor); monstrosOponente[oIdx] = null; }
        else { cemiterioJogador.push(defensor); monstrosJogador[oIdx] = null; }
    } else if (dif < 0) {
        let danoRef = Math.abs(dif);
        if (atacanteEhJogador) {
            alterarVida("jogador", vidaJogador - danoRef);
        } else {
            alterarVida("oponente", vidaOponente - danoRef);
        }
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

async function turnoDaMaquina() {
    logBatalha("Turno da Máquina...", "info");
    await new Promise(r => setTimeout(r, 1500)); // Delay inicial do turno
    
    comprarCarta("oponente");
    totalTurnosPartida++; 
    await new Promise(r => setTimeout(r, 1200)); // Delay após compra
    
    // --- 1. USO DE CARTAS ESPECIAIS DA MÃO (COM DELAY E FEEDBACK VISUAL) ---
    let especiaisMao = maoOponente.filter(c => c.tipo === "especial");
    for (const esp of especiaisMao) {
        const img = esp.imagem.toLowerCase();
        let usou = false;
        let msgIA = "";
        let acaoIA = null;

        if (img.includes("vida.jpg") && vidaOponente < 4000) {
            msgIA = "Máquina usa Vida e recupera 500 LP!";
            acaoIA = () => {
                tocarSom("efeitosonoros/vida.ogg");
                alterarVida("oponente", vidaOponente + 500);
            };
            usou = true;
        } else if (img.includes("powerup.jpg")) {
            let alvos = monstrosOponente.filter(m => m !== null);
            if (alvos.length > 0) {
                let alvo = alvos.sort((a,b) => b.ataque - a.ataque)[0];
                msgIA = `Máquina usa PowerUp em ${alvo.nome}!`;
                acaoIA = () => {
                    tocarSom("efeitosonoros/powerup.ogg");
                    alvo.ataque += 300; alvo.defesa += 300;
                };
                usou = true;
            }
        } else if (img.includes("powerdown.jpg")) {
            let alvosJ = monstrosJogador.filter(m => m !== null);
            if (alvosJ.length > 0) {
                let alvo = alvosJ.sort((a,b) => b.ataque - a.ataque)[0];
                msgIA = `Máquina usa PowerDown em ${alvo.nome}!`;
                acaoIA = () => {
                    tocarSom("efeitosonoros/powerdown.ogg");
                    alvo.ataque = Math.max(0, alvo.ataque - 300);
                    alvo.defesa = Math.max(0, alvo.defesa - 300);
                };
                usou = true;
            }
        } else if (img.includes("bloqueio.jpg")) {
            let alvosJ = monstrosJogador.filter(m => m !== null && !m.bloqueado);
            let slotEsp = especiaisOponente.findIndex(s => s === null);
            if (alvosJ.length > 0 && slotEsp !== -1) {
                let alvo = alvosJ.sort((a,b) => b.ataque - a.ataque)[0];
                let alvoIdx = monstrosJogador.indexOf(alvo);
                msgIA = `Máquina bloqueia ${alvo.nome}!`;
                acaoIA = () => {
                    alvo.bloqueado = true;
                    alvo.turnosBloqueio = 3;
                    especiaisOponente[slotEsp] = { ...esp, revelada: true, vinculo: alvoIdx, turnosRestantes: 3 };
                };
                usou = true;
            }
        } else if (img.includes("chamado.jpg")) {
            let alvosJ = monstrosJogador.filter(m => m !== null);
            if (alvosJ.length > 0) {
                let alvo = alvosJ.sort((a,b) => b.ataque - a.ataque)[0];
                let alvoIdx = monstrosJogador.indexOf(alvo);
                msgIA = `Máquina usa Chamado e destrói ${alvo.nome}!`;
                acaoIA = () => {
                    if (alvo.bloqueado) {
                        const idxEsp = especiaisOponente.findIndex(e => e && e.vinculo === alvoIdx && e.imagem.includes("bloqueio.jpg"));
                        if (idxEsp !== -1) { cemiterioOponente.push(especiaisOponente[idxEsp]); especiaisOponente[idxEsp] = null; }
                    }
                    cemiterioJogador.push(alvo);
                    monstrosJogador[alvoIdx] = null;
                };
                usou = true;
            }
        } else if (img.includes("trocal.jpg")) {
            let alvosJ = monstrosJogador.filter(m => m !== null);
            let slotLivre = monstrosOponente.findIndex(s => s === null);
            if (alvosJ.length > 0 && slotLivre !== -1) {
                let alvo = alvosJ.sort((a,b) => b.ataque - a.ataque)[0];
                let alvoIdx = monstrosJogador.indexOf(alvo);
                msgIA = `Máquina usa Trocal e rouba seu ${alvo.nome}!`;
                acaoIA = () => {
                    tocarSom("efeitosonoros/trocal.ogg");
                    if (alvo.bloqueado) {
                        const idxEsp = especiaisOponente.findIndex(e => e && e.vinculo === alvoIdx && e.imagem.includes("bloqueio.jpg"));
                        if (idxEsp !== -1) { cemiterioOponente.push(especiaisOponente[idxEsp]); especiaisOponente[idxEsp] = null; }
                    }
                    monstrosOponente[slotLivre] = { ...alvo, roubado: true, turnosRoubo: 2, donoOriginal: "jogador", revelada: true, jaAtacou: false, bloqueado: false };
                    monstrosJogador[alvoIdx] = null;
                };
                usou = true;
            }
        } else if (img.includes("despertar.jpg")) {
            let monstrosCemiterio = cemiterioOponente.filter(c => c.tipo === "monstro");
            if (monstrosCemiterio.length > 0 && maoOponente.length < 5) {
                let m = monstrosCemiterio.sort((a,b) => b.ataque - a.ataque)[0];
                msgIA = `Máquina desperta ${m.nome} do cemitério!`;
                acaoIA = () => {
                    cemiterioOponente.splice(cemiterioOponente.indexOf(m), 1);
                    maoOponente.push(m);
                };
                usou = true;
            }
        } else if (img.includes("equipar.jpg")) {
            let alvos = monstrosOponente.filter(m => m !== null && !m.imagem.includes("robo"));
            if (alvos.length > 0) {
                const roboNivel = nivelAtual <= 5 ? nivelAtual : 5;
                const robos = [
                    { nome: "Robô A1", imagem: "imagens/robos/robo1.jpg", ataque: 2000, defesa: 1800 },
                    { nome: "Robô A2", imagem: "imagens/robos/robo2.jpg", ataque: 2200, defesa: 2000 },
                    { nome: "Robô A3", imagem: "imagens/robos/robo3.jpg", ataque: 2500, defesa: 2200 },
                    { nome: "Robô A4", imagem: "imagens/robos/robo4.jpg", ataque: 2800, defesa: 2500 },
                    { nome: "Robô A5", imagem: "imagens/robos/robo5.jpg", ataque: 3100, defesa: 2800 }
                ];
                const robo = robos[roboNivel - 1];
                let alvo = alvos.sort((a,b) => a.ataque - b.ataque)[0];
                if (alvo.ataque < robo.ataque) {
                    msgIA = `Máquina equipa seu ${alvo.nome} e agora é uma super máquina: ${robo.nome}!`;
                    acaoIA = () => {
                        tocarSom("efeitosonoros/equipar.ogg");
                        alvo.nome = robo.nome; alvo.imagem = robo.imagem;
                        alvo.ataque = robo.ataque; alvo.defesa = robo.defesa;
                    };
                    usou = true;
                }
            }
        } else if (img.includes("fusao.jpg")) {
            let monstrosCampo = monstrosOponente.filter(m => m !== null);
            let monstrosMao = maoOponente.filter(c => c.tipo === "monstro");
            if (monstrosCampo.length > 0 && monstrosMao.length > 0) {
                let mCampo = monstrosCampo.sort((a,b) => a.ataque - b.ataque)[0];
                let mMao = monstrosMao.sort((a,b) => a.ataque - b.ataque)[0];
                msgIA = "Máquina realiza uma Fusão!";
                acaoIA = () => {
                    tocarSom("efeitosonoros/fusao.ogg");
                    let mutante = nivelAtual <= 5 ? { nome: "Mutante 1", imagem: "imagens/mutantes/mutante1.jpg", ataque: 2500, defesa: 2000, tipo: "monstro" }
                                : nivelAtual <= 10 ? { nome: "Mutante 2", imagem: "imagens/mutantes/mutante2.jpg", ataque: 3000, defesa: 2500, tipo: "monstro" }
                                : { nome: "Mutante 3", imagem: "imagens/mutantes/mutante3.jpg", ataque: 3500, defesa: 2900, tipo: "monstro" };
                    cemiterioOponente.push(mCampo);
                    maoOponente.splice(maoOponente.indexOf(mMao), 1);
                    monstrosOponente[monstrosOponente.indexOf(mCampo)] = { ...mutante, modo: "ataque", revelada: true, jaAtacou: false, acabouDeSerInvocado: true, mudouPosicaoNesteTurno: false };
                };
                usou = true;
            }
        }

        if (usou) {
            await new Promise(r => setTimeout(r, 1200));
            await new Promise(resolve => {
                animarAtivacaoCarta(esp, () => {
                    logBatalha(msgIA, "info");
                    if (acaoIA) acaoIA();
                    if (!img.includes("bloqueio.jpg")) cemiterioOponente.push(esp);
                    maoOponente.splice(maoOponente.indexOf(esp), 1);
                    resolve();
                }, "MÁQUINA ATIVA:");
            });
            atualizarTela();
            await new Promise(r => setTimeout(r, 1000));
        }
    }

    // --- 2. INVOCAÇÃO DE MONSTROS ---
    let monstrosMao = maoOponente.filter(c => c.tipo === "monstro");
    if (monstrosMao.length > 0) {
        await new Promise(r => setTimeout(r, 1200)); // Delay antes de invocar
        
        // Tenta sacrifício primeiro
        let monSac = monstrosMao.filter(m => m.sacrifio > 0).sort((a,b) => b.ataque - a.ataque)[0];
        let monstrosNoCampo = monstrosOponente.filter(m => m !== null);
        
        if (monSac && monstrosNoCampo.length >= monSac.sacrifio) {
            let sacrificados = monstrosNoCampo.sort((a,b) => a.ataque - b.ataque).slice(0, monSac.sacrifio);
            sacrificados.forEach(s => {
                if (s.bloqueado) {
                    const idxEsp = especiaisJogador.findIndex(e => e && e.vinculo === monstrosOponente.indexOf(s) && e.imagem.includes("bloqueio.jpg"));
                    if (idxEsp !== -1) {
                        cemiterioJogador.push(especiaisJogador[idxEsp]);
                        especiaisJogador[idxEsp] = null;
                    }
                }
                cemiterioOponente.push(s);
                monstrosOponente[monstrosOponente.indexOf(s)] = null;
            });
            tocarSom("efeitosonoros/sacrificio.ogg");
            let slot = monstrosOponente.findIndex(s => s === null);
            monstrosOponente[slot] = { ...monSac, modo: "ataque", revelada: true, jaAtacou: false, acabouDeSerInvocado: true, mudouPosicaoNesteTurno: false };
            tocarSom("efeitosonoros/carta.ogg");
            maoOponente.splice(maoOponente.indexOf(monSac), 1);
            logBatalha(`Máquina invocou por Sacrifício: ${monSac.nome}!`, "info");
        } else {
            let monNorm = monstrosMao.filter(m => !m.sacrifio).sort((a,b) => b.ataque - a.ataque)[0];
            let slot = monstrosOponente.findIndex(s => s === null);
            if (monNorm && slot !== -1) {
                let modoIA = "defesa";
                const monstrosJogadorAtivos = monstrosJogador.filter(m => m !== null);
                const monstroMaisForteJogador = monstrosJogadorAtivos.length > 0 
                    ? monstrosJogadorAtivos.reduce((prev, current) => (prev.ataque > current.ataque) ? prev : current)
                    : null;
                if (!monstroMaisForteJogador || monNorm.ataque > (monstroMaisForteJogador.modo === 'ataque' ? monstroMaisForteJogador.ataque : monstroMaisForteJogador.defesa)) {
                    modoIA = "ataque";
                }
                monstrosOponente[slot] = { ...monNorm, modo: modoIA, revelada: (modoIA === "ataque"), jaAtacou: false, acabouDeSerInvocado: true, mudouPosicaoNesteTurno: false };
                tocarSom("efeitosonoros/carta.ogg");
                maoOponente.splice(maoOponente.indexOf(monNorm), 1);
                if (modoIA === "ataque") logBatalha(`Máquina invocou ${monNorm.nome} em Modo de Ataque!`, "info");
                else logBatalha(`Máquina invocou um monstro oculto em Modo de Defesa!`, "info");
            }
        }
        atualizarTela();
    }

    // --- 3. FASE DE BATALHA (SEQUENCIAL) ---
    await new Promise(r => setTimeout(r, 1500)); // Delay maior antes de começar a atacar
    
    // Antes de atacar, ajusta posições de quem já estava no campo
    monstrosOponente.forEach((m) => {
        if (m && !m.acabouDeSerInvocado && !m.bloqueado && !m.mudouPosicaoNesteTurno) {
            const monstrosJogadorAtivos = monstrosJogador.filter(mj => mj !== null);
            const podeVencerAlguem = monstrosJogadorAtivos.some(mj => m.ataque > (mj.modo === "ataque" ? mj.ataque : mj.defesa));
            
            if (m.modo === "defesa" && podeVencerAlguem) {
                m.modo = "ataque";
                m.revelada = true;
                m.mudouPosicaoNesteTurno = true;
            } else if (m.modo === "ataque" && !podeVencerAlguem && monstrosJogadorAtivos.length > 0) {
                m.modo = "defesa";
                m.mudouPosicaoNesteTurno = true;
            }
        }
    });

    let atacantesFinais = monstrosOponente.filter(m => m && m.modo === "ataque" && !m.jaAtacou && !m.bloqueado && !m.acabouDeSerInvocado && totalTurnosPartida > 0);
    
    async function processarAtaquesSequencialmente(lista) {
        for (const m of lista) {
            let idx = monstrosOponente.indexOf(m);
            let alvosValidos = monstrosJogador.map((mj, i) => mj ? { ...mj, originalIdx: i } : null).filter(v => v !== null);
            
            if (alvosValidos.length === 0) {
                tocarSom("efeitosonoros/ataque.ogg");
                await new Promise(resolve => {
                    animarAtaque(idx, null, false, () => {
                        alterarVida("jogador", vidaJogador - m.ataque);
                        logBatalha(`Máquina atacou direto com ${m.nome}! -${m.ataque} LP`, "dano");
                        m.jaAtacou = true;
                        resolve();
                    });
                });
            } else {
                let alvosVenciveis = alvosValidos.filter(alvo => m.ataque > (alvo.modo === "ataque" ? alvo.ataque : alvo.defesa));
                if (alvosVenciveis.length > 0) {
                    alvosVenciveis.sort((a,b) => (a.modo === "ataque" ? a.ataque : a.defesa) - (b.modo === "ataque" ? b.ataque : b.defesa));
                    const alvoEscolhido = alvosVenciveis[alvosVenciveis.length-1];
                    tocarSom("efeitosonoros/ataque.ogg");
                    await new Promise(resolve => {
                        animarAtaque(idx, alvoEscolhido.originalIdx, false, () => {
                            resolverCombate(idx, alvoEscolhido.originalIdx, false);
                            m.jaAtacou = true;
                            resolve();
                        });
                    });
                } else {
                    m.jaAtacou = true;
                }
            }
            await new Promise(r => setTimeout(r, 1000)); // Delay entre ataques aumentado para 1s
        }
        finalizarTurnoMaquina();
    }

    processarAtaquesSequencialmente(atacantesFinais);
}

function verificarFimJogo() {
    if (fimDeRodadaProcessando) return;

    if (vidaJogador <= 0) { 
        fimDeRodadaProcessando = true;
        vitoriasRodadaOponente++;
        atualizarPlacarMelhorDe3();
        
        setTimeout(() => {
            if (vitoriasRodadaOponente >= 2) {
                mostrarDerrota();
                resetarMelhorDe3();
            } else {
                proximaRodada("MÁQUINA");
            }
        }, 1000);
        return;
    }
    if (vidaOponente <= 0) { 
        fimDeRodadaProcessando = true;
        vitoriasRodadaJogador++;
        atualizarPlacarMelhorDe3();
        
        setTimeout(() => {
            if (vitoriasRodadaJogador >= 2) {
                concederPremios();
                resetarMelhorDe3();
            } else {
                proximaRodada("VOCÊ");
            }
        }, 1000);
    }
}

function atualizarPlacarMelhorDe3() {
    const el = document.getElementById("placarMelhorDe3");
    if (el) {
        const estrelas = parseInt(localStorage.getItem(`vits_no_nivel_${usuario}`)) || 0;
        let estrelasStr = "";
        for(let i=0; i<5; i++) {
            estrelasStr += i < estrelas ? "★" : "☆";
        }
        el.innerHTML = `NÍVEL ${nivelAtual} [${estrelasStr}]<br>RODADA ${rodadaAtual}: ${vitoriasRodadaJogador} - ${vitoriasRodadaOponente}`;
    }
}

function resetarMelhorDe3() {
    vitoriasRodadaJogador = 0;
    vitoriasRodadaOponente = 0;
    rodadaAtual = 1;
    fimDeRodadaProcessando = false;
}

function proximaRodada(vencedorUltima) {
    // Fecha qualquer overlay existente
    const overlays = document.querySelectorAll('div[style*="position:fixed"]');
    overlays.forEach(o => {
        if (o.innerText.includes("FIM DA RODADA") || o.innerText.includes("VOCÊ PERDEU")) {
            document.body.removeChild(o);
        }
    });

    const overlay = document.createElement("div");
    overlay.id = "overlayFimRodada";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.85)";
    overlay.style.display = "flex";
    overlay.style.alignItems = "center";
    overlay.style.justifyContent = "center";
    overlay.style.zIndex = "10000";
    
    const box = document.createElement("div");
    box.style.background = "#c2a679";
    box.style.border = "4px solid #3d2b1f";
    box.style.padding = "30px";
    box.style.borderRadius = "10px";
    box.style.textAlign = "center";
    box.style.maxWidth = "400px";
    box.style.width = "90%";
    
    const titulo = document.createElement("h2");
    titulo.style.marginTop = "0";
    titulo.style.color = "#3d2b1f";
    titulo.innerText = `FIM DA RODADA ${rodadaAtual}`;
    
    const texto = document.createElement("p");
    texto.style.fontSize = "18px";
    texto.style.color = "#1a0f08";
    texto.innerHTML = `Vencedor: <strong>${vencedorUltima}</strong>`;
    
    const btnOk = document.createElement("button");
    btnOk.id = "btnProximaRodadaFinal";
    btnOk.style.padding = "12px 25px";
    btnOk.style.background = "#3d2b1f";
    btnOk.style.color = "gold";
    btnOk.style.border = "none";
    btnOk.style.borderRadius = "5px";
    btnOk.style.fontFamily = "'Cinzel', serif";
    btnOk.style.fontWeight = "bold";
    btnOk.style.cursor = "pointer";
    btnOk.style.marginTop = "15px";
    btnOk.innerText = "PRÓXIMA RODADA";
    
    btnOk.onclick = function() {
        console.log("Botão Próxima Rodada clicado");
        document.body.removeChild(overlay);
        executarResetRodada();
    };

    box.appendChild(titulo);
    box.appendChild(texto);
    box.appendChild(btnOk);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
}

function executarResetRodada() {
    console.log("Executando reset da rodada");
    fimDeRodadaProcessando = false;
    
    // Fecha qualquer overlay que tenha sobrado
    const overlays = document.querySelectorAll('div[style*="position:fixed"]');
    overlays.forEach(o => {
        if (o.id === "overlayFimRodada" || o.innerText.includes("FIM DA RODADA")) {
            if (o.parentNode) document.body.removeChild(o);
        }
    });

    rodadaAtual++;
    
    // Resetar estado do jogo para nova rodada
    vidaJogador = 5000;
    vidaOponente = 5000;
    monstrosJogador = [null, null, null];
    especiaisJogador = [null, null, null];
    monstrosOponente = [null, null, null];
    especiaisOponente = [null, null, null];
    minhaMao = [];
    maoOponente = [];
    cemiterioJogador = [];
    cemiterioOponente = [];
    jaInvocouMonstro = false;
    jaComprouCarta = false;
    totalTurnosPartida = 0;

    // Recarregar deck do jogador
    meuDeck = JSON.parse(localStorage.getItem(`deck_build_${usuario}`)) || [];
    
    atualizarPlacarMelhorDe3();
    
    // Reabrir o modal da roleta para decidir quem começa a próxima rodada
    const modalRoleta = document.getElementById("modalRoleta");
    if (modalRoleta) modalRoleta.style.display = "flex";
    
    const btnGirar = document.getElementById("btnGirar");
    if (btnGirar) {
        btnGirar.disabled = false;
        btnGirar.innerText = "GIRAR";
    }
    
    const turnoAviso = document.getElementById("turnoAviso");
    if (turnoAviso) turnoAviso.innerText = "SORTEANDO...";
    
    // Ocultar botão de passar turno até o novo sorteio
    const btnPassar = document.getElementById("btnPassarTurno");
    if (btnPassar) btnPassar.style.display = "none";
    
    // Resetar rotação da roleta para permitir novo giro
    const roletaElement = document.getElementById("roleta");
    if (roletaElement) {
        roletaElement.style.transition = "none";
        roletaElement.style.transform = "rotate(0deg)";
        void roletaElement.offsetWidth;
        roletaElement.style.transition = "transform 3s cubic-bezier(0.1, 0, 0.2, 1)";
    }

    atualizarPlacarMelhorDe3();
    atualizarTela();
}

/* === RENDERIZAÇÃO === */
function renderCemiterio() {
    const cj = document.getElementById("cemiterioJogador");
    if (cj) {
        cj.innerHTML = "";
        if (cemiterioJogador.length > 0) {
            const ultima = cemiterioJogador[cemiterioJogador.length - 1];
            cj.innerHTML = `<img src="${ultima.imagem}" class="carta-img" style="opacity: 0.6; filter: grayscale(50%);">`;
        }
    }
    const co = document.getElementById("cemiterioOponente");
    if (co) {
        co.innerHTML = "";
        if (cemiterioOponente.length > 0) {
            const ultimaOp = cemiterioOponente[cemiterioOponente.length - 1];
            co.innerHTML = `<img src="${ultimaOp.imagem}" class="protection-img" style="opacity: 0.6; filter: grayscale(50%);">`;
        }
    }
}

function renderLinha(id, lista, isJogador, tipoLinha) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = "";
    lista.forEach((c, i) => {
        const div = document.createElement("div");
        div.className = "slot";
        if (c) {
            const ehOculto = !isJogador && !c.revelada;
            const imgPath = ehOculto ? "imagens/back.jpg" : c.imagem;
            if (c.modo === "defesa") div.classList.add("modo-defesa");
            
            const img = document.createElement("img");
            img.src = imgPath;
            img.className = "carta-img";
            div.appendChild(img);

            if (tipoLinha === "combate") {
                // Indicador de Stance (A/D) - Só mostra se não for oculto ou se for do jogador
                if (!ehOculto) {
                    const stance = document.createElement("div");
                    stance.className = `stance-indicator ${c.modo === 'ataque' ? 'atk' : 'def'}`;
                    stance.innerText = c.modo === 'ataque' ? 'A' : 'D';
                    div.appendChild(stance);

                    // Stats de ATK/DEF
                    const status = document.createElement("div");
                    status.className = "status-dual";
                    status.innerHTML = `
                        <div class="stat-box">
                            <span class="stat-label">ATK</span>
                            <span class="stat-value atk">${c.ataque}</span>
                        </div>
                        <div class="stat-box">
                            <span class="stat-label">DEF</span>
                            <span class="stat-value def">${c.defesa}</span>
                        </div>
                    `;
                    div.appendChild(status);
                }

                // Efeito de Bloqueio (sempre mostra se bloqueado)
                if (c.bloqueado) {
                    const efeito = document.createElement("div");
                    efeito.className = "bloqueado-effect";
                    div.appendChild(efeito);

                    const contador = document.createElement("div");
                    contador.className = "bloqueio-contador";
                    contador.innerText = c.turnosBloqueio;
                    div.appendChild(contador);
                }
            }
            
            if (tipoLinha === "suporte" && !ehOculto && c.imagem.includes("bloqueio.jpg")) {
                const tag = document.createElement("div");
                tag.className = "alvo-tag";
                tag.innerText = `ALVO: ${c.vinculo + 1}`;
                div.appendChild(tag);
            }
            
            if (isJogador && tipoLinha === "combate") div.onclick = () => acaoMonstro(i);
            if (isJogador && tipoLinha === "suporte") div.onclick = () => acaoEspecial(i);
        }
        el.appendChild(div);
    });
}

function atualizarTela() {
    document.getElementById("vidaJogador").innerText = vidaJogador;
    document.getElementById("vidaOponente").innerText = vidaOponente;
    document.getElementById("contador-deck").innerText = meuDeck.length;
    renderLinha("monstrosOponente", monstrosOponente, false, "combate");
    renderLinha("especiaisOponente", especiaisOponente, false, "suporte");
    renderLinha("monstrosJogador", monstrosJogador, true, "combate");
    renderLinha("especiaisJogador", especiaisJogador, true, "suporte");
    renderCemiterio();
    
    const maoDiv = document.getElementById("minhaMao");
    maoDiv.innerHTML = "";
    minhaMao.forEach((c, i) => {
        const carta = document.createElement("div");
        carta.className = "carta-mao";
        carta.innerHTML = `<img src="${c.imagem}">`;
        if (c.tipo === "monstro") carta.innerHTML += `<div class="mao-stats"><span style="color:#3498db">${c.ataque}</span> <span style="color:#ffff00">${c.defesa}</span></div>`;
        carta.onclick = () => usarDaMao(i);
        maoDiv.appendChild(carta);
    });

    const maoOpDiv = document.getElementById("maoOponente");
    maoOpDiv.innerHTML = "";
    maoOponente.forEach(() => {
        const d = document.createElement("div");
        d.className = "carta-mao"; d.innerHTML = `<img src="imagens/back.jpg">`;
        maoOpDiv.appendChild(d);
    });
}

function acaoEspecial(idx) {
    if (turnoAtual !== "VOCÊ") return;
    let esp = especiaisJogador[idx];
    if (!esp || esp.revelada) return;
    
    mostrarSelecao("ESPECIAL", ["ATIVAR"], (sel) => {
        if (sel === 0) {
            tocarSom("efeitosonoros/carta.ogg");
            ativarEfeitoEspecialCampo(idx);
        }
    });
}

function usarDaMao(idx) {
    if (turnoAtual !== "VOCÊ") return;
    const carta = minhaMao[idx];
    if (carta.tipo === "monstro") {
        if (jaInvocouMonstro) return alert("Apenas 1 monstro por turno!");

        // --- LÓGICA DE SACRIFÍCIO ---
        if (carta.sacrifio > 0) {
            let monstrosNoCampo = monstrosJogador.map((m, i) => m ? {i, nome: m.nome, bloqueado: m.bloqueado} : null).filter(Boolean);
            if (monstrosNoCampo.length < carta.sacrifio) {
                return alert(`Você precisa de ${carta.sacrifio} monstros no campo para sacrificar e invocar esta carta!`);
            }

            mostrarSelecao("PRIMEIRO SACRIFÍCIO", monstrosNoCampo.map(m => m.nome), (sel1) => {
                const idx1 = monstrosNoCampo[sel1].i;
                const m1 = monstrosJogador[idx1];
                
                // --- REMOVER BLOQUEIO SE O PRIMEIRO SACRIFICADO ESTIVER BLOQUEADO ---
                if (m1.bloqueado) {
                    const idxEsp = especiaisOponente.findIndex(e => e && e.vinculo === idx1 && e.imagem.includes("bloqueio.jpg"));
                    if (idxEsp !== -1) {
                        cemiterioOponente.push(especiaisOponente[idxEsp]);
                        especiaisOponente[idxEsp] = null;
                    }
                }

                // Filtra para o segundo sacrifício (não pode ser o mesmo)
                let restantes = monstrosNoCampo.filter(m => m.i !== idx1);
                
                mostrarSelecao("SEGUNDO SACRIFÍCIO", restantes.map(m => m.nome), (sel2) => {
                    const idx2 = restantes[sel2].i;
                    const m2 = monstrosJogador[idx2];

                    // --- REMOVER BLOQUEIO SE O SEGUNDO SACRIFICADO ESTIVER BLOQUEADO ---
                    if (m2.bloqueado) {
                        const idxEsp = especiaisOponente.findIndex(e => e && e.vinculo === idx2 && e.imagem.includes("bloqueio.jpg"));
                        if (idxEsp !== -1) {
                            cemiterioOponente.push(especiaisOponente[idxEsp]);
                            especiaisOponente[idxEsp] = null;
                        }
                    }

                    // Envia os dois para o cemitério
                    cemiterioJogador.push(m1);
                    cemiterioJogador.push(m2);
                    monstrosJogador[idx1] = null;
                    monstrosJogador[idx2] = null;

                    // Som de sacrifício após escolher os dois
                    tocarSom("efeitosonoros/sacrificio.ogg");

                    // Invoca a carta de sacrifício
                    mostrarSelecao("MODO DE INVOCAÇÃO", ["ATAQUE", "DEFESA"], (selModo) => {
                        const modo = selModo === 0 ? "ataque" : "defesa";
                        const slot = monstrosJogador.findIndex(s => s === null);
                        if (slot !== -1) {
                            monstrosJogador[slot] = { ...carta, modo: modo, revelada: (modo === "ataque"), jaAtacou: false, acabouDeSerInvocado: true, mudouPosicaoNesteTurno: false };
                            tocarSom("efeitosonoros/carta.ogg");
                            minhaMao.splice(idx, 1);
                            jaInvocouMonstro = true;
                            logBatalha(`Invocação Especial por Sacrifício: ${carta.nome}!`, "info");
                            atualizarTela();
                        }
                    });
                });
            });
            return; // Interrompe o fluxo normal
        }

        // Invocação Normal
        mostrarSelecao("INVOCAR", ["ATAQUE", "DEFESA"], (sel) => {
            const modo = sel === 0 ? "ataque" : "defesa";
            const slot = monstrosJogador.findIndex(s => s === null);
            if (slot !== -1) {
                monstrosJogador[slot] = { ...carta, modo: modo, revelada: (modo === "ataque"), jaAtacou: false, acabouDeSerInvocado: true, mudouPosicaoNesteTurno: false };
                tocarSom("efeitosonoros/carta.ogg");
                minhaMao.splice(idx, 1);
                jaInvocouMonstro = true;
                atualizarTela();
            }
        });
    } else {
        mostrarSelecao("ESPECIAL", ["USAR AGORA", "COLOCAR NO CAMPO"], (sel) => {
            if (sel === 0) {
                const carta = minhaMao[idx];
                tocarSom("efeitosonoros/carta.ogg");
                ativarEfeitoEspecial(carta, () => minhaMao.splice(idx, 1));
            }
            else {
                const s = especiaisJogador.findIndex(x => x === null);
                if (s !== -1) { 
                    especiaisJogador[s] = { ...minhaMao[idx], revelada: false }; 
                    tocarSom("efeitosonoros/carta.ogg");
                    minhaMao.splice(idx, 1); 
                }
                atualizarTela();
            }
        });
    }
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

// --- FUNÇÃO PARA ANIMAÇÃO DE ATIVAÇÃO DE CARTA ---
function animarAtivacaoCarta(carta, callback, titulo = "") {
    const overlay = document.createElement("div");
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:20000; pointer-events:none; font-family:'Cinzel', serif;";
    
    if (titulo) {
        const text = document.createElement("div");
        text.style = "color:gold; font-size:24px; font-weight:bold; margin-bottom:20px; text-shadow:0 0 10px gold; animation: fadeIn 0.5s;";
        text.innerText = titulo;
        overlay.appendChild(text);
    }

    const img = document.createElement("img");
    img.src = carta.imagem;
    img.style = "width:220px; height:310px; border:4px solid gold; border-radius:10px; box-shadow:0 0 50px gold; transform:scale(0); transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);";
    
    overlay.appendChild(img);
    document.body.appendChild(overlay);
    
    // Força reflow
    void img.offsetWidth;
    
    // Inicia zoom in
    img.style.transform = "scale(1.1)";
    tocarSom("efeitosonoros/carta.ogg");
    
    setTimeout(() => {
        // Zoom out e some
        img.style.transition = "transform 0.4s ease-in, opacity 0.4s ease-in";
        img.style.transform = "scale(1.5)";
        img.style.opacity = "0";
        if (titulo) overlay.firstChild.style.opacity = "0";
        
        setTimeout(() => {
            if (overlay.parentNode) document.body.removeChild(overlay);
            if (callback) callback();
        }, 400);
    }, 1200); // Aumentado para 1.2s para dar tempo de ver a carta
}

function ativarEfeitoEspecial(cartaParaUsar, callbackRemover) {
    animarAtivacaoCarta(cartaParaUsar, () => {
        executarAtivacaoEspecial(cartaParaUsar, callbackRemover);
    }, "VOCÊ ATIVA:");
}

function executarAtivacaoEspecial(cartaParaUsar, callbackRemover) {
    const img = cartaParaUsar.imagem.toLowerCase();

    // LÓGICA DE TRANSFORMAÇÃO EM ROBÔ (EQUIPAR)
    if (img.includes("equipar.jpg")) {
        let alvos = monstrosJogador.map((m, i) => m ? {i, nome: m.nome} : null).filter(Boolean);
        if (alvos.length === 0) return alert("Sem monstros no campo para equipar!");
        
        // Modificado: Agora só oferece o robô do nível atual (ou o 5º se nível > 5)
        const roboNivel = nivelAtual <= 5 ? nivelAtual : 5;
        const robos = [
            { nome: "Robô A1", imagem: "imagens/robos/robo1.jpg", ataque: 2000, defesa: 1800 },
            { nome: "Robô A2", imagem: "imagens/robos/robo2.jpg", ataque: 2200, defesa: 2000 },
            { nome: "Robô A3", imagem: "imagens/robos/robo3.jpg", ataque: 2500, defesa: 2200 },
            { nome: "Robô A4", imagem: "imagens/robos/robo4.jpg", ataque: 2800, defesa: 2500 },
            { nome: "Robô A5", imagem: "imagens/robos/robo5.jpg", ataque: 3100, defesa: 2800 }
        ];
        
        const r = robos[roboNivel - 1];
        
        mostrarSelecao("ESCOLHA O MONSTRO", alvos.map(a => a.nome), (selMon) => {
            const mIdx = alvos[selMon].i;
            
            // Som de equipar só depois de escolher o monstro
            tocarSom("efeitosonoros/equipar.ogg");

            const monstroAlvo = monstrosJogador[mIdx];
            logBatalha(`Você equipou seu ${monstroAlvo.nome} e agora é uma super máquina: ${r.nome}!`, "info");

            monstrosJogador[mIdx].imagem = r.imagem;
            monstrosJogador[mIdx].nome = r.nome;
            monstrosJogador[mIdx].ataque = r.ataque;
            monstrosJogador[mIdx].defesa = r.defesa;
            
            const removida = callbackRemover();
            if (removida) cemiterioJogador.push(removida);
            atualizarTela();
        });
    } else if (img.includes("powerup")) {
        let alvos = monstrosJogador.map((m, i) => m ? {i, nome: m.nome} : null).filter(Boolean);
        if (alvos.length === 0) return alert("Sem monstros no campo!");
        mostrarSelecao("POWERUP (+300 ATK/DEF)", alvos.map(a => a.nome), (sel) => {
            const mIdx = alvos[sel].i;

            // Som de powerup só depois de escolher o alvo
            tocarSom("efeitosonoros/powerup.ogg");

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

            // Som de powerdown só depois de escolher o alvo
            tocarSom("efeitosonoros/powerdown.ogg");

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
            
            // Ativa o bloqueio no monstro
            monstrosOponente[mIdx].bloqueado = true;
            monstrosOponente[mIdx].turnosBloqueio = 3;
            
            // Remove da origem (mão ou campo)
            const removida = callbackRemover(); 
            
            // Encontra slot especial se veio da mão
            if (removida && !removida.vinculo) {
                const slotEsp = especiaisJogador.findIndex(s => s === null);
                if (slotEsp === -1) {
                    // Se não tiver slot, cancela ou bota no cemitério? 
                    // Pelas regras, ele fica no campo. Se não tem slot, não pode usar.
                    // Já verificamos slot no fluxo anterior mas aqui é mais seguro.
                    return alert("Sem slots de especiais vazios!");
                }
                especiaisJogador[slotEsp] = { 
                    ...removida, 
                    revelada: true, 
                    vinculo: mIdx, 
                    turnosRestantes: 3 
                };
            } else {
                // Se já estava no campo, apenas atualiza
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
            const alvo = monstrosOponente[mIdx];
            
            // --- REMOVER BLOQUEIO SE O ALVO SAIR DO CAMPO POR CHAMADO ---
            if (alvo.bloqueado) {
                const idxEsp = especiaisJogador.findIndex(e => e && e.vinculo === mIdx && e.imagem.includes("bloqueio.jpg"));
                if (idxEsp !== -1) {
                    cemiterioJogador.push(especiaisJogador[idxEsp]);
                    especiaisJogador[idxEsp] = null;
                }
            }

            logBatalha(`${alvo.nome} foi enviado ao cemitério!`, "info");
            cemiterioOponente.push(alvo);
            monstrosOponente[mIdx] = null;
            
            const removida = callbackRemover();
            if (removida) cemiterioJogador.push(removida);
            
            atualizarTela();
        });
    } else if (img.includes("vida.jpg")) {
        tocarSom("efeitosonoros/vida.ogg");
        alterarVida("jogador", vidaJogador + 500);
        logBatalha(`Você recuperou 500 LP!`, "cura");
        callbackRemover(); // Executa o callback para remover da mão/campo
        atualizarTela();
    } else if (img.includes("fusao.jpg")) {
        let monstrosNoCampo = monstrosJogador.map((m, i) => m ? {i, nome: m.nome} : null).filter(Boolean);
        let monstrosNaMao = minhaMao.filter(c => c.tipo === "monstro" && c !== cartaParaUsar);
        
        if (monstrosNoCampo.length === 0 || monstrosNaMao.length === 0) {
            return alert("Você precisa de 1 monstro no campo e 1 na mão para a fusão!");
        }

        mostrarSelecao("MONSTRO DO CAMPO", monstrosNoCampo.map(m => m.nome), (selCampo) => {
            const mCampoIdx = monstrosNoCampo[selCampo].i;
            mostrarSelecao("MONSTRO DA MÃO", monstrosNaMao.map(m => m.nome), (selMao) => {
                const mMaoObj = monstrosNaMao[selMao];
                const mMaoIdx = minhaMao.indexOf(mMaoObj);

                tocarSom("efeitosonoros/fusao.ogg");
                // ... (lógica de mutante) ...
                let mutante;
                if (nivelAtual <= 5) {
                    mutante = { nome: "Mutante 1", imagem: "imagens/mutantes/mutante1.jpg", ataque: 2500, defesa: 2000, tipo: "monstro" };
                } else if (nivelAtual <= 10) {
                    mutante = { nome: "Mutante 2", imagem: "imagens/mutantes/mutante2.jpg", ataque: 3000, defesa: 2500, tipo: "monstro" };
                } else {
                    mutante = { nome: "Mutante 3", imagem: "imagens/mutantes/mutante3.jpg", ataque: 3500, defesa: 2900, tipo: "monstro" };
                }

                // Executa a fusão
                cemiterioJogador.push(monstrosJogador[mCampoIdx]);
                cemiterioJogador.push(minhaMao.splice(mMaoIdx, 1)[0]);
                
                monstrosJogador[mCampoIdx] = { ...mutante, modo: "ataque", revelada: true, jaAtacou: false, acabouDeSerInvocado: true, mudouPosicaoNesteTurno: false };
                tocarSom("efeitosonoros/carta.ogg");
                
                const removida = callbackRemover();
                if (removida) cemiterioJogador.push(removida);
                
                logBatalha(`Fusão realizada: ${mutante.nome}!`, "info");
                atualizarTela();
            });
        });
    } else if (img.includes("trocal.jpg")) {
        tocarSom("efeitosonoros/trocal.ogg");
        let alvos = monstrosOponente.map((m, i) => m ? {i, nome: m.nome} : null).filter(Boolean);
        if (alvos.length === 0) return alert("Oponente sem monstros para roubar!");
        
        const slotLivre = monstrosJogador.findIndex(s => s === null);
        if (slotLivre === -1) return alert("Você não tem espaço no campo para o monstro roubado!");

        mostrarSelecao("ROUBAR MONSTRO (2 TURNOS)", alvos.map(a => a.nome), (sel) => {
            const mIdxOponente = alvos[sel].i;
            const monstroRoubado = monstrosOponente[mIdxOponente];
            
            // --- REMOVER BLOQUEIO SE O ALVO FOR ROUBADO ---
            if (monstroRoubado.bloqueado) {
                const idxEsp = especiaisJogador.findIndex(e => e && e.vinculo === mIdxOponente && e.imagem.includes("bloqueio.jpg"));
                if (idxEsp !== -1) {
                    cemiterioJogador.push(especiaisJogador[idxEsp]);
                    especiaisJogador[idxEsp] = null;
                }
            }

            // Transfere o monstro
            monstrosJogador[slotLivre] = { 
                ...monstroRoubado, 
                roubado: true, 
                turnosRoubo: 2, 
                donoOriginal: "oponente",
                revelada: true,
                jaAtacou: false,
                bloqueado: false // Limpa bloqueio ao mudar de lado
            };
            tocarSom("efeitosonoros/carta.ogg");
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

function passarTurno() {
    if (turnoAtual !== "VOCÊ") return;
    
    totalTurnosPartida++; // Incrementa turno
    
    // --- ATUALIZA EFEITOS NO FIM DO TURNO DO JOGADOR ---
    especiaisJogador.forEach((esp, i) => {
        if (esp && esp.imagem.includes("bloqueio.jpg")) {
            esp.turnosRestantes--;
            const alvoIdx = esp.vinculo;
            // Se o tempo acabou ou o monstro oponente no slot sumiu
            if (esp.turnosRestantes <= 0 || !monstrosOponente[alvoIdx]) {
                if (monstrosOponente[alvoIdx]) {
                    monstrosOponente[alvoIdx].bloqueado = false;
                    monstrosOponente[alvoIdx].turnosBloqueio = 0;
                }
                cemiterioJogador.push(especiaisJogador[i]);
                especiaisJogador[i] = null;
                logBatalha("O efeito de Bloqueio acabou e a carta foi para o cemitério.", "info");
            }
        }
    });

    // Controle de monstros roubados (Trocal)
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
    document.getElementById("turnoAviso").innerText = "TURNO: MÁQUINA";
    atualizarTela();
    setTimeout(turnoDaMaquina, 1500);
}

// --- ADICIONAR LÓGICA DE FIM DE TURNO DA MÁQUINA TAMBÉM ---
function finalizarTurnoMaquina() {
    especiaisOponente.forEach((esp, i) => {
        if (esp && esp.imagem.includes("bloqueio.jpg")) {
            esp.turnosRestantes--;
            const alvoIdx = esp.vinculo;
            if (esp.turnosRestantes <= 0 || !monstrosJogador[alvoIdx]) {
                if (monstrosJogador[alvoIdx]) {
                    monstrosJogador[alvoIdx].bloqueado = false;
                    monstrosJogador[alvoIdx].turnosBloqueio = 0;
                }
                cemiterioOponente.push(especiaisOponente[i]);
                especiaisOponente[i] = null;
                logBatalha("O bloqueio da Máquina acabou.", "info");
            }
        }
    });

    turnoAtual = "VOCÊ"; 
    jaComprouCarta = false; jaInvocouMonstro = false;
    monstrosJogador.forEach(m => { if(m) { m.jaAtacou = false; m.acabouDeSerInvocado = false; m.mudouPosicaoNesteTurno = false; } });
    document.getElementById("turnoAviso").innerText = "TURNO: VOCÊ";
    atualizarTela();
    verificarFimJogo();
}

/* === NARRADOR SOMBRIO === */
function mostrarNarrador(texto, callback) {
    const overlay = document.createElement("div");
    overlay.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:radial-gradient(circle, rgba(20,0,0,0.9) 0%, rgba(0,0,0,1) 100%); display:flex; flex-direction:column; align-items:center; justify-content:center; z-index:30000;";
    
    const container = document.createElement("div");
    container.style = "position:relative; display:flex; flex-direction:column; align-items:center; width:90%; max-width:500px;";

    // Balão de conversa
    const balao = document.createElement("div");
    balao.style = "background:white; border:3px solid #333; border-radius:20px; padding:15px 20px; margin-bottom:20px; position:relative; box-shadow:0 0 20px rgba(255,255,255,0.2); width:100%; text-align:center; font-family:'Cinzel', serif; font-weight:bold; color:#111; font-size:18px;";
    balao.innerHTML = texto;
    
    // Triângulo do balão
    const seta = document.createElement("div");
    seta.style = "position:absolute; bottom:-15px; left:50%; transform:translateX(-50%); width:0; height:0; border-left:15px solid transparent; border-right:15px solid transparent; border-top:15px solid white;";
    balao.appendChild(seta);

    // Imagem do narrador
    const img = document.createElement("img");
    img.src = "imagens/ceifeiro.gif";
    img.style = "width:250px; height:250px; border-radius:50%; border:5px solid #3d2b1f; box-shadow:0 0 40px rgba(255,0,0,0.3); filter: brightness(0.8) contrast(1.2);";
    
    const btnProsseguir = document.createElement("button");
    btnProsseguir.innerText = "PROSSEGUIR...";
    btnProsseguir.style = "margin-top:30px; padding:12px 30px; background:#3d2b1f; color:gold; border:2px solid gold; border-radius:5px; font-family:'Cinzel', serif; font-weight:bold; cursor:pointer; letter-spacing:2px; transition:0.3s;";
    btnProsseguir.onmouseover = () => btnProsseguir.style.background = "#5a3d2b";
    btnProsseguir.onmouseout = () => btnProsseguir.style.background = "#3d2b1f";
    
    btnProsseguir.onclick = () => {
        document.body.removeChild(overlay);
        if (callback) callback();
    };

    container.appendChild(balao);
    container.appendChild(img);
    container.appendChild(btnProsseguir);
    overlay.appendChild(container);
    document.body.appendChild(overlay);
}

function mostrarDerrota() {
    const falasDerrota = [
        "Fraco... você precisa melhorar muito suas habilidades se quiser me enfrentar.",
        "É apenas isso que você tem? Que decepção...",
        "Volte para o treinamento. Você não está pronto para a verdadeira arena."
    ];
    const fala = falasDerrota[Math.floor(Math.random() * falasDerrota.length)];
    
    mostrarNarrador(fala, () => {
        const overlay = document.createElement("div");
        overlay.style.position = "fixed";
        overlay.style.left = "0";
        overlay.style.top = "0";
        overlay.style.right = "0";
        overlay.style.bottom = "0";
        overlay.style.background = "rgba(0,0,0,0.85)";
        overlay.style.zIndex = "3000";
        overlay.style.display = "flex";
        overlay.style.flexDirection = "column";
        overlay.style.alignItems = "center";
        overlay.style.justifyContent = "center";
        const box = document.createElement("div");
        box.style.background = "#c2a679";
        box.style.border = "4px solid #3d2b1f";
        box.style.padding = "20px";
        box.style.borderRadius = "8px";
        box.style.textAlign = "center";
        box.style.width = "90%";
        box.style.maxWidth = "360px";
        const h = document.createElement("div");
        h.innerText = "VOCÊ PERDEU";
        h.style.fontSize = "22px";
        h.style.fontWeight = "900";
        h.style.marginBottom = "10px";
        const p = document.createElement("div");
        p.innerText = "Tentar novamente?";
        p.style.marginBottom = "15px";
        const btn = document.createElement("button");
        btn.innerText = "JOGAR NOVAMENTE";
        btn.style.padding = "10px 16px";
        btn.style.fontWeight = "bold";
        btn.style.cursor = "pointer";
        btn.onclick = () => location.reload();
        box.appendChild(h);
        box.appendChild(p);
        box.appendChild(btn);
        overlay.appendChild(box);
        document.body.appendChild(overlay);
    });
}

function mostrarSelecao(tit, ops, cb) {
    document.getElementById("textoModal").innerText = tit;
    const box = document.getElementById("botoesAcao");
    box.innerHTML = "";
    ops.forEach((o, i) => {
        const b = document.createElement("button");
        b.innerText = o; b.onclick = () => { fecharModal(); cb(i); };
        box.appendChild(b);
    });
    document.getElementById("modalPosicao").style.display = "flex";
}

function fecharModal() { document.getElementById("modalPosicao").style.display = "none"; }

function logBatalha(m, t) {
    const l = document.getElementById("logConteudo");
    if (!l) return;
    const d = document.createElement("div");
    d.className = "log-item " + t; d.innerText = m;
    l.prepend(d);
}

function toggleLog() {
    const conteudo = document.getElementById("logConteudo");
    const icon = document.getElementById("logToggleIcon");
    if (!conteudo || !icon) return;
    const aberto = conteudo.style.display !== "none";
    conteudo.style.display = aberto ? "none" : "block";
    icon.textContent = aberto ? "▲" : "▼";
}

window.onload = () => { 
    document.getElementById("nomeUser").innerText = usuario; 
    atualizarTela();
    
    // Inicia com o Narrador intimidando antes da roleta
    const falasIniciais = [
        "Bem-vindo à minha arena... espero que esteja pronto para ser humilhado.",
        "Mais um duelista patético tentando a sorte? Veremos quanto tempo dura.",
        "O medo no seu olhar é divertido... vamos ver se suas cartas são melhores que sua coragem."
    ];
    const fala = falasIniciais[Math.floor(Math.random() * falasIniciais.length)];
    
    mostrarNarrador(fala, () => {
        document.getElementById("modalRoleta").style.display = "flex";
    });
};
