var clipSeen     = {};
var previewState = 'off';

String.prototype.saneSplit = function(delim) {
  if(this.length === 0){
    return [];
  }
  return this.split(delim);
};

$.prototype.switchClass = function(remove, add){
  return $(this).removeClass(remove).addClass(add);
}

var templates = {};
[ 'tag_row', 'tag_btn', 'tag_btn_simple', 'clippet' ].forEach(function ( t ) {
  var template   = $('#' + t).html();
  templates[ t ] = template;
  Mustache.parse(template);
});

var clearClips = function () {
  clipSeen = {};
  $('#clippets').html('');
};

function makeTagRow(tags){
  var tagRow = $(Mustache.render(templates.tag_row));

  var tagSet = tagRow.find('.tags');
  tags.sort().reverse().forEach(function(tag){
    tagSet.prepend(Mustache.render(templates.tag_btn, { tag:tag }));
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
  clippet.find('.tagRowHolder').append(makeTagRow(tags)).hide();

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
  $.getJSON({ url : 'tag/delete/' + _id + '/' + tag })
    .then(function ( data ) {
      addClip(data);
      // showTagSet();
  });
}

function addTag( _id, tag ) {
  $.getJSON({ url : 'tag/add/' + _id + '/' + tag })
    .then(function ( data ) {
      addClip(data);
      // showTagSet();
  });
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
    $(enabler).hasClass('active') ? $(widget).slideDown() : $(widget).slideUp();
  });
}

function showClips(clips){
   clearClips();
   clips.forEach(addClip);
   updateFilter();
}

function showTagSet(){
  tagHisto = {};
  $.each(clipSeen, function(fingerprint, ct){
    $.each(ct.tags, function(i, tag){
      tagHisto[tag] = tagHisto[tag] + 1 || 1;
    });
  });

  tagFreq = [];
  $.each(tagHisto, function(tag, freq){
    if(freq > 0){
      tagFreq.push({tag:tag, freq:freq});
    }
  });
  tagFreq.sort((a, b) => b.freq - a.freq);

  var tagListCol = $('#tag-list-col').html('');
  $.each(tagFreq, function(i, tf){
    tagListCol.append(Mustache.render(templates.tag_btn_simple, { tag:tf.tag }));
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
  console.log('clearing');
  $('#searchField').val('');
  updateFilter();
}

function updateFilter(){
  var searchString = $('#searchField').val();

  $('#searchClear').toggle(searchString !== '');

  var searchTerms = $.trim(searchString).saneSplit(' ');

  $('.clippet').hide();

  var nShown = 0;
  for(var fingerprint in clipSeen){
    if(nShown >= 5) {
      continue;
    }

    var tags    = clipSeen[fingerprint].tags;
    var clippet = clipSeen[fingerprint].clippet;

    if(searchTerms.length === 0){
      unHide(clippet);
      nShown++;
      continue;
    }

    var allTermsMatched = true;
    for(var j in searchTerms){
      var term = searchTerms[j];

      var anyTagMatched = false;
      for(var k in tags){
        var tag = tags[k];

        if(tag.match(term)){
          anyTagMatched = true; 
          break;
        }
      }

      if(!anyTagMatched){
        allTermsMatched = false;
        break;
      }
    }

    if(allTermsMatched){
      unHide(clippet);
      nShown++;
    }
  }
}

function showPreview( imgUrl, keep ) {
  if ( previewState === 'off' || keep ) {
    previewState = keep ? 'keep' : 'moment';
    $('#clippets-col').switchClass('col-xs-10 col-md-9', 'col-xs-3 col-md-2');
    $('.thumb').switchClass('col-xs-3 col-md-2', 'col-xs-10 col-md-9');
    $('#preview-col').show().find('img').attr('src', imgUrl);
    $('.metadata').hide();
    $('#tag-list-col').hide();
  }
}

function hidePreview( force ) {
  if ( previewState === 'moment' || (previewState === 'keep' && force) ) {
    previewState = 'off';
    $('#clippets-col').switchClass('col-xs-3 col-md-2', 'col-xs-10 col-md-9');
    $('.thumb').switchClass('col-xs-10 col-md-9', 'col-xs-3 col-md-2');
    $('#preview-col').hide();
    $('.metadata').show();
    $('#tag-list-col').show();
  }
}

function deleteTagButtonPressed(e, deleteButton){
  var tag = $.trim($(deleteButton).closest('.tag').find('span').text());
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
  var tag = $.trim($(tagDiv).find('span').text());
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
$('#clippets').on('mouseleave', 'img',          function (e) { hidePreview(false);                      });
$('#clippets').on('click',      'img',          function (e) { showPreview($(this).attr('src'), true);  });
$('#clippets').on('mouseenter', '.thumb img',   function (e) { showPreview($(this).attr('src'), false); });

$(function(){
  updateConfig(true);
  getList();
});
