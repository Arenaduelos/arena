const nomeUsuario = localStorage.getItem("usuarioLogado");
if (!nomeUsuario) {
    window.location.href = "index.html";
}

let moedas = parseInt(localStorage.getItem(`moedas_${nomeUsuario}`)) || 0;
let nivel = parseInt(localStorage.getItem(`nivel_${nomeUsuario}`)) || 1;
let inventario = JSON.parse(localStorage.getItem(`deck_inventory_${nomeUsuario}`)) || [];

const CATALOGO = {
    1: [
        { nome: "Planta 1", imagem: "imagens/plantas/planta1.jpg", preco: 1000, atk: 500, def: 400, tipo: "monstro" },
        { nome: "Planta 2", imagem: "imagens/plantas/planta2.jpg", preco: 2000, atk: 600, def: 450, tipo: "monstro" },
        { nome: "Planta 3", imagem: "imagens/plantas/planta3.jpg", preco: 3000, atk: 700, def: 500, tipo: "monstro" },
        { nome: "Planta 4", imagem: "imagens/plantas/planta4.jpg", preco: 4000, atk: 800, def: 550, tipo: "monstro" },
        { nome: "Planta 5", imagem: "imagens/plantas/planta5.jpg", preco: 5000, atk: 900, def: 600, tipo: "monstro" }
    ],
    2: [
        { nome: "Inseto 1", imagem: "imagens/insetos/inseto1.jpg", preco: 5000, atk: 600, def: 650, tipo: "monstro" },
        { nome: "Inseto 2", imagem: "imagens/insetos/inseto2.jpg", preco: 6000, atk: 750, def: 700, tipo: "monstro" },
        { nome: "Inseto 3", imagem: "imagens/insetos/inseto3.jpg", preco: 7000, atk: 850, def: 750, tipo: "monstro" },
        { nome: "Inseto 4", imagem: "imagens/insetos/inseto4.jpg", preco: 8000, atk: 900, def: 800, tipo: "monstro" },
        { nome: "Inseto 5", imagem: "imagens/insetos/inseto5.jpg", preco: 10000, atk: 1000, def: 850, tipo: "monstro" }
    ],
    3: [
        { nome: "Guerreiro 1", imagem: "imagens/guerreiros/guerreiro1.jpg", preco: 10000, atk: 1050, def: 860, tipo: "monstro" },
        { nome: "Guerreiro 2", imagem: "imagens/guerreiros/guerreiro2.jpg", preco: 12000, atk: 1100, def: 870, tipo: "monstro" },
        { nome: "Guerreiro 3", imagem: "imagens/guerreiros/guerreiro3.jpg", preco: 15000, atk: 1150, def: 880, tipo: "monstro" },
        { nome: "Guerreiro 4", imagem: "imagens/guerreiros/guerreiro4.jpg", preco: 18000, atk: 1200, def: 890, tipo: "monstro" },
        { nome: "Guerreiro 5", imagem: "imagens/guerreiros/guerreiro5.jpg", preco: 20000, atk: 1250, def: 900, tipo: "monstro" }
    ],
    4: [
        { nome: "Orc 1", imagem: "imagens/orcs/orc1.jpg", preco: 20000, atk: 1200, def: 950, tipo: "monstro" },
        { nome: "Orc 2", imagem: "imagens/orcs/orc2.jpg", preco: 25000, atk: 1300, def: 960, tipo: "monstro" },
        { nome: "Orc 3", imagem: "imagens/orcs/orc3.jpg", preco: 30000, atk: 1400, def: 980, tipo: "monstro" },
        { nome: "Orc 4", imagem: "imagens/orcs/orc4.jpg", preco: 35000, atk: 1500, def: 990, tipo: "monstro" },
        { nome: "Orc 5", imagem: "imagens/orcs/orc5.jpg", preco: 40000, atk: 1600, def: 1000, tipo: "monstro" }
    ],
    5: [
        { nome: "Troll 1", imagem: "imagens/trolls/troll1.jpg", preco: 40000, atk: 1700, def: 1010, tipo: "monstro" },
        { nome: "Troll 2", imagem: "imagens/trolls/troll2.jpg", preco: 45000, atk: 1800, def: 1020, tipo: "monstro" },
        { nome: "Troll 3", imagem: "imagens/trolls/troll3.jpg", preco: 50000, atk: 1900, def: 1030, tipo: "monstro" },
        { nome: "Troll 4", imagem: "imagens/trolls/troll4.jpg", preco: 55000, atk: 2000, def: 1040, tipo: "monstro" },
        { nome: "Troll 5", imagem: "imagens/trolls/troll5.jpg", preco: 60000, atk: 2100, def: 1050, tipo: "monstro" }
    ],
    6: [
        { nome: "Ogro 1", imagem: "imagens/ogros/ogro1.jpg", preco: 60000, atk: 2200, def: 1500, tipo: "monstro" },
        { nome: "Ogro 2", imagem: "imagens/ogros/ogro2.jpg", preco: 70000, atk: 2300, def: 1600, tipo: "monstro" },
        { nome: "Ogro 3", imagem: "imagens/ogros/ogro3.jpg", preco: 80000, atk: 2400, def: 1900, tipo: "monstro" },
        { nome: "Ogro 4", imagem: "imagens/ogros/ogro4.jpg", preco: 90000, atk: 2500, def: 1660, tipo: "monstro" },
        { nome: "Ogro 5", imagem: "imagens/ogros/ogro5.jpg", preco: 100000, atk: 2600, def: 1700, tipo: "monstro" }
    ],
    7: [
        { nome: "Fada 1", imagem: "imagens/fadas/fada1.jpg", preco: 100000, atk: 2700, def: 1750, tipo: "monstro" },
        { nome: "Fada 2", imagem: "imagens/fadas/fada2.jpg", preco: 120000, atk: 2800, def: 1760, tipo: "monstro" },
        { nome: "Fada 3", imagem: "imagens/fadas/fada3.jpg", preco: 140000, atk: 2900, def: 2000, tipo: "monstro" },
        { nome: "Fada 4", imagem: "imagens/fadas/fada4.jpg", preco: 160000, atk: 3000, def: 1900, tipo: "monstro" },
        { nome: "Fada 5", imagem: "imagens/fadas/fada5.jpg", preco: 180000, atk: 3100, def: 1950, tipo: "monstro" }
    ],
    8: [
        { nome: "Dragão 1", imagem: "imagens/dragoes/dragao1.jpg", preco: 200000, atk: 3200, def: 2000, tipo: "monstro" },
        { nome: "Dragão 2", imagem: "imagens/dragoes/dragao2.jpg", preco: 220000, atk: 3400, def: 2500, tipo: "monstro" },
        { nome: "Dragão 3", imagem: "imagens/dragoes/dragao3.jpg", preco: 240000, atk: 3500, def: 4000, tipo: "monstro" },
        { nome: "Dragão 4", imagem: "imagens/dragoes/dragao4.jpg", preco: 260000, atk: 3600, def: 2650, tipo: "monstro" },
        { nome: "Dragão 5", imagem: "imagens/dragoes/dragao5.jpg", preco: 280000, atk: 3700, def: 2670, tipo: "monstro" }
    ],
    9: [
        { nome: "Mago 1", imagem: "imagens/magos/mago1.jpg", preco: 300000, atk: 3800, def: 2700, tipo: "monstro" },
        { nome: "Mago 2", imagem: "imagens/magos/mago2.jpg", preco: 320000, atk: 3900, def: 2750, tipo: "monstro" },
        { nome: "Mago 3", imagem: "imagens/magos/mago3.jpg", preco: 340000, atk: 4000, def: 3000, tipo: "monstro" },
        { nome: "Mago 4", imagem: "imagens/magos/mago4.jpg", preco: 360000, atk: 4100, def: 2850, tipo: "monstro" },
        { nome: "Mago 5", imagem: "imagens/magos/mago5.jpg", preco: 380000, atk: 4200, def: 3000, tipo: "monstro" }
    ],
    10: [
        { nome: "Ceifeiro 1", imagem: "imagens/mortes/morte1.jpg", preco: 400000, atk: 4300, def: 3100, tipo: "monstro" },
        { nome: "Ceifeiro 2", imagem: "imagens/mortes/morte2.jpg", preco: 420000, atk: 4500, def: 3200, tipo: "monstro" },
        { nome: "Ceifeiro 3", imagem: "imagens/mortes/morte3.jpg", preco: 440000, atk: 4600, def: 4500, tipo: "monstro" },
        { nome: "Ceifeiro 4", imagem: "imagens/mortes/morte4.jpg", preco: 460000, atk: 4700, def: 3400, tipo: "monstro" },
        { nome: "Ceifeiro 5", imagem: "imagens/mortes/morte5.jpg", preco: 480000, atk: 4800, def: 3500, tipo: "monstro" }
    ],
    11: [
        { nome: "Sacrifício 1", imagem: "imagens/sacrificios/sacrificio1.jpg", preco: 1000000, atk: 5000, def: 4500, tipo: "monstro", sacrifio: 2 },
        { nome: "Sacrifício 2", imagem: "imagens/sacrificios/sacrificio2.jpg", preco: 2000000, atk: 5100, def: 4600, tipo: "monstro", sacrifio: 2 },
        { nome: "Sacrifício 3", imagem: "imagens/sacrificios/sacrificio3.jpg", preco: 3000000, atk: 5200, def: 4700, tipo: "monstro", sacrifio: 2 },
        { nome: "Sacrifício 4", imagem: "imagens/sacrificios/sacrificio4.jpg", preco: 4000000, atk: 5300, def: 4800, tipo: "monstro", sacrifio: 2 },
        { nome: "Sacrifício 5", imagem: "imagens/sacrificios/sacrificio5.jpg", preco: 5000000, atk: 5400, def: 4900, tipo: "monstro", sacrifio: 2 }
    ]
};

let nivelFiltro = 1;
let cartaParaComprar = null;

function atualizarStats() {
    const el = document.getElementById("statsJogador");
    if (el) {
        el.innerHTML = `
            <div class="stat-item" title="Nível Atual">
                <span>⭐</span> <span>${nivel}</span>
            </div>
            <div class="stat-item" title="Minhas Moedas">
                <span>💰</span> <span>${moedas.toLocaleString()}</span>
            </div>
            <div class="stat-item" title="Total de Cartas no Inventário">
                <span>🎴</span> <span>${inventario.length}</span>
            </div>
        `;
    }
}

// --- FUNÇÃO AUXILIAR PARA SONS ---
function tocarSom(caminho) {
    const audio = new Audio(caminho);
    audio.play().catch(e => console.log("Erro ao tocar som:", e));
}

// --- SOM DE HOVER GLOBAL ---
function configurarHoverSons() {
    document.body.addEventListener("mouseover", (e) => {
        const target = e.target.closest(".carta-deck, .item-loja, .toolbar-btn");
        if (target) {
            tocarSom("efeitosonoros/carta.ogg");
        }
    });
}
configurarHoverSons();

function filtrarNivel(nv) {
    nivelFiltro = parseInt(nv);
    const select = document.getElementById("selectNivel");
    if (select) select.value = nv;
    renderLoja();
}

function renderLoja() {
    const grid = document.getElementById("lojaGrid");
    grid.innerHTML = "";
    
    CATALOGO[nivelFiltro].forEach(item => {
        const card = document.createElement("div");
        card.className = "carta-deck loja-card";
        card.onclick = () => abrirModalCompra(item);
        
        const infoStats = (item.tipo !== "especial")
            ? `<div class="stats-mini"><span class="atk-text">⚔️ ${item.atk}</span><span class="def-text">🛡️ ${item.def}</span></div>`
            : `<div class="stats-mini"><span style="color:#666; font-weight:bold;">✨ ESPECIAL</span></div>`;

        card.innerHTML = `
            <img loading="lazy" src="${item.imagem}">
            <div class="info-carta">${item.nome}</div>
            ${infoStats}
            <div class="card-price-tag">💰 ${item.preco.toLocaleString()}</div>
        `;
        grid.appendChild(card);
    });
}

function abrirModalCompra(item) {
    cartaParaComprar = item;
    const modal = document.getElementById("modalCompra");
    const info = document.getElementById("infoCartaCompra");
    
    info.innerHTML = `
        <img src="${item.imagem}" style="width:120px; border-radius:5px; margin-bottom:10px; border:4px solid #3d2b1f;">
        <p style="font-weight:bold; font-size:1.2rem; margin:10px 0;">${item.nome}</p>
        <div class="card-price-tag" style="width:auto; display:inline-block; margin-bottom:15px;">💰 ${item.preco.toLocaleString()}</div>
        <p style="font-size: 0.9rem; color: ${moedas >= item.preco ? '#2ecc71' : '#b22222'}; font-weight:bold;">
            Seu saldo: 💰 ${moedas.toLocaleString()}
        </p>
    `;
    
    const btnConfirmar = document.getElementById("btnConfirmar");
    btnConfirmar.disabled = moedas < item.preco;
    btnConfirmar.style.opacity = moedas < item.preco ? "0.5" : "1";
    btnConfirmar.onclick = comprarCarta;
    
    modal.style.display = "flex";
}

function fecharModalCompra() {
    document.getElementById("modalCompra").style.display = "none";
    cartaParaComprar = null;
}

function comprarCarta() {
    if (!cartaParaComprar || moedas < cartaParaComprar.preco) return;
    
    moedas -= cartaParaComprar.preco;
    localStorage.setItem(`moedas_${nomeUsuario}`, moedas);
    
    const novaCarta = {
        nome: cartaParaComprar.nome,
        imagem: cartaParaComprar.imagem,
        tipo: cartaParaComprar.tipo
    };
    
    if (cartaParaComprar.tipo === "monstro") {
        novaCarta.ataque = cartaParaComprar.atk;
        novaCarta.defesa = cartaParaComprar.def;
        if (cartaParaComprar.sacrifio) novaCarta.sacrifio = cartaParaComprar.sacrifio;
    }
    
    inventario.push(novaCarta);
    localStorage.setItem(`deck_inventory_${nomeUsuario}`, JSON.stringify(inventario));
    
    atualizarStats();
    fecharModalCompra();
    alert(`Compra realizada com sucesso! ${novaCarta.nome} foi adicionado ao seu inventário.`);
}

window.onload = () => {
    atualizarStats();
    renderLoja();
};