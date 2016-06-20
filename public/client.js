var clipSeen     = {};
var templates    = {};
var previewState = 'off';

String.prototype.saneSplit = function(delim) {
  return (this.length === 0) ? [] : this.split(delim);
};

$.prototype.switchClass = function(remove, add){
  return $(this).removeClass(remove).addClass(add);
};

[ 'tag_row', 'meta_tag_btn', 'cloud_tag_btn', 'clippet' ].forEach(function ( t ) {
  Mustache.parse(templates[ t ] = $('#' + t).html());
});

var clearClips = function () {
  clipSeen = {};
  $('#clippets').html('');
};

function makeTagRow(tags){
  var tagRow = $(Mustache.render(templates.tag_row));

  var tagSet = tagRow.find('.tags');
  tags.sort().reverse().forEach(function(tag){
    tagSet.prepend(Mustache.render(templates.meta_tag_btn, { tag:tag }));
  });

  return tagRow;
}

function addImageClip( _id, type, filename, md5str, tags ) {
  var fingerprint = filename + md5str;
  if ( clipSeen[ fingerprint ] ) {
    clipSeen[ fingerprint ].clippet.remove();
  }

  var clippet = $(Mustache.render(templates.clippet, { _id:_id, type:type, filename:filename }));

  clipSeen[ fingerprint ] = {tags:tags, clippet:clippet};
  clippet.find('.tagRowHolder').append(makeTagRow(tags));
  clippet.hide();

  $('#clippets').prepend(clippet); // adds to DOM, so now we can place cursor
  clippet.find('.newTag').focus();

  return clippet;
}

function addClip( item ) {
  var clip;
  switch ( item.type ) {
    case 'image/jpeg':
    case 'image/png':
      clip = addImageClip(item._id, item.type, item.filename, item.md5, item.tags);
      break;
    default:
      console.log("couldn't handle type: " + item.type);
      break;
  }
  if(clip){
    updateConfig(true);
    updateFilter();
  }
}

function deleteTag( _id, tag ) {
  $.getJSON({ url : 'tag/delete/' + _id + '/' + tag }).then(addClip);
}

function addTag( _id, tag ) {
  $.getJSON({ url : 'tag/add/' + _id + '/' + tag }).then(addClip);
}

function updateConfig(fast){
  $.each({
    '#search'     : '#searchEnabled', 
    '#upload'     : '#uploadEnabled', 
    '.newTagSpan' : '#uploadEnabled', 
    '.delete'     : '#deleteEnabled'
  }, function(widget, enabler){
    if(fast){
      $(widget).toggle($(enabler).hasClass('active'));
      return;
    }
    $(enabler).hasClass('active') 
      ? $(widget).slideDown(400, 'linear') 
      : $(widget).slideUp(400, 'linear');
  });
}

function showClips(clips){
   clearClips();
   clips.forEach(addClip);
   updateFilter();
}

function showTagSet(){
  tagHisto = {}; /* collect tag counts */
  $.each(clipSeen, function(fingerprint, ct){
    $.each(ct.tags, function(i, tag){
      tagHisto[tag] = tagHisto[tag] + 1 || 1;
    });
  });

  tagFreq = []; /* reformat for sorting */
  $.each(tagHisto, function(tag, freq){
    if(freq > 0){
      tagFreq.push({tag:tag, freq:freq});
    }
  });
  tagFreq.sort(function(a, b){return b.freq - a.freq;});

  /* render tags */
  var tagListCol = $('#tag-list-col').html('');
  $.each(tagFreq, function(i, tf){
    tagListCol.append(Mustache.render(templates.cloud_tag_btn, { tag:tf.tag }));
  });
}

function getList() {
  $.getJSON({ url:'clippets' })
   .then(function(data){
      showClips(data);
      showTagSet();
   });
}

function unHide(clippet){
  var img = clippet.find('img');
  img.attr('src', img.data('src'));
  clippet.show();
}

function clearSearchField(){
  $('#searchField').val('');
  updateFilter();
}

function matchTermsTags(terms, tags){
  return terms.every(function(term){
    return tags.some(function(tag){
      return tag.match(term);
    });    
  });
}

function updateFilter(){  
  $('.clippet').hide();

  var searchString = $('#searchField').val();
  $('#searchClear').toggle(searchString !== '');
  var searchTerms = $.trim(searchString).saneSplit(' ');

  var nShown = 0;
  $.each(clipSeen, function(fingerprint, clip){
    if( nShown >= 7 ) {
      return;
    }
    if( searchTerms.length === 0 || matchTermsTags(searchTerms, clip.tags) ){
      unHide(clip.clippet);
      nShown++;
    }
  });
}

function showPreview( well, keep ) {
  if ( previewState === 'off' || keep ) {
    var imgUrl = $(well).find('img').attr('src')

    previewState = keep ? 'keep' : 'moment';
    $('.thumb').switchClass('col-xs-3 col-md-2', 'col-xs-10 col-md-9');
    $('.metadata').hide();
    $('#preview-col').show().find('img').attr('src', imgUrl);
    $('#clippets-col').switchClass('col-xs-10 col-md-9', 'col-xs-3 col-md-2');
    $('#tag-list-col').hide();
  }
}

function hidePreview( force ) {
  if ( previewState === 'moment' || (previewState === 'keep' && force) ) {
    previewState = 'off';
    $('.thumb').switchClass('col-xs-10 col-md-9', 'col-xs-3 col-md-2');
    $('.metadata').show();
    $('#preview-col').hide();
    $('#tag-list-col').show();
    $('#clippets-col').switchClass('col-xs-3 col-md-2', 'col-xs-10 col-md-9');
  }
}

function deleteTagButtonPressed(e, deleteButton){
  var tag = $(deleteButton).closest('.tag').find('span').text();
  var _id = $(deleteButton).closest('.clippet').data('_id');
  deleteTag(_id, tag);
  e.stopPropagation();
}

function newTagInputChanged(input){
  var tag = $(input).val();
  var _id = $(input).closest('.clippet').data('_id');
  addTag(_id, tag);
}

function selectMode(modeButton){
  $('.modeButton').removeClass('active');
  $(modeButton).addClass('active');
  updateConfig();
}

function addTermToSearch(tagDiv){
  var tag   = $(tagDiv).find('span').text();
  var field = $('#searchField');
  field.val(tag + ' ' + field.val());
  field.focus();
  updateFilter();
}

Dropzone.options.drop = {
  init : function () {
    this.on("complete", function(){getList();});
  }
};

$(document)   .on('click',      '.delete',      function (e) { deleteTagButtonPressed(e, this);         });
$(document)   .on('change',     '.newTag',      function (e) { newTagInputChanged(this);                });
$(document)   .on('submit',     '.newTagForm',  function (e) { e.preventDefault();                      });
$(document)   .on('submit',     '#searchForm',  function (e) { e.preventDefault();                      });
$(document)   .on('click',      '.modeButton',  function (e) { selectMode(this);                        });
$(document)   .on('click',      '.tag',         function (e) { addTermToSearch(this);                   });
$(document)   .on('keyup',      '#searchField', function (e) { updateFilter()                           });
$(document)   .on('click',      '#searchClear', function (e) { clearSearchField()                       });
$('#preview') .on('click',      'img',          function (e) { hidePreview(true);                       });
$('#clippets').on('mouseleave', '.well',        function (e) { hidePreview(false);                      });
$('#clippets').on('click',      '.well',        function (e) { showPreview(this, true);  });
$('#clippets').on('mouseenter', '.well',        function (e) { showPreview(this, false); });

$(function(){
  $('#preview-col').hide();
  updateConfig(true);
  getList();
});
