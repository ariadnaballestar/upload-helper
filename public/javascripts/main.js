Dropzone.options.myDropzone = {
  /* init: function () {
    this.on("complete", function (file) {
      if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
        console.log('todo subido');
      }
    }); 
  }, */
  init: function () {
    this.on("queuecomplete", function (file) {
      if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
        $('#myDropzone input').on('change', function() {
           alert($('input[name=defaultPic]:checked', '#myDropzone').val()); 

           var htmlCropContent = '<img id="image" src="http://i.imgur.com/gbmz1JE.jpg">';
           $('#myCropper').html(htmlCropContent);
           cropperInit();
        });

        //var portadapic = $('input[name=defaultPic]:checked', '#myDropzone').val();
        //alert(portadapic);

        $.ajax({
            type: "POST",
            url: "/download",
            //data: { portada: portadapic },
            success: function(data) {
                //show content
                
                console.log('A descargar...')
            },
            error: function(jqXHR, textStatus, err) {
                //show error message
                alert('text status '+textStatus+', err '+err)
            }
        });
      }
    });
    this.on("addedfile", function(file) {
      // Add default option box for each preview.
      var defaultRadioButton = Dropzone.createElement('<div class="portada_pic"><input type="radio" name="defaultPic" value="'+file.name+'" />Portada</div>');
      
      file.previewElement.appendChild(defaultRadioButton);

    });
  },
  paramName: "file", // The name that will be used to transfer the file
  acceptedFiles: "image/*"
};


function cropperInit() {
  /* Cropper js */
  var image = document.getElementById('image');
  var cropper = new Cropper(image, {
    aspectRatio: 83 / 62,
    crop: function(e) {
      console.log("e.detail.x: "+e.detail.x);
      console.log("e.detail.y: "+e.detail.y);
      console.log("e.detail.width: "+e.detail.width);
      console.log("e.detail.height: "+e.detail.height);
      console.log("e.detail.rotate: "+e.detail.rotate);
      console.log("e.detail.scaleX: "+e.detail.scaleX);
      console.log("e.detail.scaleY: "+e.detail.scaleY);
    }
    // todo: poner un mínimo de 415 píxeles de anchura
  });
}