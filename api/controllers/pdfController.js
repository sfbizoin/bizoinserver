const { log } = require("console");
// PDFJSの設定
const pdfjsDist = require("pdfjs-dist/es5/build/pdf.js");
const pdfjs = require("pdfjs");

const fs = require("fs").promises;

exports.echo = function(req, res) {
    res.json({ aaa: "BBB"});
};

// PDFを返却する
exports.show_pdf = function(req, res) {
    if (req.body.pdffile) {
        const pdfdata = Buffer.from(req.body.pdffile, 'base64');
        res.set('Content-disposition', 'attachment; filename=return.pdf' );
        res.set('Content-type', 'application/pdf');
        res.end(pdfdata);
    } else {
        res.json({ result: "NG"});
    }
};

// PDFの文字列データを抽出してみる
exports.get_data = function(req, res) {
    if (req.body.pdffile) {
        const pdfdata = Buffer.from(req.body.pdffile, 'base64');
        var task = pdfjsDist.getDocument({data: pdfdata});
        task.promise.then((pdf) => {
            // 最初のページを取得する
            pdf.getPage(1).then((page) => {
                // ページを解析する
                page.getTextContent().then((textContent) => {
                    res.json({ result: "OK", text: textContent});
                });
            });
        }).catch((error) => {
            console.error(error);
        });
    } else {
        res.json({ result: "NG"});
    }
};

// PDFに印鑑を押してみる
exports.set_inkan = async function(req, res) {
    if (req.body.pdffile) {
        editpdf(req, res).then(() => {
            console.log("OK");
        }, () => {
            console.log("ERROR");
        });
    } else {
        res.json({ result: "NG"});
    }
};

async function editpdf(req, res) {
    const pdfdata = Buffer.from(req.body.pdffile, 'base64');
    const stamp = req.body.stampinfo;
    const keyword = req.body.keyword;
    const pdfDoc = await pdfjsDist.getDocument({data: pdfdata}).promise.catch(err => {
        console.error(err);
        res.json({ result: "NG", reason: "getDocument" });
        throw err;
    });
    // 最初のページを取得する
    const page = await pdfDoc.getPage(1).catch(err => {
        console.error(err);
        res.json({ result: "NG", reason: "getPage" });
        throw err;
    });

    // ページの横幅・縦幅を取得
    let page_width = page.view[2];
    let page_height = page.view[3];

    const textContext = await page.getTextContent().catch(err => {
        console.error(err);
        res.json({ result: "NG", reason: "getTextContent" });
        throw err;
    });

    let transform;
    var stampItemArray = new Array();
    textContext.items.forEach(item => {
        if (item.str === keyword) {
            transform = item.transform;
        }
        if (item.str === '印') {
            stampItemArray.push(item);
        }
    });
    console.log(transform);

    // 座標の確定
    var target;
    var nowDist;
    stampItemArray.forEach(item => {
        console.log(item);
        const stampTrans = item.transform;
        if (!target) {
            target = stampTrans;
            nowDist = Math.sqrt(Math.pow(transform[4] - stampTrans[4],2) + Math.pow(transform[5] - stampTrans[5],2));
            console.log(nowDist);
        } else {
            let newDist = Math.sqrt(Math.pow(transform[4] - stampTrans[4],2) + Math.pow(transform[5] - stampTrans[5],2));
            console.log(newDist);
            if (newDist < nowDist) {
                console.log("change");
                target = stampTrans;
                nowDist = newDist;
            }
        }
    });

    // スタンプ画像
    const stampData = Buffer.from(stamp.file, 'base64');
    // ローカルの画像を使う時はこちら
    // const stampData = await fs.readFile(__dirname + '/../static/image/stamp.jpeg').catch(err => {
    //     console.error(err);
    //     res.json({ result: "NG", reason: "getStampData" });
    //     throw err;
    // });

    // 縦横幅を指定してDocumentを生成
    var destDoc = new pdfjs.Document({padding: 0, width: page_width , height: page_height});

    var srcDocImage = new pdfjs.Image(pdfdata);

    destDoc.image(srcDocImage);

    var stampImage = new pdfjs.Image(stampData);
    destDoc.image(stampImage, {
        x: target[4] - (stamp.width / 2),
        y: target[5] + (stamp.height / 2),
        width: stamp.width,
        height: stamp.height,
        wrap: false,
    });

    // 複数ページあった場合に2ページ目以降を追加
    if (pdfDoc.numPages > 1) {
        const extDoc = new pdfjs.ExternalDocument(pdfdata);
        for (var i = 2; i < pdfDoc.numPages; i++) {
            destDoc.addPageOf(i, extDoc);
        }
    }

    destDoc.asBuffer((err, data) => {
        if (err) {
            console.error(err);
            throw err;
        } else {
            res.set('Content-disposition', 'attachment; filename=return.pdf' );
            res.set('Content-type', 'application/pdf');
            res.end(data);
        }
    });
}