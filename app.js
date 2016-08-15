var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var archiver = require('archiver');

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
app.use(bodyParser.json({limit: '50mb'}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/i', express.static(path.join(__dirname, 'processing')));
app.use('/r', express.static(path.join(__dirname, 'result')));
app.use('/result', express.static(path.join(__dirname, 'result')));



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


app.post( '/portada',  function(req, res, next) {
  console.log('PORTADA GETTED');
  gm('processing/uploads/'+req.body.imgName)
    .crop(req.body.width, req.body.height, req.body.x, req.body.y)
    .resize(415, null, '>')
    .interlace("line")
    .quality(80)
    //.noProfile() // Destroza el color de la imágen
    .write('processing/portada.jpg', function (err) {
      if (!err) {
        console.log('done');
        return res.status( 200 ).send( 'Portada procesada' );
      } else {
        console.log(err);
        return res.status( 422 ).send('Error al intentar procesar la portada.');
      }
    });
});

function clearConfigFiles(callback) {
  dirPath = path.join(__dirname, 'processing')
  try { var files = fs.readdirSync(dirPath); }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
    }
  callback();
}



app.post( '/generate', function(req, res, next) {
//clearConfigFiles(function() {
  console.log('Starting download process')
  var baseFileName = req.body.fecha+'-'+req.body.permalink;
  var fileName = baseFileName+'.md';
  var fileContent =
`---
# Archivo autogenerado

# No tocar
layout: gallery

# Título en la página /sesiones
title: "${req.body.title}"

# Carpeta donde buscará las imágenes en /images/. Debe tener el mismo nombre y sin espacios
images: ${req.body.images}

# Enlace personalizado ej: ariadnaballestar.com/sesiones/NOMBRESESION
permalink: /${req.body.permalink}

# Información detallada sobre la sesión
description: "${req.body.description}"

# Colaboradores
colaboradores:
`;

  for (var i = 0; i < req.body.colaboradores.length; i++) {
    fileContent += ` - title: "${req.body.colaboradores[i].title}"\n`;
    fileContent += `   name: "${req.body.colaboradores[i].name}"\n`;
    if (req.body.colaboradores[i].link) {
      fileContent += `   link: "${req.body.colaboradores[i].link}"\n`;
    }
  }
  fileContent += '---';

  fs.writeFile(path.join(__dirname, 'processing', fileName), fileContent, function(err) {

    if(err) {
        return console.log(err);
    }
    // Crear comprimido 

    var archive = archiver('zip');
    var compressFileName = baseFileName+'.zip';
    var output = fs.createWriteStream(__dirname + '/result/'+compressFileName);
    archive.pipe(output);
    output.on('close', function() {
      console.log(archive.pointer() + ' total bytes');
      console.log('archiver has been finalized and the output file descriptor has closed.');
      return res.status( 200 ).send( 'r/'+compressFileName );
    });

    archive.on('error', function(err) {
      throw err;
    });

    var folderName = req.body.images;
    archive.file(__dirname + '/processing/portada.jpg', { name: '/images/'+folderName+'/portada.jpg' });
    archive.file(__dirname + '/processing/'+ fileName, { name: '/_posts/'+fileName });
    
/*
    var files = [__dirname + '/processing/'+ fileName , __dirname + '/processing/portada.jpg'];

    for(var i in files) {
      if (path.basename(files[i]) == 'portada.jpg'){
        archive.file(files[i], { name: '/images/'+path.basename(files[i]) });
      } else {
        archive.file(files[i], { name: path.basename(files[i]) });
      }
    }
*/
    var images = [__dirname + '/processing/thumbs', __dirname + '/processing/fulls']

    for(var i in images) {
      archive.directory(images[i], '/images/'+folderName+images[i].replace(__dirname + '/processing', ''));
    }

    archive.finalize(function(err, bytes) {
      if (err) {
        throw err;
      }

      console.log(bytes + ' total bytes');
    });
    
  }); 

  //res.writeHead(200, {'Content-Type': 'text/plain'});
  
//}); // clearfiles
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