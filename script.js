// Elementos da Interface DOM
const setupContainer = document.getElementById('setupContainer');
const gameContainer = document.getElementById('gameContainer');
const difficultyGroup = document.getElementById('difficultyGroup');
const p2Card = document.getElementById('p2Card');
const p2Label = document.getElementById('p2Label');
const p2NameInput = document.getElementById('p2Name');
const p2FruitBadge = document.getElementById('p2FruitBadge');
const statusElement = document.getElementById('status');
const cells = document.querySelectorAll('.cell');

// Botões de Seleção
const modePvp = document.getElementById('modePvp');
const modeAi = document.getElementById('modeAi');
const p1FruitX = document.getElementById('p1FruitX');
const p1FruitO = document.getElementById('p1FruitO');
const startBtn = document.getElementById('startBtn');
const resetBtn = document.getElementById('resetBtn');
const backToHomeBtn = document.getElementById('backToHomeBtn');

// Estado do Jogo
let boardState = ["", "", "", "", "", "", "", "", ""];
let isGameActive = true;
let isAiMode = false;
let isAiThinking = false; // TRAVA DE SEGURANÇA: Impede cliques simultâneos com o Robô
let currentDifficulty = "easy"; 

let p1Symbol = "X"; // X = Morango (Começa primeiro), O = Amora
let p2Symbol = "O";
let currentPlayer = "X"; // O Morango (X) sempre inicia o tabuleiro!

let playerXName = "";
let playerOName = "";

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6]
];

// ==========================================
// SISTEMA DE EFEITOS SONOROS (AudioContext)
// ==========================================
const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

function playClickSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.12);
}

function playWinSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, index) => {
        setTimeout(() => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }, index * 100);
    });
}

function playDrawSound() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(392.00, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(261.63, audioCtx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.3);
}

// ==========================================
// LÓGICA DO TABULEIRO E SELEÇÕES
// ==========================================

modePvp.addEventListener('click', () => {
    modePvp.classList.add('active');
    modeAi.classList.remove('active');
    difficultyGroup.classList.add('hidden');
    p2Label.textContent = "Jogador 2:";
    p2NameInput.value = "Amora Linda";
    p2NameInput.disabled = false;
    isAiMode = false;
});

modeAi.addEventListener('click', () => {
    modeAi.classList.add('active');
    modePvp.classList.remove('active');
    difficultyGroup.classList.remove('hidden');
    p2Label.textContent = "Robô:";
    p2NameInput.value = "Robô Inteligente 🤖";
    p2NameInput.disabled = true;
    isAiMode = true;
});

p1FruitX.addEventListener('click', () => {
    p1FruitX.classList.add('active');
    p1FruitO.classList.remove('active');
    p1Symbol = "X";
    p2Symbol = "O";
    p2FruitBadge.textContent = "🫐 Amora";
});

p1FruitO.addEventListener('click', () => {
    p1FruitO.classList.add('active');
    p1FruitX.classList.remove('active');
    p1Symbol = "O";
    p2Symbol = "X";
    p2FruitBadge.textContent = "🍓 Morango";
});

document.querySelectorAll('.diff-grid .select-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.diff-grid .select-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        currentDifficulty = e.target.getAttribute('data-diff');
    });
});

startBtn.addEventListener('click', () => {
    const p1Name = document.getElementById('p1Name').value.trim() || "Moranguinho";
    const p2Name = p2NameInput.value.trim() || "Amora Linda";

    if (p1Symbol === "X") {
        playerXName = `🍓 ${p1Name}`;
        playerOName = `🫐 ${p2Name}`;
    } else {
        playerXName = `🍓 ${p2Name}`;
        playerOName = `🫐 ${p1Name}`;
    }

    setupContainer.classList.add('hidden');
    gameContainer.classList.remove('hidden');
    resetGame();
});

function handleCellClick(e) {
    const clickedCell = e.target.closest('.cell');
    if (!clickedCell) return;

    const index = parseInt(clickedCell.getAttribute('data-index'));

    // Proteções cruciais de validação
    if (boardState[index] !== "" || !isGameActive) return;
    if (isAiThinking) return; // Se o robô estiver calculando, o clique humano é totalmente bloqueado!
    if (isAiMode && currentPlayer === p2Symbol) return; 

    playClickSound();
    makeMove(clickedCell, index);
}

function makeMove(cell, index) {
    boardState[index] = currentPlayer;
    
    // CORREÇÃO VISUAL: Não injeta texto cru "X" ou "O" no HTML. Deixa que as classes CSS lidem com os Emojis nativos
    cell.textContent = ""; 
    cell.classList.add(currentPlayer, 'taken');

    if (checkResult()) return;

    // Alternância de turno controlada
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    updateStatusDisplay();

    if (isGameActive && isAiMode && currentPlayer === p2Symbol) {
        isAiThinking = true; // Ativa a trava de segurança
        setTimeout(aiTurn, 500);
    }
}

function updateStatusDisplay() {
    const nextName = currentPlayer === "X" ? playerXName : playerOName;
    statusElement.innerHTML = `Vez de: ${nextName}`;
}

function checkResult() {
    let roundWon = false;
    let winningCombo = [];

    for (let condition of winningConditions) {
        let a = boardState[condition[0]];
        let b = boardState[condition[1]];
        let c = boardState[condition[2]];
        if (a && a === b && b === c) {
            roundWon = true;
            winningCombo = condition;
            break;
        }
    }

    if (roundWon) {
        const winner = currentPlayer === "X" ? playerXName : playerOName;
        statusElement.innerHTML = `✨ ${winner} Venceu! ✨`;
        winningCombo.forEach(i => cells[i].classList.add('winner-cell'));
        isGameActive = false;
        isAiThinking = false;
        playWinSound();
        return true;
    }

    if (!boardState.includes("")) {
        statusElement.innerHTML = `🌸 Empate! Que tal um doce? 🍰`;
        isGameActive = false;
        isAiThinking = false;
        playDrawSound();
        return true;
    }
    return false;
}

// Lógica de Inteligência Artificial do Robô
function aiTurn() {
    if (!isGameActive) {
        isAiThinking = false;
        return;
    }

    let targetIndex;
    if (currentDifficulty === "easy") {
        targetIndex = getRandomMove();
    } else if (currentDifficulty === "medium") {
        targetIndex = Math.random() < 0.5 ? getBestMove() : getRandomMove();
    } else {
        targetIndex = getBestMove(); 
    }

    if (targetIndex !== undefined && boardState[targetIndex] === "") {
        playClickSound();
        const targetCell = document.querySelector(`.cell[data-index="${targetIndex}"]`);
        
        isAiThinking = false; // Desativa a trava segundos antes de disparar o movimento
        makeMove(targetCell, targetIndex);
    } else {
        isAiThinking = false;
    }
}

function getRandomMove() {
    let empties = boardState.map((v, i) => v === "" ? i : null).filter(v => v !== null);
    return empties[Math.floor(Math.random() * empties.length)];
}

function getBestMove() {
    let bestScore = -Infinity;
    let move;
    for (let i = 0; i < 9; i++) {
        if (boardState[i] === "") {
            boardState[i] = p2Symbol;
            let score = minimax(boardState, 0, false);
            boardState[i] = "";
            if (score > bestScore) {
                bestScore = score;
                move = i;
            }
        }
    }
    return move;
}

function minimax(state, depth, isMaximizing) {
    let scores = { [p2Symbol]: 10, [p1Symbol]: -10, tie: 0 };
    let result = evaluateBoard(state);
    if (result !== null) return scores[result];

    if (isMaximizing) {
        let bestScore = -Infinity;
        for (let i = 0; i < 9; i++) {
            if (state[i] === "") {
                state[i] = p2Symbol;
                let score = minimax(state, depth + 1, false);
                state[i] = "";
                bestScore = Math.max(score, bestScore);
            }
        }
        return bestScore;
    } else {
        let bestScore = Infinity;
        for (let i = 0; i < 9; i++) {
            if (state[i] === "") {
                state[i] = p1Symbol;
                let score = minimax(state, depth + 1, true);
                state[i] = "";
                bestScore = Math.min(score, bestScore);
            }
        }
        return bestScore;
    }
}

function evaluateBoard(state) {
    for (let condition of winningConditions) {
        let [a, b, c] = condition;
        if (state[a] && state[a] === state[b] && state[a] === state[c]) return state[a];
    }
    if (!state.includes("")) return "tie";
    return null;
}

function resetGame() {
    boardState = ["", "", "", "", "", "", "", "", ""];
    isGameActive = true;
    isAiThinking = false;
    currentPlayer = "X"; // Volta para o Morango (X) reiniciar
    updateStatusDisplay();
    cells.forEach(cell => {
        cell.textContent = "";
        cell.className = "cell";
    });
    if (isAiMode && currentPlayer === p2Symbol) {
        isAiThinking = true;
        setTimeout(aiTurn, 500);
    }
}

function backToHome() {
    boardState = ["", "", "", "", "", "", "", "", ""];
    isGameActive = true;
    isAiThinking = false;
    currentPlayer = "X";
    cells.forEach(cell => {
        cell.textContent = "";
        cell.className = "cell";
    });
    gameContainer.classList.add('hidden');
    setupContainer.classList.remove('hidden');
}

document.getElementById('board').addEventListener('click', handleCellClick);
resetBtn.addEventListener('click', resetGame);
backToHomeBtn.addEventListener('click', backToHome);