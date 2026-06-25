const boardElement = document.getElementById('board');
const cells = document.querySelectorAll('.cell');
const statusElement = document.getElementById('status');
const resetBtn = document.getElementById('resetBtn');

let boardState = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X"; // X = Moranguinho
let isGameActive = true;

// Nomes e ícones estilizados para a tela de status
const playerX = '🍓 Moranguinho';
const playerO = '🫐 Amora Linda';

const winningConditions = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6]             
];

function handleCellClick(e) {
    const clickedCell = e.target;
    const clickedCellIndex = parseInt(clickedCell.getAttribute('data-index'));

    if (boardState[clickedCellIndex] !== "" || !isGameActive) {
        return;
    }

    updateCell(clickedCell, clickedCellIndex);
    checkResult();
}

function updateCell(cell, index) {
    boardState[index] = currentPlayer;
    cell.textContent = currentPlayer; // Usado internamente para lógica
    cell.classList.add(currentPlayer, 'taken');
}

function changePlayer() {
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    const nextPlayerName = currentPlayer === "X" ? playerX : playerO;
    statusElement.innerHTML = `Vez da <span class="player-turn">${nextPlayerName}</span>`;
}

function checkResult() {
    let roundWon = false;
    let winningCombo = [];

    for (let i = 0; i < winningConditions.length; i++) {
        const condition = winningConditions[i];
        let a = boardState[condition[0]];
        let b = boardState[condition[1]];
        let c = boardState[condition[2]];

        if (a === '' || b === '' || c === '') {
            continue;
        }
        if (a === b && b === c) {
            roundWon = true;
            winningCombo = condition;
            break;
        }
    }

    if (roundWon) {
        const winnerName = currentPlayer === "X" ? playerX : playerO;
        statusElement.innerHTML = `🍰 <span class="player-turn">A ${winnerName} venceu! ✨</span>`;
        isGameActive = false;
        highlightWinners(winningCombo);
        return;
    }

    let roundDraw = !boardState.includes("");
    if (roundDraw) {
        statusElement.innerHTML = `🌸 <span class="player-turn">Deu velha! Vamos fazer um bolo? 🍰</span>`;
        isGameActive = false;
        return;
    }

    changePlayer();
}

function highlightWinners(combo) {
    combo.forEach(index => {
        cells[index].classList.add('winner-cell');
    });
}

function resetGame() {
    boardState = ["", "", "", "", "", "", "", "", ""];
    isGameActive = true;
    currentPlayer = "X";
    statusElement.innerHTML = `Vez da <span class="player-turn">${playerX}</span>`;
    
    cells.forEach(cell => {
        cell.textContent = "";
        cell.className = "cell"; 
    });
}

// Event Listeners
boardElement.addEventListener('click', (e) => {
    if(e.target.classList.contains('cell')) {
        handleCellClick(e);
    }
});

resetBtn.addEventListener('click', resetGame);