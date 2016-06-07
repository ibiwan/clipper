$(function () {
  $.getJSON({
              url : 'clippets',
            })
   .then(function ( data ) {

     $('#clippets').html('');
     var seen = {};

     data.forEach(function ( item ) {

       console.log(item);

       var fingerprint = (item.filename || item.content) + item.md5;
       if ( seen[ fingerprint ] ) {
         return;
       }
       seen[ fingerprint ] = true;

       switch ( item.type ) {
         case 'image/jpeg':
           $('#clippets')
             .append(
               $('<div class="clippet"></div>')
                 .append(
                   $('<img>')
                     .attr('src', 'imgfile/' + item._id)
                     .attr('type', item.type)
                     .attr('alt', item.filename)
                     .attr('height', 100)
                     .attr('width', 100)
                 )
             );
           break;
       }
     });
   });
});
