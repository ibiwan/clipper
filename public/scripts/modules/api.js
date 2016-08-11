define(['mod/events'], function(events){

  function affectTag( _id, tag, verb ) {
    $.ajax({
      method   : verb,
      url      : 'tag/' + _id + '/' + tag ,
      dataType : 'json'
    })
     .then(function(clip){
      events.publish('/clipart/addOne', {clip:clip}); 
    });
  }

  function getList( ) {
    $.getJSON({ url:'clippets' })
    .then(function(data){
      events.publish('/clipart/replaceList', {clips:data});
    });
  }

  function deleteClippet( _id ) {
    $.ajax({
      method   : 'delete',
      url      : '/' + _id,
      dataType : 'json'
    })
    .then(function(data){
      getList();
    });
  }

  events.subscribe('/api/deleteClippet', function(o){
    deleteClippet(o._id);
  });

  events.subscribe('/api/addTag', function(o){
    affectTag(o._id, o.tag, 'post');
  });

  events.subscribe('/api/deleteTag', function(o){
    affectTag(o._id, o.tag, 'delete');
  });

  events.subscribe('/api/getList', function(o){
    getList();
  });

  return {
    true:true
  };
  
});
