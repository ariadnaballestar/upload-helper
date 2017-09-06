var simplemde = new SimpleMDE({
  spellChecker: false
});

Dropzone.options.myDropzone = {
  /* init: function () {
    this.on("complete", function (file) {
      if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
        console.log('todo subido');
      }
    });
  }, */
  init: function () {
    this.on("addedfile", function(file) {
      // Add default option box for each preview.
      var portadaRadioButton = Dropzone.createElement('<div class="portada_pic"><input type="radio" name="defaultPic" value="'+file.name+'" />Portada</div>');

      file.previewElement.appendChild(portadaRadioButton);

    });

    this.on("queuecomplete", function (file) {
      if (this.getUploadingFiles().length === 0 && this.getQueuedFiles().length === 0) {
        $('#myDropzone input').on('change', function() {
            var portadaName = $('input[name=defaultPic]:checked', '#myDropzone').val();
            var url = '/i/uploads/'+portadaName;
            var htmlCropContent = '<img id="image" src="'+url+'">';
            $('#myCropper').html(htmlCropContent);
            cropperInit();
            $("#step1").css("visibility", "visible");
            $("#step1").css("display", "block");
            goToByScroll('step1')
        });

        $(".portada_pic").css("visibility", "visible");
        $(".portada_pic").css("display", "block");

        //var portadapic = $('input[name=defaultPic]:checked', '#myDropzone').val();
        //alert(portadapic);
      }
    });
  },
  paramName: "file", // The name that will be used to transfer the file
  acceptedFiles: "image/*"
};

var cropper; // global
function cropperInit() {
  /* Cropper js */
  var image = document.getElementById('image');
  cropper = new Cropper(image, {
    aspectRatio: 83 / 62,
    preview: '#preview',
    zoomable: false,
    highlight: false,
    minCropBoxWidth: '415',
    crop: function(e) {
      console.log("e.detail.x: "+e.detail.x);
      console.log("e.detail.y: "+e.detail.y);
      console.log("e.detail.width: "+e.detail.width);
      console.log("e.detail.height: "+e.detail.height);
      console.log("e.detail.rotate: "+e.detail.rotate);
      console.log("e.detail.scaleX: "+e.detail.scaleX);
      console.log("e.detail.scaleY: "+e.detail.scaleY);
    }
  });
}

$( "#guardarPortada" ).click(function() {
  var cropData = cropper.getData()
  var namePortada = $('input[name=defaultPic]:checked', '#myDropzone').val()
  $.ajax({
      type: "POST",
      url: "/portada",
      data: {
        imgName: namePortada,
        width: cropData.width,
        height: cropData.height,
        x: cropData.x,
        y: cropData.y
      },


      success: function(data) {
          //show content
          //console.log('Success /portada')
          $("#step2").css("visibility", "visible");
          $("#step2").css("display", "block");
          goToByScroll('step2')
      },
      error: function(jqXHR, textStatus, err) {
          //show error message
          alert('Error. text status '+textStatus+', err '+err)
      }
  });
});



$("#numColab").on("change paste keyup", function() {
  $( "#divColaboradores" ).empty();
  var maxCols = 30;
  var num = $(this).val();
  if (num <= maxCols) {
    for (var i = 1; i <= num; i++) {
      //num[i]
      $( "#divColaboradores" ).append( $( `<div class="form-group"><label for="test">Colaborador numero ${i}</label><input type="text" class="form-control" id="test" name="colaboradores[${i}][title]" placeholder="Título (ej: Modelo:)" required><input type="text" class="form-control" id="test" name="colaboradores[${i}][name]" placeholder="Nombre" required><input type="text" class="form-control" id="test" name="colaboradores[${i}][link]" placeholder="Enlace (dejar en blanco si no procede)"></div>` ) );
    }
  } else {
    alert(`Máximo ${maxCols}.`)
  }
});


$("#infoForm").submit(function(e) {
    //$("body").html("Se está enviando la petición...")
    $("#content").val(simplemde.value());

    var url = "/generate";

    $("#uploadButton").prop("disabled", true);

    $.ajax({
           type: "POST",
           url: url,
           data: $("#infoForm").serialize(), // serializes the form's elements.
           success: function(data)
           {
              $("body").html('Petición recibida. Recibirás un e-mail cuando el proceso haya finalizado.');
/*
              $("#downloadButton").attr("href", data)
              $("#step3").css("visibility", "visible");
              $("#step3").css("display", "block");
              goToByScroll('step3')
*/
               // // show response from server.
           }
         });

    e.preventDefault(); // avoid to execute the actual submit of the form.
});



function goToByScroll(id){
      // Remove "link" from the ID
    id = id.replace("link", "");
      // Scroll
    $('html,body').animate({
        scrollTop: $("#"+id).offset().top},
        'slow');
}
