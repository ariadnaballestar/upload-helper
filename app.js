var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var multer  = require('multer')
//var upload = multer({ dest: 'uploads/' })

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'processing/uploads/')
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname)
  }
})

var upload = multer({ storage: storage })

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);



app.post( '/upload', upload.single( 'file' ), function( req, res, next ) {
  //console.log(req.file)

  if ( !req.file.mimetype.startsWith( 'image/' ) ) {
    return res.status( 422 ).send('Solo puedes subir imágenes!');
  } else {
    gm('processing/uploads/'+req.file.originalname)
    .resize(1920, 1080, '>')
    .interlace("line")
    .quality(92)
    //.noProfile() // Destroza el color de la imágen
    .write('processing/fulls/'+req.file.originalname, function (err) {
      if (!err) {
        gm('processing/uploads/'+req.file.originalname)
        .resize(null, 480, '>')
        .interlace("line")
        .quality(80)
        //.noProfile() // Destroza el color de la imágen
        .write('processing/thumbs/'+req.file.originalname, function (err) {
          if (!err) {
            console.log('done');
            return res.status( 200 ).send( req.file );
          } else {
            console.log(err);
            return res.status( 422 ).send('Error al intentar procesar la imágen full.');
          }
        });
        //return res.status( 200 ).send( req.file );
      } else {
        console.log(err);
        return res.status( 422 ).send('Error al intentar procesar la imágen full.');
      }
    });
  }
});

app.post( '/download', function(req, res, next) {
  console.log('DOWNLOAD GETTED');
  console.log(req.body); // info about portada ...
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.end();
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});



module.exports = app;
