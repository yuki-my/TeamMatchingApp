// server.js (マッチングサイト用 Expressサーバー)

const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

const PORT = process.env.env.PORT || 3000;

// HTML/CSS/JSなどの静的ファイルを配信する設定
app.use(express.static(__dirname));

// サーバー起動
server.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
});