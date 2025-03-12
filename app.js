const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();

const server = http.createServer(app);                          //Create http server from Express server
const io = socket(server);                                      //Give Socket.io that hhtp server for real time connect

const chess = new Chess();                                      //All the rules are fetch here
let players = {};
let currentPlayer = "w";

let playerTimers = {
    white: 10 * 60, // 10 minutes in seconds
    black: 10 * 60,
};

let gameInterval;


app.set("view engine", "ejs");                                  //From this we can use ejs file ---> html files
app.use(express.static(path.join(__dirname, "public")));         //Access static files like fonts,images,video,audio..etc

app.get("/", (req, res) => {
    res.render("index", { title: "Welcome to ChessMate" });
})

// Socket.io handles connection event
io.on("connection", function (uniquesocket) {
    console.log("Player one Connected.");

    if (!players.white) {
        players.white = uniquesocket.id;
        uniquesocket.emit("playerRole", "w");
    }
    else if (!players.black) {
        players.black = uniquesocket.id;
        uniquesocket.emit("playerRole", "b");
    }
    else {
        uniquesocket.emit("spectatorRole")
    }

    // Timer interval
    gameInterval = setInterval(() => {
        if (chess.isGameOver()) {
            clearInterval(gameInterval);
        }
        if (currentPlayer === "w") {
            playerTimers.white--;
            if (playerTimers.white <= 0) {
                io.emit("gameOver", { winner: "b", reason: "timeout" });
                clearInterval(gameInterval);
            }
        } else {
            playerTimers.black--;
            if (playerTimers.black <= 0) {
                io.emit("gameOver", { winner: "w", reason: "timeout" });
                clearInterval(gameInterval);
            }
        }
        io.emit("timerUpdate", playerTimers); // Update timers to both players
    }, 1000); // 1 second interval

    uniquesocket.on("disconnect", function () {
        if (uniquesocket.id === players.white) {
            delete players.white;
        }
        else if (uniquesocket.id === players.black) {
            delete players.black;
        }
    });

    uniquesocket.on("move", (move) => {
        try {
            // Check correct move by right player
            if (chess.turn() === 'w' && uniquesocket.id !== players.white)
                return;
            if (chess.turn() === 'b' && uniquesocket.id !== players.black)
                return;

            // Update game 
            const result = chess.move(move);        // store the move

            if (result) {
                currentPlayer = chess.turn();
                io.emit("move", move);              // io.emit ---> to everyone
                io.emit("boardState", chess.fen());
            } else {
                console.log("Invalid move: ", move);
                uniquesocket.emit("invalidMove", move);      // uniquesocket.emit ---> particular player
            }

            if (chess.isGameOver()) {
                const winner = chess.isCheckmate() ? (chess.turn() === "w" ? "b" : "w") : null;
                if (winner) {
                    io.emit("gameOver", { winner, reason: "checkmate" });
                } else if (chess.in_draw()) {
                    io.emit("gameOver", { winner: "none", reason: "draw" });
                }
            }
        } catch (err) {
            console.log(err);
            uniquesocket.emit("invalidMove: ", move);
        }
    })

});

server.listen(3000, function () {
    console.log("Server Connected.")
});