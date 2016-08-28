/*global define */

define(['jquery', 'mod/factory', 'mod/events'], function ($, factory, events) {
    "use strict";

    var clipSeen = {};

    function getClipContent(item) {
        switch (item.type) {
            case 'image/jpeg':
            case 'image/png':
                return factory.contentImage(item._id, item.type, item.filename);
            case 'application/pdf':
                return factory.contentPdf(item._id, item.filename);
            default:
                console.log("couldn't handle type: " + item.type);
                return false;
        }
    }

    function makeTagRow(tags) {
        var tagRow = factory.tagRow();

        var tagSet = tagRow.find('.tags');
        tags.sort().reverse().forEach(function (tag) {
            if (typeof tag === 'string') {
                tagSet.prepend(factory.metaTagButton(tag));
            }
        });

        return tagRow;
    }

    function addClip(item) {

        var fingerprint = item.filename + item.md5str;
        if (clipSeen[fingerprint]) {
            clipSeen[fingerprint].clippet.remove();
        }

        var clippet = factory.clippet(item._id, item.type, item.filename);
        var content = getClipContent(item);

        var well = clippet.find('.well');
        clippet.activate = content.data('activate');

        well.append(content);
        well.data('clone', content.data('clone'));

        clipSeen[fingerprint] = {tags: item.tags, clippet: clippet};
        clippet.find('.tagRowHolder').append(makeTagRow(item.tags));
        clippet.hide();

        $('#clippets').prepend(clippet);
        // ^ adds to DOM, so now we can place cursor v
        clippet.find('.newTag').focus();

        return clippet;

    }

    function show(clips, freshStart) {
        if (freshStart) {
            clipSeen = {};
            $('#clippets').html('');
        }
        if (clips.filter(function (clip) {
            // use filter to loop over clips so we can...
            return addClip(clip);
        })) {
            // ...refresh if any addClip returned non-null
            events.publish('/refresh', {clearIfEmpty: true});
        }
    }

    function getSeen() {
        return $.extend({}, clipSeen); //copy so changes don't propagate backwards
    }

    events.subscribe('/clipart/addOne', function (o) {
        show([o.clip], false);
    });

    events.subscribe('/clipart/replaceList', function (o) {
        show(o.clips, true);
    });

    return {
        getSeen: getSeen,
        true: true
    };
});
