// サーバーと接続する
const socket = io();

// 現在の部屋名を保存する変数
let currentRoom = "";

// スコア変数
let wins = 0;
let losses = 0;
let draws = 0;

// ハンバーガーメニュー
const hamburgerBtn = document.getElementById('hamburger-btn');
const mobileMenu = document.getElementById('mobile-menu');
hamburgerBtn.addEventListener('click', () => mobileMenu.classList.toggle('hidden'));

// --- ▼ 入室処理 ---
function enterRoom() {
    const roomName = document.getElementById('room-name').value;
    if (roomName === "") {
        alert("部屋名を入力してください");
        return;
    }
    
    currentRoom = roomName; // 部屋名を記憶
    
    // サーバーに「入室します」と伝える
    socket.emit('join_room', currentRoom);

    // 画面切り替え
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('game-screen').classList.remove('hidden');
    document.getElementById('display-room-name').textContent = currentRoom;
}

// --- ▼ 退室処理 ---
function leaveRoom() {
    location.reload(); // ページをリロードして最初に戻るのが一番手っ取り早いです
}

// --- ▼ ゲームプレイ（手を送る） ---
function play(myMove) {
    // サーバーに「この手を出したよ」と伝える
    socket.emit('make_move', {
        room: currentRoom,
        move: myMove
    });

    // 画面に「待機中」と表示
    document.getElementById('result-message').textContent = "相手を待っています...";
    document.getElementById('result-message').style.color = "black";
}

// --- ▼ サーバーからの通知を受け取る ---

// 1. 「相手待ち」のメッセージ受信
socket.on('wait_opponent', (msg) => {
    document.getElementById('result-message').textContent = msg;
});

// 2. 「結果」の受信（勝負がついたとき）
socket.on('game_result', (data) => {
    const result = data.result;     // win, loss, draw
    const opponentMove = data.opponentMove; // rock, scissors, paper
    
    const choiceNames = {'rock': '✊ グー', 'scissors': '✌️ チョキ', 'paper': '🖐️ パー'};
    updateScreen(result, choiceNames[opponentMove]);
});


// 画面更新用関数
function updateScreen(result, opponentHandName) {
    const messageElement = document.getElementById('result-message');
    const computerHandElement = document.getElementById('computer-hand');

    computerHandElement.textContent = opponentHandName;

    if (result === "win") {
        messageElement.textContent = "あなたの勝ちです！🎉";
        messageElement.style.color = "red";
        wins++;
        document.getElementById('win-count').textContent = wins;
    } else if (result === "loss") {
        messageElement.textContent = "あなたの負けです…😢";
        messageElement.style.color = "blue";
        losses++;
        document.getElementById('loss-count').textContent = losses;
    } else {
        messageElement.textContent = "あいこです！😲";
        messageElement.style.color = "gray";
        draws++;
        document.getElementById('draw-count').textContent = draws;
    }
}