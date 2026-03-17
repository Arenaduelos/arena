const nomeUsuario = localStorage.getItem("usuarioLogado") || "Duelista";

if (!localStorage.getItem("usuarioLogado")) {
    window.location.href = "index.html";
}

// --- FUNÇÃO PARA NORMALIZAR DADOS DE CARTA (MIGRAÇÃO DE PROPRIEDADES ANTIGAS) ---
function normalizarCarta(c) {
    if (!c) return null;
    return {
        nome: c.nome || c.n || "Sem Nome",
        imagem: c.imagem || c.img || "imagens/back.jpg",
        tipo: c.tipo || c.t || "monstro",
        ataque: parseInt(c.ataque || c.a || 0),
        defesa: parseInt(c.defesa || c.d || 0),
        sacrifio: parseInt(c.sacrifio || c.s || 0)
    };
}

// --- CONFIGURAÇÃO INICIAL ---
let meuBauRaw = JSON.parse(localStorage.getItem(`deck_inventory_${nomeUsuario}`)) || [];
let meuBau = meuBauRaw.map(normalizarCarta).filter(Boolean);

const COMPOSICAO_INICIAL = [
    { imagem: "imagens/plantas/planta1.jpg", nome: "Planta 1", tipo: "monstro", ataque: 500, defesa: 400, q: 7 },
    { imagem: "imagens/insetos/inseto1.jpg", nome: "Inseto 1", tipo: "monstro", ataque: 600, defesa: 650, q: 5 },
    { imagem: "imagens/guerreiros/guerreiro1.jpg", nome: "Guerreiro 1", tipo: "monstro", ataque: 1050, defesa: 860, q: 5 },
    { imagem: "imagens/orcs/orc1.jpg", nome: "Orc 1", tipo: "monstro", ataque: 1200, defesa: 950, q: 5 },
    { imagem: "imagens/especiais/vida.jpg", nome: "Vida", tipo: "especial", ataque: 0, defesa: 0, q: 2 },
    { imagem: "imagens/especiais/powerup.jpg", nome: "Powerup", tipo: "especial", ataque: 0, defesa: 0, q: 2 },
    { imagem: "imagens/especiais/equipar.jpg", nome: "Equipar", tipo: "especial", ataque: 0, defesa: 0, q: 2 }
];

// FORÇAR RESET SE O JOGADOR ESTIVER SEM AS CARTAS BÁSICAS DO NÍVEL 1
const temPlanta1 = meuBau.some(c => c.nome === "Planta 1");
const temInseto1 = meuBau.some(c => c.nome === "Inseto 1");

// O reset agora só ocorre se o baú estiver vazio ou se o jogador não tiver as cartas iniciais obrigatórias.
if (meuBau.length === 0 || !temPlanta1 || !temInseto1) {
    console.log("Sistema detectou deck incompleto ou novo jogador. Aplicando composição inicial oficial...");
    meuBau = [];
    COMPOSICAO_INICIAL.forEach(item => {
        for (let i = 0; i < item.q; i++) {
            meuBau.push({ 
                nome: item.nome, 
                imagem: item.imagem, 
                tipo: item.tipo, 
                ataque: item.ataque, 
                defesa: item.defesa 
            });
        }
    });
    localStorage.setItem(`deck_inventory_${nomeUsuario}`, JSON.stringify(meuBau));
    localStorage.removeItem(`deck_build_${nomeUsuario}`);
    window.location.reload();
}

// --- DECK QUE ESTÁ SENDO MONTADO (BOX ESQUERDO) ---
let slotsAtivosRaw = JSON.parse(localStorage.getItem(`deck_build_${nomeUsuario}`)) || [];
let slotsAtivos = slotsAtivosRaw.map(s => s ? normalizarCarta(s) : null);

const deckTemPlanta = slotsAtivos && slotsAtivos.some(s => s && s.nome === "Planta 1");
const deckTemInseto = slotsAtivos && slotsAtivos.some(s => s && s.nome === "Inseto 1");
const tamanhoIncorreto = slotsAtivos && (slotsAtivos.length < 24 || slotsAtivos.length > 28);

if (!slotsAtivos || slotsAtivos.every(s => s === null) || !deckTemPlanta || !deckTemInseto || tamanhoIncorreto) {
    console.log("Resetando deck ativo para o padrão oficial...");
    slotsAtivos = [];
    COMPOSICAO_INICIAL.forEach(item => {
        for (let i = 0; i < item.q; i++) {
            slotsAtivos.push({ 
                nome: item.nome, 
                imagem: item.imagem, 
                tipo: item.tipo, 
                ataque: item.ataque, 
                defesa: item.defesa 
            });
        }
    });
    while(slotsAtivos.length < 28) slotsAtivos.push(null);
    if(slotsAtivos.length > 28) slotsAtivos = slotsAtivos.slice(0, 28);
    
    localStorage.setItem(`deck_build_${nomeUsuario}`, JSON.stringify(slotsAtivos));
}

// --- STATS ---
const nivel = parseInt(localStorage.getItem(`nivel_${nomeUsuario}`)) || 1;
const moedas = parseInt(localStorage.getItem(`moedas_${nomeUsuario}`)) || 0;
const stats = document.getElementById("statsJogador");

function atualizarStats() {
    if (stats) {
        stats.innerHTML = `
            <div class="stat-item" title="Nível Atual">
                <span>⭐</span> <span>${nivel}</span>
            </div>
            <div class="stat-item" title="Minhas Moedas">
                <span>💰</span> <span>${moedas.toLocaleString()}</span>
            </div>
        `;
    }
}
atualizarStats();

// --- FUNÇÃO AUXILIAR PARA SONS ---
function tocarSom(caminho) {
    const audio = new Audio(caminho);
    audio.play().catch(e => console.log("Erro ao tocar som:", e));
}

// --- SOM DE HOVER GLOBAL ---
function configurarHoverSons() {
    document.body.addEventListener("mouseover", (e) => {
        const target = e.target.closest(".slot-deck-vazio, .carta-bau, .item-loja, .carta-deck");
        if (target) {
            tocarSom("efeitosonoros/carta.ogg");
        }
    });
}
configurarHoverSons();

// --- FILTRO DE INVENTÁRIO ---
let nivelFiltro = 0;

window.filtrarNivel = function(nv) {
    nivelFiltro = parseInt(nv);
    render();
};

// --- FUNÇÃO DE RENDERIZAÇÃO ---
function render() {
    const boxDeck = document.getElementById("deckSlots");
    const boxInventario = document.getElementById("listaCartas");
    const deckCountEl = document.getElementById("deckCount");
    const btnSalvar = document.getElementById("btnSalvarDeck");

    if (!boxDeck || !boxInventario) return;

    // 1. RENDERIZAR O BOX DA ESQUERDA (28 SLOTS)
    boxDeck.innerHTML = "";
    slotsAtivos.forEach((carta, i) => {
        const slot = document.createElement("div");
        slot.className = "slot-deck-vazio";
        slot.dataset.index = i;

        if (carta) {
            slot.classList.add("preenchido");
            slot.innerHTML = `<img src="${carta.imagem}" title="${carta.nome}">`;
            slot.onclick = () => {
                slotsAtivos[i] = null;
                render();
            };
        }

        // Drag and Drop (Receptor)
        slot.ondragover = (e) => e.preventDefault();
        slot.ondrop = (e) => {
            e.preventDefault();
            const dadosCarta = JSON.parse(e.dataTransfer.getData("text/plain"));
            slotsAtivos[i] = dadosCarta;
            render();
        };

        boxDeck.appendChild(slot);
    });

    // 2. RENDERIZAR O BOX DA DIREITA (MEU INVENTÁRIO AGRUPADO)
    boxInventario.innerHTML = "";

    // Filtrar baú por nível antes de renderizar
    let bauFiltrado = meuBau;
    if (nivelFiltro > 0) {
        bauFiltrado = meuBau.filter(c => {
            const priority = (name) => {
                if (name.includes("Planta")) return 1;
                if (name.includes("Inseto")) return 2;
                if (name.includes("Guerreiro")) return 3;
                if (name.includes("Orc")) return 4;
                if (name.includes("Troll")) return 5;
                if (name.includes("Ogro")) return 6;
                if (name.includes("Fada")) return 7;
                if (name.includes("Dragão")) return 8;
                if (name.includes("Mago")) return 9;
                if (name.includes("Ceifeiro") || name.includes("Morte")) return 10;
                if (name.includes("Sacrifício")) return 11;
                return 20;
            };
            return priority(c.nome) === nivelFiltro;
        });
    }

    // Calcular estoque disponível (Total no Baú - Já no Deck)
    const estoqueDisponivel = {};
    meuBau.forEach(c => estoqueDisponivel[c.imagem] = (estoqueDisponivel[c.imagem] || 0) + 1);
    slotsAtivos.forEach(c => { if (c && estoqueDisponivel[c.imagem]) estoqueDisponivel[c.imagem]--; });

    // Obter lista única de imagens no baú filtrado para exibir os itens
    const cartasUnicas = [];
    const vistas = new Set();
    bauFiltrado.forEach(c => {
        if (!vistas.has(c.imagem)) {
            cartasUnicas.push(c);
            vistas.add(c.imagem);
        }
    });

    // Ordenar inventário: Por prioridade de nível/tipo e depois por nome
    cartasUnicas.sort((a, b) => {
        const priority = (name) => {
            if (name.includes("Planta")) return 1;
            if (name.includes("Inseto")) return 2;
            if (name.includes("Guerreiro")) return 3;
            if (name.includes("Orc")) return 4;
            if (name.includes("Troll")) return 5;
            if (name.includes("Ogro")) return 6;
            if (name.includes("Fada")) return 7;
            if (name.includes("Dragão")) return 8;
            if (name.includes("Mago")) return 9;
            if (name.includes("Ceifeiro") || name.includes("Morte")) return 10;
            if (name.includes("Mutante")) return 11;
            if (name.includes("Robô")) return 12;
            if (name.includes("Sacrifício")) return 13; // Nova prioridade para Sacrifício
            if (name === "Vida") return 14;
            if (name === "Powerup") return 15;
            if (name === "Equipar") return 16;
            if (name === "Bloqueio") return 17;
            if (name === "Chamado") return 18;
            if (name === "Despertar") return 19;
            if (name === "Trocal") return 20;
            if (name === "Fusão") return 21;
            return 22;
        };
        const pA = priority(a.nome);
        const pB = priority(b.nome);
        if (pA !== pB) return pA - pB;
        return a.nome.localeCompare(b.nome);
    });

    cartasUnicas.forEach(carta => {
        const qtd = estoqueDisponivel[carta.imagem] || 0;
        const item = document.createElement("div");
        item.className = "item-inventario";
        
        if (qtd <= 0) {
            item.style.opacity = "0.4";
            item.style.cursor = "default";
        }

        item.innerHTML = `
            <img src="${carta.imagem}">
            <div class="badge-qtd">${qtd}</div>
            <div class="nome-item">${carta.nome}</div>
        `;

        if (qtd > 0) {
            item.draggable = true;
            item.ondragstart = (e) => e.dataTransfer.setData("text/plain", JSON.stringify(carta));
            
            // Clique rápido para adicionar ao primeiro slot vazio
            item.onclick = () => {
                const indexVazio = slotsAtivos.indexOf(null);
                if (indexVazio !== -1) {
                    slotsAtivos[indexVazio] = carta;
                    render();
                }
            };
        }

        boxInventario.appendChild(item);
    });

    // 3. ATUALIZAR CONTADOR E BOTÃO
    const preenchidos = slotsAtivos.filter(c => c !== null).length;
    if (deckCountEl) deckCountEl.innerText = `${preenchidos} / 28`;
    if (btnSalvar) btnSalvar.disabled = (preenchidos !== 28);
}

// --- AÇÕES ---
window.esvaziarTudo = function() {
    if (confirm("Deseja limpar todos os slots do deck?")) {
        slotsAtivos = Array(28).fill(null);
        render();
    }
};

document.getElementById("btnSalvarDeck").onclick = () => {
    localStorage.setItem(`deck_build_${nomeUsuario}`, JSON.stringify(slotsAtivos));
    alert("Deck salvo com sucesso!");
};

// --- INICIALIZAÇÃO ---
window.onload = render;