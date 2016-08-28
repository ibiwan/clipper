/*global requirejs */

// Start the main app logic. require all modules that rely on events since they're not called directly anywhere
requirejs(
    ['jquery', 'mod/events', 'mod/api', 'mod/clipart', 'mod/factory', 'mod/preview', 'mod/search', 'mod/ui'],
    function ($, events) {
        "use strict";
        $(function () {
            $('#preview-col').hide();
            events.publish('/api/getList');
            events.publish('/refresh', {clearIfEmpty: true});
        });
    }
);
