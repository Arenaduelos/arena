/* === js/main.js === */

// Variáveis de Estado Globais
let vidaJogador = 5000, vidaOponente = 5000;
let turnoAtual = "";
let jaInvocouMonstro = false;
let jaComprouCarta = false;
let primeiroTurnoDoJogo = true;

let monstrosJogador = [null, null, null], especiaisJogador = [null, null, null];
let monstrosOponente = [null, null, null], especiaisOponente = [null, null, null];
let cemiterioJogador = [], cemiterioOponente = [];

const usuario = localStorage.getItem("usuarioLogado") || "Duelista";
let save = JSON.parse(localStorage.getItem(`save_${usuario}`)) || {
    moedas: 0,
    vitorias: 0,
    nivel: 1,
    vitsNoNivel: 0,
    inventario: []
};

let nivelAtual = save.nivel;
let meuDeck = JSON.parse(localStorage.getItem(`deck_build_${usuario}`)) || [];
let deckOponente = []; 
let minhaMao = [], maoOponente = [];

// Inicialização
window.onload = () => {
    carregarJogo();
    
    const nomeUserEl = document.getElementById("nomeUser");
    if (nomeUserEl) nomeUserEl.innerText = usuario;
    
    const modalRoleta = document.getElementById("modalRoleta");
    if (modalRoleta) modalRoleta.style.display = "flex";

    // Adiciona Event Listeners
    const btnPassarTurno = document.getElementById("btnPassarTurno");
    if (btnPassarTurno) btnPassarTurno.addEventListener("click", passarTurno);

    const btnComprar = document.getElementById("btnComprar");
    if (btnComprar) btnComprar.addEventListener("click", () => comprarCarta("jogador"));

    const btnGirar = document.getElementById("btnGirar");
    if (btnGirar) btnGirar.addEventListener("click", girarRoleta);

    const logHeader = document.querySelector(".log-header");
    if (logHeader) logHeader.addEventListener("click", toggleLog);

    const btnFecharModal = document.querySelector("#modalPosicao .modal-content button");
    if (btnFecharModal) btnFecharModal.addEventListener("click", fecharModal);
};

function toggleLog() {
    const conteudo = document.getElementById("logConteudo");
    const icon = document.getElementById("logToggleIcon");
    if (!conteudo || !icon) return;
    const aberto = conteudo.style.display !== "none";
    conteudo.style.display = aberto ? "none" : "block";
    icon.textContent = aberto ? "▲" : "▼";
}

// Sistema de Save Unificado
function salvarJogo() {
    save.nivel = nivelAtual;
    localStorage.setItem(`save_${usuario}`, JSON.stringify(save));
    
    // Mantemos compatibilidade com outros scripts por enquanto
    localStorage.setItem(`moedas_${usuario}`, save.moedas);
    localStorage.setItem(`vitorias_${usuario}`, save.vitorias);
    localStorage.setItem(`nivel_${usuario}`, save.nivel);
    localStorage.setItem(`vits_no_nivel_${usuario}`, save.vitsNoNivel);
}

function carregarJogo() {
    const saveStr = localStorage.getItem(`save_${usuario}`);
    if (saveStr) {
        save = JSON.parse(saveStr);
        nivelAtual = save.nivel;
    } else {
        // Se não tem save, tenta migrar dados antigos
        save.moedas = parseInt(localStorage.getItem(`moedas_${usuario}`)) || 0;
        save.vitorias = parseInt(localStorage.getItem(`vitorias_${usuario}`)) || 0;
        save.nivel = parseInt(localStorage.getItem(`nivel_${usuario}`)) || 1;
        save.vitsNoNivel = parseInt(localStorage.getItem(`vits_no_nivel_${usuario}`)) || 0;
        save.inventario = JSON.parse(localStorage.getItem(`deck_inventory_${usuario}`)) || [];
        salvarJogo();
    }
}