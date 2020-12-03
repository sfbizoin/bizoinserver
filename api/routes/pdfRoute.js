module.exports = function(app) {
  let pdfController = require('../controllers/pdfController');

  // PDFを表示してみる
  app.route('/pdfview/')
    .get(pdfController.echo)
    .post(pdfController.show_pdf);

  // PDFの文字列データを抽出してみる
  app.route('/pdfdata/')
    .post(pdfController.get_data);

  // PDFに印鑑を押してみる
  app.route('/pdfedit/')
    .post(pdfController.set_inkan);

};
