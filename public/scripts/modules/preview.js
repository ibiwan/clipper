/*global define */

define(['jquery', 'mod/events'], function ($, events) {
    "use strict";

    $.prototype.switchClass = function (remove, add) {
        return $(this).removeClass(remove).addClass(add);
    };

    var previewState = 'off';

    function show(showcase, keep) {
        if (previewState === 'off' || keep) {
            previewState = keep
                ? 'keep'
                : 'moment';
            $('.thumb').switchClass('col-xs-3 col-md-2', 'col-xs-12');
            $('.metadata').hide();
            showcase.data('activate')();
            $('#preview-col').show().find('#preview').html(showcase);
            $('#clippets-col').switchClass('col-xs-10 col-md-9', 'col-xs-3 col-md-2');
            $('#tag-list-col').hide();
        }
    }

    function hide(force) {
        if (previewState === 'moment' || (previewState === 'keep' && force)) {
            previewState = 'off';
            $('.thumb').switchClass('col-xs-12', 'col-xs-3 col-md-2');
            $('.metadata').show();
            $('#preview-col').hide();
            $('#tag-list-col').show();
            $('#clippets-col').switchClass('col-xs-3 col-md-2', 'col-xs-10 col-md-9');
        }
    }

    events.subscribe('/preview/show', function (o) {
        show(o.showcase, o.keep);
    });

    events.subscribe('/preview/hide', function (o) {
        hide(o.force);
    });

    return {
        true: true
    };
});
