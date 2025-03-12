// const {Chess} = require("chess.js");

const socket = io();
const chess = new Chess();

const boardElement = document.querySelector(".chessboard");     //class ., id #

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

let timers = { white: 10 * 60, black: 10 * 60 }; // In seconds

// Function cient side 
const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";
    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add("square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );
            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                pieceElement.innerText = getPieceUnicode(square);
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", () => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");       // this will make sure during drag no platform error came
                    }
                });
                pieceElement.addEventListener("dragend", (e) => {
                    sourceSquare = null;
                    draggedPiece = null;
                });
                squareElement.appendChild(pieceElement);
            }

            // to flip board for black
            if (playerRole === 'b') {
                boardElement.classList.add("flipped");
            } else {
                boardElement.classList.remove("flipped");
            }


            squareElement.addEventListener("dragover", function (e) {
                e.preventDefault();
            })
            squareElement.addEventListener("drop", function (e) {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col)
                    };
                    handleMove(sourceSquare, targetSource);
                }
            })
            boardElement.appendChild(squareElement);
        });
    });
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    }

    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        k: '\u2654',    // ♔
        q: '\u2655',   // ♕
        r: '\u2656',    // ♖
        b: '\u2657',  // ♗
        n: '\u2658',  // ♘
        p: '♙',    // ♙
        K: '\u265A',    // ♚
        Q: '\u265B',   // ♛
        R: '\u265C',    // ♜
        B: '\u265D',  // ♝
        N: '\u265E',  // ♞
        P: '\u265F'     // ♟
    };
    return unicodePieces[piece.type] || "";
};

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
})

socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
})

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
})

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
})

socket.on("timerUpdate", function (playerTimers) {
    timers = playerTimers;
    updateTimersDisplay();
});

socket.on("gameOver", function ({ winner, reason }) {
    let message = reason === "timeout" ? "Timeout!" : reason === "checkmate" ? "Checkmate!" : reason === "player left" ? "Player Left!" : "Game Over!";
    if (winner === "w") {
        message = "White Wins! " + message;
    } else if (winner === "b") {
        message = "Black Wins! " + message;
    } else {
        message = "The Game is a Draw!";
    }

    setTimeout(() => {
        alert(message);
    }, 1000);
});

const updateTimersDisplay = () => {
    document.getElementById("whiteTimer").innerText = formatTime(timers.white);
    document.getElementById("blackTimer").innerText = formatTime(timers.black);
};

const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`;
};


renderBoard();
