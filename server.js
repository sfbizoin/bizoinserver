var express = require("express"),
  app = express(),
  port = process.env.PORT || 8000,
//  mongoose = require("mongoose"),
//  Task = require("./api/models/taskModel"), // 作成したModelの読み込み
  bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ limit: '10mb', extended: true }));
app.use(bodyParser.json({ limit: '10mb' }));

var routes = require("./api/routes/pdfRoute"); // Routeのインポート
routes(app); //appにRouteを設定する。

app.set('view engine', 'pug'); // レンダリングエンジンにpugを使用

app.listen(port); // appを特定のportでlistenさせる。

console.log("pdf RESTful API server started on: " + port);