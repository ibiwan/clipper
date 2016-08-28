define(['jquery', 'mod/events', 'dropzone'], function($, events, Dropzone){
  function deleteTagButtonPressed(e, deleteButton){
    var tag = $(deleteButton).closest('.tag').data('tag');
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

  $(function(){
    Dropzone.options.drop = {
      init : function () {
        this.on("success", function(){
          events.publish('/api/getList');
        }); 
      }
    };    
    var myDropzone = new Dropzone("#drop");
  });

  $(document)   .on('click',      '.delete-tag',     function (e) { deleteTagButtonPressed(e, this);                                                 });
  $(document)   .on('click',      '.delete-clippet', function (e) { deleteClippetButtonPressed(e, this);                                             });
  $(document)   .on('change',     '.newTag',         function (e) { newTagInputChanged(this);                                                        });
  $(document)   .on('submit',     '.newTagForm',     function (e) { e.preventDefault();                                                              });
  $(document)   .on('submit',     '#searchForm',     function (e) { e.preventDefault();                                                              });
  $(document)   .on('click',      '.modeButton',     function (e) { selectModeClicked(this);                                                         });
  $(document)   .on('click',      '.tag',            function (e) { searchTermClicked(this);                                                         });
  $(document)   .on('keyup',      '#searchField',    function (e) { events.publish('/refresh', {clearIfEmpty:false});                                });
  $(document)   .on('click',      '#searchClear',    function (e) { events.publish('/search/clear');                                                 });
  $('#preview') .on('click',                         function (e) { events.publish('/preview/hide', {force:true});                                   });
  $('#clippets').on('mouseleave', '.well',           function (e) { events.publish('/preview/hide', {force:false});                                  });
  $('#clippets').on('click',      '.well',           function (e) { events.publish('/preview/show', {showcase:$(this).data('clone')(), keep:true});  });
  $('#clippets').on('mouseenter', '.well',           function (e) { events.publish('/preview/show', {showcase:$(this).data('clone')(), keep:false}); });

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
});
