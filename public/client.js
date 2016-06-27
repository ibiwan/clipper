var events_g = (function(){
  var topics = {};
  var hOP = topics.hasOwnProperty;

  return {
    subscribe: function(topic, listener) {
      // Create the topic's object if not yet created
      if(!hOP.call(topics, topic)) topics[topic] = [];

      // Add the listener to queue
      var index = topics[topic].push(listener) -1;

      // Provide handle back for removal of topic
      return {
        remove: function() {
          delete topics[topic][index];
        }
      };
    },
    publish: function(topic, info) {
      // If the topic doesn't exist, or there's no listeners in queue, just leave
      if(!hOP.call(topics, topic)) return;

      // Cycle through topics queue, fire!
      topics[topic].forEach(function(item) {
          item(info != undefined ? info : {});
      });
    }
  };
})();

var factory_g = (function(events){
  var templates    = {};
  [ 'tag_row', 'meta_tag_btn', 'cloud_tag_btn', 'clippet', 'content_image' ].forEach(function ( t ) {
    Mustache.parse(templates[ t ] = $('#' + t).html());
  });

  function tagRow(){
    return $(Mustache.render(templates.tag_row));
  }

  function clippet(_id, type, filename){
    return $(Mustache.render(templates.clippet, { _id:_id, type:type, filename:filename }));
  }

  function contentImage(_id, type, filename){
    return $(Mustache.render(templates.content_image, { _id:_id, type:type, filename:filename }));
  }

  function metaTagButton(tag){
    return $(Mustache.render(templates.meta_tag_btn, { tag:tag }));
  }

  function cloudTagButton(tag){
    return $(Mustache.render(templates.cloud_tag_btn, { tag:tag }));
  }

  return {
    tagRow         : tagRow,
    clippet        : clippet,
    contentImage   : contentImage,
    metaTagButton  : metaTagButton,
    cloudTagButton : cloudTagButton,
    true:true
  };
})(events_g);

var preview_g = (function(events){
  $.prototype.switchClass = function(remove, add){
    return $(this).removeClass(remove).addClass(add);
  };

  var previewState = 'off';

  function show( imgUrl, keep ) {
    if ( previewState === 'off' || keep ) {
      previewState = keep ? 'keep' : 'moment';
      $('.thumb').switchClass('col-xs-3 col-md-2', 'col-xs-12');
      $('.metadata').hide();
      $('#preview-col').show().find('img').attr('src', imgUrl);
      $('#clippets-col').switchClass('col-xs-10 col-md-9', 'col-xs-3 col-md-2');
      $('#tag-list-col').hide();
    }
  }

  function hide( force ) {
    if ( previewState === 'moment' || (previewState === 'keep' && force) ) {
      previewState = 'off';
      $('.thumb').switchClass('col-xs-12', 'col-xs-3 col-md-2');
      $('.metadata').show();
      $('#preview-col').hide();
      $('#tag-list-col').show();
      $('#clippets-col').switchClass('col-xs-3 col-md-2', 'col-xs-10 col-md-9');
    }
  }

  events.subscribe('/preview/show', function(o){
    show(o.url, o.keep);
  });

  events.subscribe('/preview/hide', function(o){
    hide(o.force);
  });

  return {
    true:true
  };
})(events_g);

var ui_g = (function(events){
  function deleteTagButtonPressed(e, deleteButton){
    var tag = $(deleteButton).closest('.tag').find('span').text();
    var _id = $(deleteButton).closest('.clippet').data('_id');
    events.publish('/api/deleteTag', {_id:_id, tag:tag});
    e.stopPropagation();
  }

  function deleteClippetButtonPressed(e, deleteButton){
    var _id = $(deleteButton).closest('.clippet').data('_id');
    events.publish('/api/deleteClippet', {_id:_id});
    e.stopPropagation();
  }

  function newTagInputChanged(input){
    var tag = $(input).val();
    var _id = $(input).closest('.clippet').data('_id');
    events.publish('/api/addTag', {_id:_id, tag:tag});
  }

  function selectModeClicked(modeButton){
    $('.modeButton').removeClass('active');
    $(modeButton).addClass('active');
    updateConfig();
  }

  function searchTermClicked(tagBtn){
    events.publish('/search/addTerm', {term:$(tagBtn).find('span').text()} );
  }

  Dropzone.options.drop = {
    init : function () {
      this.on("success", function(){
        events.publish('/api/getList');
      });
    }
  };

  function urlFromWell(well){
    return $(well).find('img').attr('src');
  }

  $(document)   .on('click',      '.delete-tag',     function (e) { deleteTagButtonPressed(e, this);                                      });
  $(document)   .on('click',      '.delete-clippet', function (e) { deleteClippetButtonPressed(e, this);                                      });
  $(document)   .on('change',     '.newTag',         function (e) { newTagInputChanged(this);                                             });
  $(document)   .on('submit',     '.newTagForm',     function (e) { e.preventDefault();                                                   });
  $(document)   .on('submit',     '#searchForm',     function (e) { e.preventDefault();                                                   });
  $(document)   .on('click',      '.modeButton',     function (e) { selectModeClicked(this);                                              });
  $(document)   .on('click',      '.tag',            function (e) { searchTermClicked(this);                                              });
  $(document)   .on('keyup',      '#searchField',    function (e) { events.publish('/refresh', {clearIfEmpty:false});                     });
  $(document)   .on('click',      '#searchClear',    function (e) { events.publish('/search/clear');                                      });
  $('#preview') .on('click',      'img',             function (e) { events.publish('/preview/hide', {force:true});                        });
  $('#clippets').on('mouseleave', '.well',           function (e) { events.publish('/preview/hide', {force:false});                       });
  $('#clippets').on('click',      '.well',           function (e) { events.publish('/preview/show', {url:urlFromWell(this), keep:true});  });
  $('#clippets').on('mouseenter', '.well',           function (e) { events.publish('/preview/show', {url:urlFromWell(this), keep:false}); });

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
        : $(widget).slideUp(400,   'linear');
    });
  }

  events.subscribe('/refresh', function(o){
    updateConfig(true);
  });

  return {
    true:true
  };
})(events_g);

var clipart_g = (function(factory, events){
  var clipSeen     = {};

  function show(clips, freshStart){
    if(freshStart){
      clipSeen = {};
      $('#clippets').html('');
    }
    if(clips.filter(function(clip){
      return addClip(clip);
    })){
      events.publish('/refresh', {clearIfEmpty:true});
    }
  }

  function getSeen(){
    return clipSeen;
  }


  function makeTagRow(tags){
    var tagRow = factory.tagRow();

    var tagSet = tagRow.find('.tags');
    tags.sort().reverse().forEach(function(tag){
      if(typeof tag === 'string'){
        tagSet.prepend(factory.metaTagButton(tag));
      }
    });

    return tagRow;
  }

  function addImageClip( _id, type, filename, md5str, tags ) {
    var fingerprint = filename + md5str;
    if ( clipSeen[ fingerprint ] ) {
      clipSeen[ fingerprint ].clippet.remove();
    }

    var content = factory.contentImage(_id, type, filename);
    var clippet = factory.clippet(_id, type, filename);

    clippet.find('.well').append(content);

    clipSeen[ fingerprint ] = {tags:tags, clippet:clippet};
    clippet.find('.tagRowHolder').append(makeTagRow(tags));
    clippet.hide();

    $('#clippets').prepend(clippet); // adds to DOM, so now we can place cursor
    clippet.find('.newTag').focus();

    return clippet;
  }

  function addClip( item ) {
    switch ( item.type ) {
      case 'image/jpeg':
      case 'image/png':
        return addImageClip(item._id, item.type, item.filename, item.md5, item.tags);
        break;
      default:
        console.log("couldn't handle type: " + item.type);
        return false;
        break;
    }


  }

  events.subscribe('/clipart/addOne', function(o){
    show([o.clip], false);
  });

  events.subscribe('/clipart/replaceList', function(o){
    show(o.clips, true);
  });

  return {
    getSeen : getSeen,
    true:true
  };
})(factory_g, events_g);

var search_g = (function(clipart, factory, events){
  String.prototype.saneSplit = function(delim) {
    return (this.length === 0) ? [] : this.split(delim);
  };

  function clear(){
    $('#searchField').val('');
    update();
  }

  function unHide(clippet){
    var img = clippet.find('img');
    img.attr('src', img.data('src'));
    clippet.show();
  }

  function matchTermsTags(terms, tags){
    return terms.every(function(term){
      return tags.some(function(tag){
        if(typeof tag !== 'string'){
          return false;
        }
        return tag.match(term);
      });    
    });
  }

  function update(clearIfEmpty){  
    $('.clippet').hide();

    var searchString = $('#searchField').val();
    $('#searchClear').toggle(searchString !== '');
    var searchTerms = $.trim(searchString).saneSplit(' ');

    var nShown = 0;
    $.each(clipart.getSeen(), function(fingerprint, clip){
      if( nShown >= 7 ) {
        return false;
      }
      if( searchTerms.length === 0 || matchTermsTags(searchTerms, clip.tags) ){
        unHide(clip.clippet);
        nShown++;
      }
    });
    if(clearIfEmpty && nShown === 0){
      clear();
      return true;
    }
    return false;
  }

  function addTerm(tag){
    var field = $('#searchField');
    field.val(tag + ' ' + field.val());
    field.focus();
    var cleared = update(true);
    if(cleared){
      field.val(tag + ' ' + field.val());
      field.focus();
      var cleared = update(false);
    }
  }

  function showTagSet(){
    tagHisto = {}; /* collect tag counts */
    $.each(clipart.getSeen(), function(fingerprint, ct){
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
      tagListCol.append(factory.cloudTagButton(tf.tag));
    });
  }

  events.subscribe('/refresh', function(o){
    update(o.clearIfEmpty);
    showTagSet();
  });

  events.subscribe('/search/addTerm', function(o){
    addTerm(o.term);
  });

  events.subscribe('/search/clear', function(o){
    clear();
  });

  events.subscribe('/search/showTagSet', function(o){
    showTagSet();
  });

  return {
    true:true
  };
})(clipart_g, factory_g, events_g);

var api_g = (function(events){

  function affectTag( _id, tag, verb ) {
    $.getJSON({ url : 'tag/' + verb + '/' + _id + '/' + tag })
    .then(function(clip){
      events.publish('/clipart/addOne', {clip:clip}); 
    });
  }

  function deleteTag( _id, tag ) {
    affectTag( _id, tag, 'delete' );
  }

  function addTag( _id, tag ) {
    affectTag( _id, tag, 'add' );
  }

  function getList( ) {
    $.getJSON({ url:'clippets' })
     .then(function(data){
        events.publish('/clipart/replaceList', {clips:data});
     });
  }

  function deleteClippet( _id ) {
    $.getJSON({ url: 'delete/' + _id })
    .then(function(data){
        getList();
    });
  }

  events.subscribe('/api/deleteClippet', function(o){
    deleteClippet(o._id);
  });

  events.subscribe('/api/addTag', function(o){
    addTag(o._id, o.tag);
  });

  events.subscribe('/api/deleteTag', function(o){
    deleteTag(o._id, o.tag);
  });

  events.subscribe('/api/getList', function(o){
    getList();
  });

  return {
    true:true
  };
})(events_g);

function startup(events){
  return function(){
    $('#preview-col').hide();
    events.publish('/api/getList');
    events.publish('/refresh', {clearIfEmpty:true});
  }
}

$(startup(events_g));
