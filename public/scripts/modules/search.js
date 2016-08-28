/*global define */

define(['jquery', 'mod/clipart', 'mod/factory', 'mod/events'], function ($, clipart, factory, events) {
    "use strict";

    String.prototype.saneSplit = function (delim) {
        return (this.length === 0)
            ? []
            : this.split(delim);
    };

    function clear() {
        $('#searchField').val('');
        update();
    }

    function unHide(clippet) {
        clippet.activate();
        clippet.show();
    }

    function matchTermsTags(terms, tags) {
        return terms.every(function (term) {
            return tags.some(function (tag) {
                if (typeof tag !== 'string') {
                    return false;
                }
                return tag.match(term);
            });
        });
    }

    function update(clearIfEmpty) {
        $('.clippet').hide();

        var searchString = $('#searchField').val();
        $('#searchClear').toggle(searchString !== '');
        var searchTerms = $.trim(searchString).saneSplit(' ');

        var nShown = 0;
        $.each(clipart.getSeen(), function (ignore, clip) {
            if (nShown >= 7) {
                return false;
            }
            if (searchTerms.length === 0 || matchTermsTags(searchTerms, clip.tags)) {
                unHide(clip.clippet);
                nShown += 1;
            }
        });
        if (clearIfEmpty && nShown === 0) {
            clear();
            return true;
        }
        return false;
    }

    function addTerm(tag) {
        tag = $.trim(tag);
        var field = $('#searchField');
        var newSearch = tag + ' ' + field.val();
        field.val(newSearch);

        field.focus();
        var cleared = update(true);

        if (cleared) {
            newSearch = tag + ' ' + field.val();

            field.val(newSearch);
            field.focus();
            cleared = update(false);
        }
    }

    function showTagSet() {
        var tagHisto = {}; /* collect tag counts */
        $.each(clipart.getSeen(), function (ignore, ct) {
            $.each(ct.tags, function (ignore, tag) {
                tagHisto[tag] = tagHisto[tag] + 1 || 1;
            });
        });

        var tagFreq = []; /* reformat for sorting */
        $.each(tagHisto, function (tag, freq) {
            if (freq > 0) {
                tagFreq.push({tag: tag, freq: freq});
            }
        });
        tagFreq.sort(function (a, b) {
            return b.freq - a.freq;
        });

        /* render tags */
        var tagListCol = $('#tag-list-col').html('');
        $.each(tagFreq, function (ignore, tf) {
            tagListCol.append(factory.cloudTagButton(tf.tag));
        });
    }

    events.subscribe('/refresh', function (o) {
        update(o.clearIfEmpty);
        showTagSet();
    });

    events.subscribe('/search/addTerm', function (o) {
        addTerm(o.term);
    });

    events.subscribe('/search/clear', function (ignore) {
        clear();
    });

    events.subscribe('/search/showTagSet', function (ignore) {
        showTagSet();
    });

    return {
        true: true
    };
});
