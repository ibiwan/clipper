var seen = {};
var clearClips = function(){
  seen = {};
  $('#clippets').html('');
};

function addImageClip(_id, type, filename, md5str, tags=[]){
  var fingerprint = filename + md5str;

	if(seen[fingerprint]){
    $(seen[fingerprint]).remove();
  }

  var tagset = $('<div class="tags row btn-toolbar"></div>');
  for(var i in tags){
    tagset.append(
      $('<button type="button" class="tag btn btn-small btn-default"></button>')
        .append(
          $('<span></span').text(tags[i] + '\xa0')
        )
        .append(
          $('<i class="delete glyphicon glyphicon-remove-sign color-grey pull-right"></i>')
        )
   );
  }

  var clippet = $('<div class="clippet row"></div>')
    .append(
      $('<div class="thumb col-xs-3"></div>')
        .append(
          $('<img class="img-responsive">')
            .attr('src', 'imgfile/' + _id)
            .attr('type', type)
            .attr('alt', filename)
        ), 
      $('<div class="tagrow col"></div>').append(tagset)
    )
    .data('_id', _id)
  ;

  seen[fingerprint] = clippet;
  $('#clippets').append(clippet);
}

function addClip(item){
    switch ( item.type ) {
      case 'image/jpeg':
      case 'image/png':
        addImageClip(item._id, item.type, item.filename, item.md5, item.tags);
        break;
    }
}

function deleteTag(_id, tag){
  $.getJSON({url:'tag/delete/'+_id+'/'+tag})
  .then(function(data){
    addClip(data);
  });
}

function getList(){
  $.getJSON({ url : 'clippets' })
  .then(function ( data ) {
		clearClips();
    data.forEach(addClip);
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
      $('.thumb').removeClass('col-xs-3').addClass('col-xs-12');
      $('#preview-col').show().find('img').attr('src', imgUrl);    
      $('.tags').hide();
    }
  }

  function hidePreview(force = false){
    if(previewState === 'moment' || (previewState === 'keep' && force)){
      previewState = 'off';
      $('#clippets-col').removeClass('col-xs-3').addClass('col-xs-12');
      $('.thumb').removeClass('col-xs-12').addClass('col-xs-3');
      $('#preview-col').hide();    
      $('.tags').show();
    }
  }

  $('#clippets').on('mouseenter', '.thumb img', function( event ) {
    showPreview($(this).attr('src'));
  }).on('mouseleave', 'img', function( event ) {
    hidePreview();  
  }).on('click', 'img', function( event ) {
    showPreview($(this).attr('src'), true);
  });

  $('#preview').on('click', '.thumb img', function( event ) {
    hidePreview(true);
  });
})('off');

$(document).on('click', '.delete', function(){
  var tag = $.trim( $(this).closest('.tag').find('span').text() );
  var _id  = $(this).closest('.clippet').data('_id');
  deleteTag(_id, tag);
});
