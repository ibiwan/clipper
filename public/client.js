$(function() {
  $.getJSON({
      url: 'clippets',
    })
    .then(function(data) {
      console.log(data);
      $('#clippets')
        .html('');
      data.forEach(function(item) {
        console.log(item);
        switch(item.type) {
          case 'image/jpeg':
            $('#clippets')
              .append(
                $('<div class="clippet"></div>')
                .append(
                  $('<img>')
                  .attr('src', 'imgfile/' + item.id)
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
