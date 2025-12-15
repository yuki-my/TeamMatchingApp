const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// HTMLなどのファイルを配信する設定
app.use(express.static(__dirname));

// 部屋ごとのゲーム状況を保存する場所
// 例: { "room1": { moves: { socketId1: "rock", socketId2: "scissors" } } }
let rooms = {};

// 誰かがサイトにアクセスしたときの処理
io.on('connection', (socket) => {
    console.log('ユーザーが接続しました: ' + socket.id);

    // ▼「入室」の処理
    socket.on('join_room', (roomName) => {
        socket.join(roomName);
        console.log(`ユーザー ${socket.id} が部屋 ${roomName} に入室しました`);

        // 部屋データを初期化（なければ作る）
        if (!rooms[roomName]) {
            rooms[roomName] = { moves: {} };
        }
    });

    // ▼「じゃんけんの手」を受け取ったときの処理
    socket.on('make_move', (data) => {
        const roomName = data.room;
        const move = data.move;

        // 手を保存する
        if (rooms[roomName]) {
            rooms[roomName].moves[socket.id] = move;
        }

        // 部屋にいる人数を確認
        const playersInRoom = io.sockets.adapter.rooms.get(roomName);
        const playerCount = playersInRoom ? playersInRoom.size : 0;

        // 2人の手が揃ったら勝負判定！
        const moves = rooms[roomName].moves;
        const playerIds = Object.keys(moves);

        if (playerIds.length === 2) {
            const p1ID = playerIds[0];
            const p2ID = playerIds[1];
            const p1Move = moves[p1ID];
            const p2Move = moves[p2ID];

            // 勝敗判定ロジック
            let resultP1 = getResult(p1Move, p2Move);
            let resultP2 = getResult(p2Move, p1Move);

            // プレイヤー1に結果送信
            io.to(p1ID).emit('game_result', { 
                result: resultP1, 
                opponentMove: p2Move 
            });

            // プレイヤー2に結果送信
            io.to(p2ID).emit('game_result', { 
                result: resultP2, 
                opponentMove: p1Move 
            });

            // 次の勝負のために手をリセット
            rooms[roomName].moves = {};
        } else {
            // まだ相手が出していない場合
            socket.emit('wait_opponent', "相手が選ぶのを待っています...");
        }
    });
});

// 勝敗判定関数
function getResult(myMove, opponentMove) {
    if (myMove === opponentMove) return 'draw';
    if (
        (myMove === 'rock' && opponentMove === 'scissors') ||
        (myMove === 'scissors' && opponentMove === 'paper') ||
        (myMove === 'paper' && opponentMove === 'rock')
    ) {
        return 'win';
    }
    return 'loss';
}

// サーバーを起動（3000番ポート）
server.listen(3000, () => {
    console.log('サーバーが起動しました！ http://localhost:3000');
});