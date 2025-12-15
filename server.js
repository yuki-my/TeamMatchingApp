// server.js (修正後の正しいコード)

const express = require('express');
const http = require('http');

const app = express();
const server = http.createServer(app);

// 環境変数PORTを正しく参照
// 変更前: const PORT = process.env.env.PORT || 3000;
const PORT = process.env.PORT || 3000; // <--- ここを修正しました！

// HTML/CSS/JSなどの静的ファイルを配信する設定
app.use(express.static(__dirname));

// サーバー起動
server.listen(PORT, () => {
    console.log(`サーバーがポート ${PORT} で起動しました`);
});