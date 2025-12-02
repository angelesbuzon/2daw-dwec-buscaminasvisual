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
 * User-oriented text is in the target language
 * console.debug's are in English (viewed with Debugger enabled in browser)
 * 
 * Use data- attributes in HTML:
 * https://developer.mozilla.org/en-US/docs/Web/HTML/How_to/Use_data_attributes
 */


/* ------------------------------------------------------------------------------------------------------------------------------
 * Variables and Listeners
 * ------------------------------------------------------------------------------------------------------------------------------ */
var logicBoard = [[]];
const visualPlayerBoard = document.getElementById("visualBoard");
let boardSize = 0;
let numberOfMines = 0;
let inputIsValid;
var playing = true;

/* ---------------
    Initial Input
   --------------- */
   
do {
    inputIsValid = false;

    boardSize = parseInt(prompt(`- BUSCAMINAS -\nIntroduce un número para determinar los dos lados del tablero (p. ej., 5 para un 5x5):`));
    
    if (isNaN(boardSize)) alert(`ERROR: Introduce un número en dígitos.`);
    else if (boardSize < 4) alert(`ERROR: Debe ser como mínimo de 4x4.`);
    else inputIsValid = true;
} while (!inputIsValid);

numberOfMines = parseInt(boardSize * 0.2);
if (numberOfMines < 1) numberOfMines = 1; // In case that parseInt returns 0

alert(`Se creará un tablero ${boardSize}x${boardSize} con ${numberOfMines} ` + ((numberOfMines === 1) ? "mina." : "minas."));
console.debug(`Number of mines: ${numberOfMines}`);


/* ----------------------
    Generation of Boards
   ---------------------- */
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

/*
// Grid/matrix based on visual HTML board to compare logic board with
let grid = visualPlayerBoard.getElementsByTagName("tr");
grid = Array.from(grid);
for (let i = 0; i < grid.length; i++) {
    grid[i] = grid[i].getElementsByTagName("td");
}
console.debug(`Grid generated:`);
console.table(grid);
console.debug(`=====`);
*/

/* --------------
    Ready, set...
   -------------- */
window.onload = function() {
    // WIP:
    // - Crear funciones

    visualPlayerBoard.addEventListener("click", e => revealBox(e)); // WIP (a ver cómo hago el match con el logicBoard primero)
    visualPlayerBoard.addEventListener("contextmenu", e => placeFlag(e)); 
    visualPlayerBoard.addEventListener("dblclick", e => removeFlag(e)); // WIP

    // WIP Ojo: cuando pierda/gane, usar removeEventListener donde sea
}

/* -------
    Go!
   ------- */
//play(logicBoard, playerBoard);


/* ------------------------------------------------------------------------------------------------------------------------------
 * Functions: Visual HTML
 * ------------------------------------------------------------------------------------------------------------------------------ */

function revealBox(leftClick) {
    // elemento.getAttribute("nombreAtributo")
    const row = target.getAttribute("data-row");
    const col = target.getAttribute("data-column");

    const equivalentLogicCell = checkLogicCell(row, col);

    if (equivalentLogicCell == -1) {
        leftClick.target.innerHTML = "<p>💣</p>";
        console.error(`BOOM! GAME OVER`);
        // WIP: en vez de playing false usar removeListener seguramente
        playing = false;
    } else if (equivalentLogicCell == 0) {
        // Reveal box by box
        leftClick.target.innerHTML = "<p>💣</p>";
        console.debug(`Empty cell revealed`);

        // Reveal all empty adjacent boxes (unfinished...)
        // showEmptyAdjacentBoxes(logicBoard, playerBoard, row, col);
    } else {
        leftClick.target.innerHTML = `<p>${equivalentLogicCell}</p>`;
        console.warn(`Number cell revealed`);
    }

    leftClick.target.classList.add("revealed");
    console.debug(`Class of revealed td changed to 'revealed'`);
    console.debug(`=====`);
}

function checkLogicCell(row, col) {
    if (logicBoard[row][col] == -1) {
        //playerBoard[row][col] = "*";
        return -1;
        
    } else if (logicBoard[row][col] == 0) {
        // playerBoard[row][col] = " ";
        return 0;

    } else {
        //playerBoard[row][col] = logicBoard[row][col];
        return parseInt(logicBoard[row][col]);
    }
}

function placeFlag(rightClick) {
    if (rightClick.target.classList.contains("flagged")) {
        rightClick.target.innerHTML = "";
        rightClick.target.classList.remove("flagged");
        console.debug("Box un-flagged");
    } else {
        rightClick.target.innerHTML = "<p>🚩</p>";
        rightClick.target.classList.add("flagged");
        console.debug("Box flagged");
    }

    console.debug(`=====`);
}

function generateVisualPlayerBoard(size) {
    const newRow = document.createElement("tr");
    const newCell = document.createElement("td");

    // Generate rows (TRs)
    for (i = 0; i < size; i++) {
        /*
         * If appendChild(newRow) is used as is, it only ever creates one newRow even in a loop
         * To append several children, add cloneNode(true): https://stackoverflow.com/a/12730905
         */

        visualPlayerBoard.appendChild(newRow.cloneNode(true));

        let currentRow = visualPlayerBoard.lastChild;

        // Generate cells (TDs) for each row
        for (j = 0; j < size; j++) {
            currentRow.appendChild(newCell.cloneNode(true));
            
            let currentCell = currentRow.lastChild;
            //element.setAttribute("name", "value");
            currentCell.setAttribute("data-row", i);
            currentCell.setAttribute("data-column", j);
        }
    }
}



/* ------------------------------------------------------------------------------------------------------------------------------
    Functions: Internal Logic
   ------------------------------------------------------------------------------------------------------------------------------ */
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
    
    let mineCoordenates = [];
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
         * Teacher's recommendation on 2025/11/10: Do this part in a separate function executed at the same hierarchical for better memory efficiency
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

/* Unused for the time being:
function showEmptyAdjacentBoxes(logicBoard, playerBoard, row, col) {
    playerBoard[row][col] = " "; // To distinguish from non-touched cells

    for (i = row-1; i <= row+1; i++) {
        if (i < 0 || i >= logicBoard.length) continue; // Skip to next iteration if we are in a row border

        for (j = col-1; j <= col+1; j++) {
            // Using == instead of === sometimes to account for num/string

            // Skip...
            if (j < 0 || j >= logicBoard[i].length) continue; // ... if we are in a column border
            else if (i === row && j === col) continue; // ... if we are in this very same cell
            else if (logicBoard[i][j] == -1) continue; // ... if it's a mine
            else if (playerBoard[i][j] !== "x") continue; // ... if it's already revealed

            // Go on:
            else if (logicBoard[i][j] == 0) showEmptyAdjacentBoxes(logicBoard, playerBoard, i, j); // Recursion
            else playerBoard[i][j] = logicBoard[i][j]; // Show numeric flag and stop iteration
            
        }
    }
}
*/

/* DEPRECATED:
WIP Cambiar esto para el juego visual en HTML
function play(logicBoard, playerBoard) {
    
    let playing = true;
    let row, col;
    let round = 0;

    console.info(`=== BUSCAMINAS ===`);
    console.table(playerBoard); // First instance, with no values shown

    while (playing) {
        round++;
        console.info(`=== RONDA ${round} ===`)
        
        do {
            inputIsValid = false;

            row = parseInt(prompt(`RONDA ${round} - Elige fila (0-${boardSize-1}):`));
            
            if (isNaN(row)) alert(`ERROR: Introduce un número en dígitos para la fila.`);
            else if (row < 0) alert(`ERROR: La fila no puede ser menor que 0.`);
            else inputIsValid = true;
        } while (!inputIsValid);

        do {
            inputIsValid = false;

            col = parseInt(prompt(`RONDA ${round} - Elige columna (0-${boardSize-1}):`));

            if (isNaN(col)) alert(`ERROR: Introduce un número en dígitos para la columna.`);
            else if (row < 0) alert(`ERROR: La columna no puede ser menor que 0.`);
            else inputIsValid = true;
        } while (!inputIsValid);

        if (logicBoard[row][col] == -1) {
            console.error(`¡BUM! Se acabó el juego.`);
            playerBoard[row][col] = "*";
            playing = false;
        } else if (playerBoard[row][col] === " ") {
            console.log(`Ya se ha destapado esa casilla.`);
        } else if (logicBoard[row][col] == 0) {
            // Reveal box by box
            playerBoard[row][col] = " "; 

            // Reveal all empty adjacent boxes (unfinished...)
            // showEmptyAdjacentBoxes(logicBoard, playerBoard, row, col);
        } else {
            console.warn(`Una mina anda cerca...`);
            playerBoard[row][col] = logicBoard[row][col];
        }

        console.table(playerBoard);
    }
}
     */