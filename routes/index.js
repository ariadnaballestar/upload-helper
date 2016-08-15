var express = require('express');
var fs = require('fs');
var path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Ariadna Ballestar upload helper' });

  // Remove all images when accessing the web:
  clearImages();
  clearConfigFiles();
});

function clearImages() {
  rmDir(path.join(__dirname, '..' , 'processing/uploads'))
  rmDir(path.join(__dirname, '..' , 'processing/fulls'))
  rmDir(path.join(__dirname, '..' , 'processing/thumbs'))
  /*
  // clearConfigFiles already deletes portada.jpg
  fs.exists(path.join(__dirname,'..', 'processing/portada.jpg'), function(exists) {
    if (exists) {
      fs.unlinkSync(path.join(__dirname,'..', 'processing/portada.jpg'))
    }
  })
  */
}

function clearConfigFiles() {
  dirPath = path.join(__dirname, '..' , 'processing')
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
    }
}

function rmDir(dirPath) {
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  //fs.rmdirSync(dirPath);
};

module.exports = router;
