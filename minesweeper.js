/**
 * MINESWEEPER
 * User chooses n size of board (n x n)
 * Mines: 20% of total boxes
 * 
 * Two boards:
 * logicBoard    =>  values generated at the beginning
 * visualPlayerBoard  => HTML with JS mouse listeners
 * 
 * Values generated in logicBoard:
 * -1   =   mine
 * 0    =   non-adjacent
 * 1...8   =   adjacent
 * 
 * User-oriented text is in the target language.
 * console.debug's are in English (viewed with Debugger enabled in browser).
 * 
 * Using data- attributes in HTML:
 * https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes
 */


/* ------------------------------------------------------------------------------------------------------------------------------
 * Variables and Listeners
 * ------------------------------------------------------------------------------------------------------------------------------ */
var logicBoard = [[]];
const visualPlayerBoard = document.getElementById("visualBoard");
let boardSize = 0;

let numberOfMines = 0;
let numberOfBoxesGenerated = 0;
let numberOfBoxesToReveal = 0;
let numberOfBoxesRevealed = 0;

let inputIsValid;

var mineCoordenates = []; // var so that it can be used seamlessly in a couple of functions

const replayButton = document.getElementById("replayButton");

/* ---------------
 * Initial Input
 * --------------- */
   
do {
    inputIsValid = false;

    boardSize = parseInt(prompt(`- BUSCAMINAS -\nIntroduce un número para determinar los dos lados del tablero (p. ej., 5 para un 5x5):`));
    
    if (isNaN(boardSize)) alert(`ERROR: Introduce un número en dígitos.`);
    else if (boardSize < 4) alert(`ERROR: Debe ser como mínimo de 4x4.`);
    else inputIsValid = true;
} while (!inputIsValid);

numberOfMines = parseInt(boardSize * 0.2);
if (numberOfMines < 1) numberOfMines = 1; // In case that parseInt returns 0

numberOfBoxesGenerated = boardSize * boardSize;
numberOfBoxesToReveal = numberOfBoxesGenerated - numberOfMines; // To check if the player has won

alert(`Se creará un tablero ${boardSize}x${boardSize} con ${numberOfMines} ` + ((numberOfMines === 1) ? "mina." : "minas."));
console.debug(`Number of mines: ${numberOfMines}`);


/* ----------------------
 * Generation of Boards
 * ---------------------- */

// Logic board
logicBoard = generateLogicBoard(boardSize, "0");
placeMines(logicBoard, boardSize, numberOfMines);
console.debug(`Logic board generated:`);
console.table(logicBoard);
console.debug(`=====`);

// Visual HTML board
generateVisualPlayerBoard(boardSize);
console.debug(`Visual player board generated:`);
console.log(visualPlayerBoard);
console.debug(`=====`);

/* --------------
 * Playing!
 * -------------- */
window.onload = function() {
    visualPlayerBoard.addEventListener("click", handleLeftClick);
    visualPlayerBoard.addEventListener("contextmenu", handleRightClick); 
    visualPlayerBoard.addEventListener("dblclick", handleDoubleClick);

    replayButton.addEventListener("click", playAgain);
}

/* ------------------------------------------------------------------------------------------------------------------------------
 * Functions (more or less in order of usage)
 * ------------------------------------------------------------------------------------------------------------------------------ */

function generateLogicBoard(size, emptyChar) {
    let brd = [];

    for (i = 0; i < size; i++) {
        brd[i] = []; // Create row

        for (j = 0; j < size; j++) brd[i][j] = emptyChar; // Create empty row x column
    }
    
    return brd;
}

function placeMines(logicBoard, boardSize, numberOfMines) {
    /*
     * Create random [row, col] coordenates,
     * store them in function-level array to track them and avoid repetitions,
     * and add each new mine to the logic board
     */
    
    let coord; // = [row, col]
    let row = -1;
    let col = -1;
    let coordIsNew;

    for (m = 0; m < numberOfMines; m++) {
        do {
            coordIsNew = true;

            row = getRandomCoordinate(0, boardSize-1); // e.g. boardSize = 10 => Possible results are 0...9
            col = getRandomCoordinate(0, boardSize-1);
            coord = [row, col];

            for (i = 0; i < mineCoordenates.length && coordIsNew; i++) {
                if (coord === mineCoordenates[i]) coordIsNew = false;
            }
        } while (!coordIsNew);

        // Add to coord array
        mineCoordenates.push(coord);
        console.debug(`Coordinates so far: ${mineCoordenates}`);

        // Add mine
        logicBoard[row][col] = "-1";
        
        /*
         * Update adjacent boxes: try every possible one (but accounting for borders)
         * · · ·
         * · * ·
         * · · ·
         * WIP: Teacher's recommendation on 2025/11/10: Do this part in a separate function executed at the same hierarchical for better memory efficiency
         */

        console.debug(`Updating adjacents of mine [${row}][${col}]`);
        for (i = row-1; i <= row+1; i++) {
            if (i < 0 || i >= boardSize) continue;

            for (j = col-1; j <= col+1; j++) {
                if (j < 0 || j >= boardSize) continue;
                else if (i == row && j == col) continue;
                else updateLogicalAdjacentBoxes(logicBoard, i, j);
            }
        }
        console.debug(`Finished placing mine [${row}][${col}]`)
    }

    console.debug(`Aaand that was the last mine`)
    console.debug(`=====`);
}

function getRandomCoordinate(min, max) {
    return Math.floor(Math.random() * (max + 1));
}

function updateLogicalAdjacentBoxes(logicBoard, r, c) {
    if (logicBoard[r][c] !== -1) {
        logicBoard[r][c]++;
        console.debug(`Adjacent [${r}][${c}] updated`)
    } else console.debug(`Adjacent [${r}][${c}] is another mine`);
}

function generateVisualPlayerBoard(boardSize) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");

    // Generate rows (TRs)
    for (rowIndex = 0; rowIndex < boardSize; rowIndex++) {
        /*
         * If appendChild(row) is used as is, it only ever creates one row even in a loop.
         * To append several children, add cloneNode(true): https://stackoverflow.com/a/12730905
         */

        visualPlayerBoard.appendChild(row.cloneNode(true));

        let currentRow = visualPlayerBoard.lastChild;

        // Generate cells (TDs) for each row
        for (cellIndex = 0; cellIndex < boardSize; cellIndex++) {
            currentRow.appendChild(cell.cloneNode(true));
            
            let currentCell = currentRow.lastChild;
            currentCell.setAttribute("data-row", rowIndex);
            currentCell.setAttribute("data-column", cellIndex);
        }
    }
}

function handleLeftClick(leftClick) {
    // IF to avoid runtime conflict with doubleClick and avoid more than one reveal per cell
    if (!leftClick.target.classList.contains("flagged") && !leftClick.target.classList.contains("revealed")) {
        revealBox(leftClick);
        if (!playerCanKeepPlaying()) endGame(true);
    }
}

function handleRightClick(rightClick) { 
    rightClick.preventDefault(); // Prevents context menu from appearing (it's cumbersome)
    placeFlag(rightClick);
}

function handleDoubleClick(doubleClick) {
    removeFlag(doubleClick);
}

function playAgain() {
    location.reload(); // Refresh page (F5)
}

function blockBoard() {
    // Both when losing and when winning
    visualPlayerBoard.removeEventListener("click", handleLeftClick);
    visualPlayerBoard.removeEventListener("contextmenu", handleRightClick); 
    visualPlayerBoard.removeEventListener("dblclick", handleDoubleClick);
    console.debug(`Board blocked`);
}

function endGame(playerWins) {
    revealAllMines(playerWins);
    blockBoard();
    addFinalMessage(playerWins);
    showReplayButton();
}

function revealBox(leftClick) {
    const box = leftClick.target;
    const row = box.getAttribute("data-row");
    const col = box.getAttribute("data-column");
    const equivalentLogicCell = checkLogicCell(row, col);

    box.classList.add("revealed");
    numberOfBoxesRevealed++;
    console.debug(`Class of cell [${row}][${col}] changed to 'revealed'`);
    console.debug(`Number of boxes revealed: ${numberOfBoxesRevealed} (total boxes to reveal: ${numberOfBoxesToReveal})`);

    if (equivalentLogicCell == -1) {
        box.classList.add("bombed");

        endGame(false);
        
    } else {
        if (equivalentLogicCell == 0) {
            // Reveal box by box
            box.innerHTML = "";
            console.debug(`Empty cell revealed`);

            // Reveal all empty adjacent boxes (unfinished...)
            // showEmptyAdjacentBoxes(logicBoard, playerBoard, row, col);
        } else {
            box.innerHTML = `<p>${equivalentLogicCell}</p>`;
            console.warn(`Number cell revealed`);
        }
    }

    console.debug(`=====`);
}

function revealAllMines(playerWins) {
    /**
     * Uses var mineCoordenates[]
     * Each coord in mineCoordenates[] is coord = [row, col]
     * 
     * Goes through each coord and reveals the corresponding cell in the visualPlayerBoard
     */

    let row = 0;
    let col = 0;
    let mineBox;
    let coord;

    for (let i = 0; i < mineCoordenates.length; i++) {
        coord = mineCoordenates[i];
        row = coord[0];
        col = coord[1];

        mineBox = visualPlayerBoard.querySelector(`[data-row="${row}"][data-column="${col}"]`);
        mineBox.classList.add("revealed");

        if (playerWins) mineBox.classList.add("flowered");
        else mineBox.classList.add("bombed");
        
        console.debug(`Mine box [${row}][${col}] revealed: ${mineBox}`);
    }
}

function playerCanKeepPlaying() {
    if (numberOfBoxesRevealed >= numberOfBoxesToReveal) return false;
    else return true;
}

function checkLogicCell(row, col) {
    if (logicBoard[row][col] == -1) return -1;
    else if (logicBoard[row][col] == 0) return 0;
    else return parseInt(logicBoard[row][col]);
}

function placeFlag(rightClick) {
    if (!rightClick.target.classList.contains("flagged")
    && !rightClick.target.classList.contains("revealed")) {
        rightClick.target.classList.add("flagged");

        console.debug("Box flagged");
        console.debug(`=====`);
    }
}

function removeFlag(doubleClick) {
    if (doubleClick.target.classList.contains("flagged")) {
        doubleClick.target.innerHTML = "";
        doubleClick.target.classList.remove("flagged");

        console.debug("Box un-flagged");
        console.debug(`=====`);
    }
}

function addFinalMessage(playerWins) {
    const finalMessage = document.getElementById("finalMessage");
    let message = "";
    let style = "";

    if (playerWins) {
        message = "¡HAS GANADO!";
        style = "wins";
        console.info(`PLAYER WINS :)`);
    } else {
        message = "¡BUM! SE ACABÓ EL JUEGO";
        style = "loses";
        console.error(`PLAYER LOSES :(`);
    }

    finalMessage.innerHTML = `<p>${message}</p>`;
    finalMessage.classList.add(style);
}

function showReplayButton() {
    const replayButton = document.getElementById("replayButton");
    replayButton.style.visibility = "visible";
}



