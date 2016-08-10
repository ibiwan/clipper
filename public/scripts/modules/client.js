// Start the main app logic.
requirejs(['jquery', 'mod/events', 'mod/api', 'mod/clipart', 'mod/factory', 'mod/preview', 'mod/search', 'mod/ui'],
  function ($,      events) {
      //jQuery, canvas and the app/sub module are all
      //loaded and can be used here now.
      $(function(){
        $('#preview-col').hide();
        events.publish('/api/getList');
        events.publish('/refresh', {clearIfEmpty:true});
      });
});
