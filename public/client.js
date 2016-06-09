var seen = {};
var clearClips = function(){
  seen = {};
  $('#clippets').html('');
};

function addImageClip(id, type, filename, md5str){
  var fingerprint = filename + md5str;
	if(seen[fingerprint]){return;}
	seen[fingerprint] = true;

	var clip = sprintf(
		'<div class="clippet"><img src="%s" type="%s" alt="%s" height=%d width=%d></div>',
		'imgfile/' + id, type, filename, 100, 100);
	$('#clippets').append($(clip));
}

function getList(){
  $.getJSON({ url : 'clippets' })
  .then(function ( data ) {
		clearClips();
    data.forEach(function ( item ) {
      switch ( item.type ) {
        case 'image/jpeg':
        case 'image/png':
          addImageClip(item._id, item.type, item.filename, item.md5);
          break;
      }
    });
  });
}

$(getList);

Dropzone.options.drop = {
  init: function () {
    this.on("complete", getList);
  }
};

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
