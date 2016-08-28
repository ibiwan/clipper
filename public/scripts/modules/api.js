/*global define */

define(['jquery', 'mod/events'], function ($, events) {
    "use strict";

    function affectTag(_id, tag, verb) {
        $.ajax({
            method   : verb,
            url      : 'tag/' + _id + '/' + tag ,
            dataType : 'json'
        })
        .then(function (clip) {
            events.publish('/clipart/addOne', {clip: clip});
        });
    }

    function getList() {
        $.getJSON({url: 'clippets'})
        .then(function (data) {
            events.publish('/clipart/replaceList', {clips: data});
        });
    }

    function deleteClippet(_id) {
        $.ajax({
            method   : 'delete',
            url      : '/' + _id,
            dataType : 'json'
        })
        .then(function (ignore) {
            getList();
        });
    }

    events.subscribe('/api/deleteClippet', function (o) {
        deleteClippet(o._id);
    });

    events.subscribe('/api/addTag', function (o) {
        affectTag(o._id, o.tag, 'post');
    });

    events.subscribe('/api/deleteTag', function (o) {
        affectTag(o._id, o.tag, 'delete');
    });

    events.subscribe('/api/getList', function (ignore) {
        getList();
    });

    return {
        true: true
    };

});
