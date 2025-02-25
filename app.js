const express = require("express");
const socket = require("socket.io");
const http = require("http");
const {Chess} = require("chess.js");
const path = require("path");

const app = express();      

const server = http.createServer(app);                          //Create http server from Express server
const io = socket(server);                                      //Give Socket.io that hhtp server for real time connect

const chess = new Chess();                                      //All the rules are fetch here
let players = {};
let currentPlayer = "w";

app.set("view engine", "ejs");                                  //From this we can use ejs file ---> html files
app.use(express.static(path.join(__dirname,"public")));         //Access static files like fonts,images,video,audio..etc

app.get("/", (req, res)=>{
    res.render("index", {title: "Welcome to ChessMate"});
})

// Socket.io handles connection event
io.on("connection", function(uniquesocket){
    console.log("Player one Connected.");

    if(!players.white){
        players.white = uniquesocket.id;
        uniquesocket.emit("playRole", "w");
    }
    else if(!players.black){
        players.black = uniquesocket.id;
        uniquesocket.emit("playRole", "b");
    } 
    else{
        uniquesocket.emit("spectatorRole")
    }

    socket.on("disconnect", function(){
        if(uniquesocket.id === players.white){
            delete players.white;
        }
        else if(uniquesocket.id === players.black){
            delete players.black;
        }
    })
})

server.listen(3000, function () {
    console.log("Server Connected.")
});