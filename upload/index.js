$(function(){
    
$(':file').on('change', function () {
  var file = this.files[0];

    alert("hi")
    
  if (file.size > 4*1024*1024) {
    alert('max upload size is 4MiB');
  }

  // Also see .name, .type
});



$(':button').on('click', function () {
  $.ajax({
    // Your server script to process the upload
    url: 'upload.php',
    type: 'POST',

    // Form data
    data: new FormData($('form')[0]),

    // Tell jQuery not to process data or worry about content-type
    // You *must* include these options!
    cache: false,
    contentType: false,
    processData: false,

    // Custom XMLHttpRequest
    xhr: function () {
      var myXhr = $.ajaxSettings.xhr();
      if (myXhr.upload) {
        // For handling the progress of the upload
        myXhr.upload.addEventListener('progress', function (e) {
          if (e.lengthComputable) {
            $('progress').attr({
              value: e.loaded,
              max: e.total,
            });
          }
        }, false);
      }
      return myXhr;
    }
  });
});

})
