$(function () {
  $.getJSON({ url : 'clippets' })
  .then(function ( data ) {
    $('#clippets').html('');
    var seen = {};
    data.forEach(function ( item ) {
      console.log(item);
      var fingerprint = (item.filename || item.content) + item.md5;
      if ( seen[ fingerprint ] ) { return; }
      seen[ fingerprint ] = true;

      switch ( item.type ) {
        case 'image/jpeg':
          var clip = sprintf('<div class="clippet"><img src="%s" type="%s" alt="%s" height=%d width=%d></div>',
            'imgfile/' + item._id, item.type, item.filename, 100, 100);
          $('#clippets').append($(clip));
          break;
      }
    });
  });
});

(function(previewState){
  function showPreview(imgUrl, keep = false){
    if(previewState === 'off' || keep){
      previewState = keep ? 'keep' : 'moment';
      $('#clippets-col').removeClass('col-xs-12').addClass('col-xs-3');
      $('#preview-col').show().find('img').attr('src', imgUrl);    
    }
  }

  function hidePreview(force = false){
    if(previewState === 'moment' || (previewState === 'keep' && force)){
      previewState = 'off';
      $('#clippets-col').addClass('col-xs-12').removeClass('col-xs-3');
      $('#preview-col').hide();    
    }
  }

  $('#clippets').on('mouseenter', 'img', function( event ) {
    showPreview($(this).attr('src'));
  }).on('mouseleave', 'img', function( event ) {
    hidePreview();  
  }).on('click', 'img', function( event ) {
    showPreview($(this).attr('src'), true);
  });

  $('#preview').on('click', 'img', function( event ) {
    hidePreview(true);
  });
})('off');
