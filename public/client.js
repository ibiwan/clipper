var templates = {};
[ 'tag_row', 'tag_btn', 'clippet' ].forEach(function ( t ) {
  var template   = $('#' + t).html();
  templates[ t ] = template;
  Mustache.parse(template);
});

var clipSeen       = {};
var clearClips = function () {
  clipSeen = {};
  $('#clippets').html('');
};

function addImageClip( _id, type, filename, md5str, tags ) {
  var fingerprint = filename + md5str;

  if ( clipSeen[ fingerprint ] ) {
    $(clipSeen[ fingerprint ]).remove();
  }

  var tagRow = $(Mustache.render(templates.tag_row));
  var tagSet = tagRow.find('.tags');
  var tagSeen = {};
  tags.forEach(function(tag){
    if(tagSeen[tag]){
      return;
    }
    tagSeen[tag]=true;
    tagSet.prepend(Mustache.render(templates.tag_btn, { tag:tag }));
  });

  var clippet         = Mustache.render(templates.clippet, {
    _id : _id, type : type, filename : filename
  });
  clippet             = $(clippet);
  clipSeen[ fingerprint ] = clippet;
  clippet.find('.tagRowHolder').append(tagRow);

  $('#clippets').prepend(clippet); // adds to DOM, so now we can place cursor

  clippet.find('.newTag').focus();
}

function addClip( item ) {
  switch ( item.type ) {
    case 'image/jpeg':
    case 'image/png':
      addImageClip(item._id, item.type, item.filename, item.md5, item.tags);
      break;
    default:
      console.log("couldn't handle type: " + item.type);
      break;
  }
  updateConfig();
}

function deleteTag( _id, tag ) {
  $.getJSON({ url : 'tag/delete/' + _id + '/' + tag })
   .then(function ( data ) {
     addClip(data);
   });
}

function addTag( _id, tag ) {
  $.getJSON({ url : 'tag/add/' + _id + '/' + tag })
   .then(function ( data ) {
     addClip(data);
   });
}

function updateConfig(){
  $('#search').toggle($('#searchEnabled').is(':checked'));
  $('#upload').toggle($('#uploadEnabled').is(':checked'));
  $('.delete').toggle($('#deleteEnabled').is(':checked'));
}

function getList() {
  $.getJSON({ url:'clippets' })
   .then(function ( data ) {
    console.log(data);
     clearClips();
     data.slice(0, 3).forEach(addClip);
   });
}

Dropzone.options.drop = {
  init : function () {
    this.on("complete", function(){getList();});
  }
};

(function ( previewState ) {
  function showPreview( imgUrl, keep ) {
    if ( previewState === 'off' || keep ) {
      previewState = keep ? 'keep' : 'moment';
      $('#clippets-col').removeClass('col-xs-12').addClass('col-xs-3');
      $('.thumb').removeClass('col-xs-3').addClass('col-xs-12');
      $('#preview-col').show().find('img').attr('src', imgUrl);
      $('.tagRow').hide();
    }
  }

  function hidePreview( force ) {
    if ( previewState === 'moment' || (previewState === 'keep' && force) ) {
      previewState = 'off';
      $('#clippets-col').removeClass('col-xs-3').addClass('col-xs-12');
      $('.thumb').removeClass('col-xs-12').addClass('col-xs-3');
      $('#preview-col').hide();
      $('.tagRow').show();
    }
  }

  $('#clippets').on('mouclipSeenter', '.thumb img', function ( event ) {
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

$(function(){
  updateConfig();
  getList();
});

$(document).on('click', '.delete', function () {
  var tag = $.trim($(this).closest('.tag').find('span').text());
  var _id = $(this).closest('.clippet').data('_id');
  deleteTag(_id, tag);
});
$(document).on('change', '.newTag', function () {
  var tag = $(this).val();
  var _id = $(this).closest('.clippet').data('_id');
  addTag(_id, tag);
});
$(document).on('submit', '.newTagForm', function(e){
  e.preventDefault();
});
$(document).on('change', '#searchEnabled', function(){
  $('#search').toggle(this.checked);
});
$(document).on('change', '#uploadEnabled', function(){
  $('#upload').toggle(this.checked);
});
$(document).on('change', '#deleteEnabled', function(){
  $('.delete').toggle(this.checked);
});
