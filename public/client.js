var templates = {};
[ 'tag_row', 'tag_btn', 'clippet' ].forEach(function ( t ) {
  var template   = $('#' + t).html();
  templates[ t ] = template;
  Mustache.parse(template);
});

var seen       = {};
var clearClips = function () {
  seen = {};
  $('#clippets').html('');
};

function addImageClip( _id, type, filename, md5str, tags ) {
  var fingerprint = filename + md5str;

  if ( seen[ fingerprint ] ) {
    $(seen[ fingerprint ]).remove();
  }

  var tagset = $(Mustache.render(templates.tag_row));
  for ( var i in tags ) {
    tagset.append(Mustache.render(templates.tag_btn, { tag : tags[ i ] }));
  }

  var clippet         = Mustache.render(templates.clippet, {
    _id : _id, type : type, filename : filename
  });
  clippet             = $(clippet);
  seen[ fingerprint ] = clippet;
  clippet.find('.tagrow').append(tagset);

  $('#clippets').append(clippet);
}

function addClip( item ) {
  switch ( item.type ) {
    case 'image/jpeg':
    case 'image/png':
      addImageClip(item._id, item.type, item.filename, item.md5, item.tags);
      break;
    default:
      throw "couldn't handle type: " + item.type;
      break;
  }
}

function deleteTag( _id, tag ) {
  $.getJSON({ url : 'tag/delete/' + _id + '/' + tag })
   .then(function ( data ) {
     addClip(data);
   });
}

function getList() {
  $.getJSON({ url : 'clippets' })
   .then(function ( data ) {
     clearClips();
     data.forEach(addClip);
   });
}

$(getList);

Dropzone.options.drop = {
  init : function () {
    this.on("complete", getList);
  }
};

(function ( previewState ) {
  function showPreview( imgUrl, keep ) {
    if ( previewState === 'off' || keep ) {
      previewState = keep ? 'keep' : 'moment';
      $('#clippets-col').removeClass('col-xs-12').addClass('col-xs-3');
      $('.thumb').removeClass('col-xs-3').addClass('col-xs-12');
      $('#preview-col').show().find('img').attr('src', imgUrl);
      $('.tags').hide();
    }
  }

  function hidePreview( force ) {
    if ( previewState === 'moment' || (previewState === 'keep' && force) ) {
      previewState = 'off';
      $('#clippets-col').removeClass('col-xs-3').addClass('col-xs-12');
      $('.thumb').removeClass('col-xs-12').addClass('col-xs-3');
      $('#preview-col').hide();
      $('.tags').show();
    }
  }

  $('#clippets').on('mouseenter', '.thumb img', function ( event ) {
    showPreview($(this).attr('src'), false);
  }).on('mouseleave', 'img', function ( event ) {
    hidePreview(false);
  }).on('click', 'img', function ( event ) {
    showPreview($(this).attr('src'), true);
  });

  $('#preview').on('click', 'img', function ( event ) {
    hidePreview(true);
  });
})('off');

$(document).on('click', '.delete', function () {
  var tag = $.trim($(this).closest('.tag').find('span').text());
  var _id = $(this).closest('.clippet').data('_id');
  deleteTag(_id, tag);
});
