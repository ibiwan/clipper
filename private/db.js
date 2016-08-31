/*property
  readFileSync, MongoClient, connect, url, promiseLibrary, then, collection, toLowerCase, find, data, sort, lastUpdated, _id, toArray,
  md5, type, filename, tags, now, insert, ops, id, hash, catch, codee, finally, unlink, code, ObjectId, buffer, $set, getClippets, deleteClippet,
  exports, deleteOne, addTag, deleteTag, uploadFile, split, $pullAll
  */
const Promise = require('bluebird');
const mongodb = require('mongodb');
// const util     = require('util');
const md5 = require('md5');
const fs = require('fs');

const dbConfig = require('./db-config');

const pDb = mongodb.MongoClient.connect(dbConfig.url, {
    promiseLibrary: Promise
});

var pCollStuff = pDb.then(function(db) {
    "use strict";
    return db.collection('stuff');
});

function accessFilter(user, moreFilter){
    "use strict";

    var ret;
    if(user){
        ret = {$and: [
            moreFilter,
            {$or:[
                {owner: {$exists: false}},
                {owner: user.username}
            ]}
        ]};
    } else  {
        ret = {$and: [
            moreFilter,
            {owner: {$exists: false}}
        ]};
    }

    return ret;
}

function formatTag(str) {
    "use strict";
    return str.toLowerCase(); //.replace(/ /g, '-');
}

function getList(coll, query, user) {
    "use strict";

    var ret = coll.find(accessFilter(user, query), {data: 0})
        .sort({
            lastUpdated: -1,
            _id: -1
        })
        .toArray();
    return ret;
}

function getClippets(user) {
    "use strict";
    return pCollStuff.then(function(collStuff) {
        return getList(collStuff, {}, user);
    });
}

function uploadFile(originalName, localName, type, user) {
    "use strict";

    return pCollStuff.then(function(collStuff) {
        var content = fs.readFileSync(localName);
        var hash    = md5(content);
        var newDoc  = {
            data        : content,
            md5         : hash,
            type        : type,
            filename    : originalName,
            tags        : [formatTag(originalName)],
            lastUpdated : Date.now()
        };
        if(user){
            newDoc.owner = user.username;
        }
        return collStuff
            .insert(newDoc)
            .then(function(resp) {
                var id = resp.ops[0]._id;
                return {
                    id: id,
                    hash: hash
                };
            })
            .catch(function(err) {
                if (err.code === 11000) {
                    return getList(collStuff, {
                            md5: hash,
                            filename: originalName
                        })
                        .then(function(matched) {
                            return {
                                id: matched[0]._id,
                                hash: hash
                            };
                        });
                }
                throw err;
            })
            .finally(function() {
                fs.unlink(localName);
            });
    });
}

function getImageContent(_id, user) {
    "use strict";

    var idObj = mongodb.ObjectId(_id);
    return pCollStuff
        .then(function(collStuff) {
            var filter = accessFilter(user, {_id: idObj});
            return collStuff.find(filter).toArray();
        })
        .then(function(arr) {
            return {
                data: arr[0].data.buffer,
                type: arr[0].type
            };
        });
}

function editTag(_id, updateDoc, user) {
    "use strict";

    var queryDoc = accessFilter(user, {
        _id: mongodb.ObjectId(_id)
    });
    updateDoc.$set = {
        lastUpdated: Date.now()
    };

    return pCollStuff.then(function(collStuff) {
        return collStuff
            .updateMany(queryDoc, updateDoc)
            .then(function() {
                return getList(collStuff, queryDoc);
            })
            .then(function(arr) {
                return arr[0];
            });
    });
}

function addTag(_id, tag, user) {
    "use strict";

    var updateDoc = {
        $set: {
            lastUpdated: Date.now()
        },
        $addToSet: {
            tags: {
                $each: tag.toLowerCase().split(' ')
            }
        }
    };
    return editTag(_id, updateDoc);
}

function deleteTag(_id, tag, user) {
    "use strict";

    var updateDoc = {
        $set: {lastUpdated: Date.now()},
        $pullAll: {
            tags: [tag]
        }
    };
    return editTag(_id, updateDoc);
}

function deleteClippet(_id, user) {
    "use strict";

    return pCollStuff.then(function(collStuff) {
        var queryDoc = accessFilter(user, {_id: mongodb.ObjectId(_id)});
        return collStuff.deleteOne(queryDoc);
    });
}

module.exports = {
    addTag: addTag,
    deleteTag: deleteTag,
    uploadFile: uploadFile,
    getClippets: getClippets,
    deleteClippet: deleteClippet,
    getImageContent: getImageContent
};