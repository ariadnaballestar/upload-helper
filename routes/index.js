var express = require('express');
var fs = require('fs');
var path = require('path');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {


  res.render('index', { title: 'Express' });
  //console.log(path.join(__dirname, '..' , 'processing'));
  rmDir(path.join(__dirname, '..' , 'processing/uploads'))
});

function rmDir(dirPath) {
  console.log(dirPath);
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
