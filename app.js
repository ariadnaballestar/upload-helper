var fs = require('fs');
var gm = require('gm').subClass({imageMagick: true});;
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var archiver = require('archiver');
var rimraf = require('rimraf');
var mkdirp = require('mkdirp');

var routes = require('./routes/index');
var users = require('./routes/users');

var multer  = require('multer')
//var upload = multer({ dest: 'uploads/' })

var Flickr = require("flickrapi"),
    flickrOptions = {
      api_key: process.env.API_KEY,
      secret: process.env.SECRET,
      user_id: process.env.USER_ID,
      access_token: process.env.ACCESS_TOKEN,
      access_token_secret: process.env.ACCESS_TOKEN_SECRET
    };



const nodemailer = require('nodemailer');

let transporter = nodemailer.createTransport({
    service: process.env.MAIL_SERVICE, // TO-DO: Create these env vars
    auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
    }
}, {
    // default message fields
    from: process.env.MAIL_FROM
});



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

cleanUp();
function cleanUp() {

  rimraf('processing', function(err) {
    if (err) { throw err; }

    mkdirp('processing/uploads', function (err) {
      if (err) { throw err; }
      // done
    });

    mkdirp('processing/thumbs', function (err) {
      if (err) { throw err; }
      // done
    });

    mkdirp('processing/fulls', function (err) {
      if (err) { throw err; }
      // done
    });

    mkdirp('result', function (err) {
      if (err) { throw err; }
      // done
    });
  })
}




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


app.get('/f/:galleryid', function(req, res, next) {
  Flickr.authenticate(flickrOptions, function(error, flickr) {
      flickr.photosets.getPhotos({
      photoset_id: req.params.galleryid,
      user_id: flickrOptions.user_id,
      page: 1,
      per_page: 200,
      extras: 'url_m',
      authenticated: true
    }, function(err, result) {
      if (result) {
        console.log(JSON.stringify(result));
        res.render('index', { title: result.photoset.title , lines: result.photoset.photo });
      }

    });
  });
});


app.post( '/generate', function(req, res, next) {
  console.log('BOODY:', req.body);
  console.log('Starting download process');

  var flickrGalleryId = req.body.flickrgalleryid; //Number(req.body.flickrgalleryid);

  var baseFileName = req.body.fecha+'-'+req.body.permalink;
  var fileName = baseFileName+'.md';
  var compressFileName = baseFileName+'.zip';

  console.log('galleryid:', flickrGalleryId);

  console.log('content:' + req.body.content);
  // TODO: Add content to fileContent

  res.status( 200 ).send( 'Iniciando la petición a flickr...' );


  Flickr.authenticate(flickrOptions, function(error, flickr) {
      flickr.photosets.getPhotos({
      photoset_id: flickrGalleryId,
      user_id: flickrOptions.user_id,
      page: 1,
      per_page: 200,
      extras: 'url_m',
      authenticated: true
    }, function(err, result) {
      console.log('result:', result);
      console.log('err:', err);
      if (result) {
        var categoriesStr = '';
        if (req.body.categories) {
          categoriesStr  = "["+req.body.categories.join(", ")+"]";
        }


        var fileContent =
`---
# Archivo autogenerado

# No tocar
layout: gallery

# Categoria
categories: ${categoriesStr}

# Título en la página /sesiones
title: "${req.body.title}"

# Carpeta donde buscará las imágenes en /images/. Debe tener el mismo nombre y sin espacios
images: ${req.body.images}

# Enlace personalizado ej: ariadnaballestar.com/sesiones/NOMBRESESION
permalink: /${req.body.permalink}

# Texto que se insertara en la etiqueta alt de todas las imagenes de la sesión
altimages: "${req.body.altimages}"

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
        fileContent += "\n# Imagenes de flickr\n"
        fileContent += "flickralbum: "+flickrGalleryId+"\n"
        fileContent += "flickrimages:\n"

        for (var i = 0; i < result.photoset.photo.length; i++) {
          fileContent += ' - ' + result.photoset.photo[i].url_m + '\n';
        }

        fileContent += '---\n';
        fileContent += req.body.content;

        fs.writeFile(path.join(__dirname, 'processing', fileName), fileContent, function(err) {

          if(err) {
              return console.log(err);
          }
          // Crear comprimido


          var archive = archiver('zip');

          var outputRoute = (__dirname + '/result/'+compressFileName);

          var output = fs.createWriteStream(outputRoute);
          archive.pipe(output);

          let message = {

              // Comma separated list of recipients
              to: process.env.MAIL_TO,

              // Subject of the message
              subject: 'Información sobre la sesión '+req.body.title, //

              // plaintext body
              text: 'Puedes descargar el comprimido adjunto.',

              // An array of attachments
              attachments: [

                  // File Stream attachment
                  {
                      filename: compressFileName,
                      path: outputRoute,
                      cid: process.env.MAIL_USER // should be as unique as possible
                  }
              ]
          };

          output.on('close', function() {
            console.log('Closed with '+ archive.pointer() + ' total bytes');
            console.log('archiver has been finalized and the output file descriptor has closed.');
            // return res.status( 200 ).send( 'r/'+compressFileName );




            console.log('Sending Mail');
            transporter.sendMail(message, (error, info) => {
                if (error) {
                    console.log('Error occurred');
                    console.log(error.message);
                    return;
                }
                console.log('Message sent successfully!');
                console.log('Server responded with "%s"', info.response);
                transporter.close();
            });


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
      /*
          var images = [__dirname + '/processing/thumbs', __dirname + '/processing/fulls']

          for(var i in images) {
            archive.directory(images[i], '/images/'+folderName+images[i].replace(__dirname + '/processing', ''));
          }
          */

          archive.finalize(function(err, bytes) {
            if (err) {
              throw err;
            }

            console.log('Finalized with ' + bytes + ' bytes');

          });

        });


      }


    });
  });



  //res.writeHead(200, {'Content-Type': 'text/plain'});

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
