define(['jquery', 'mod/events', 'mustache'], function($, events, Mustache){
  var templates    = {};
  [ 'tag_row', 'meta_tag_btn', 'cloud_tag_btn', 'clippet', 'content_image', 'content_pdf' ].forEach(function ( t ) {
    Mustache.parse(templates[ t ] = $('#' + t).html());
  });

  function tagRow(){
    return $(Mustache.render(templates.tag_row));
  }

  function clippet(_id, type, filename){
    return $(Mustache.render(templates.clippet, { _id:_id, type:type, filename:filename }));
  }

  function contentImage(_id, type, filename){
    var img = $(Mustache.render(templates.content_image, { _id:_id, type:type, filename:filename }));
    img.data('activate', function(){ img.attr('src', img.data('src')); });
    img.data('clone', function(){return contentImage(_id, type, filename);});
    return img;
  }

  function contentPdf(_id, filename){
    var pdf = $(Mustache.render(templates.content_pdf, { _id:_id, filename:filename }));
    pdf.data('activate', function(){ pdf.attr('data', pdf.data('data')); });
    pdf.data('clone', function(){return contentPdf(_id , filename);});
    return pdf;
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
    contentPdf     : contentPdf,
    contentImage   : contentImage,
    metaTagButton  : metaTagButton,
    cloudTagButton : cloudTagButton,
    true:true
  };
});
