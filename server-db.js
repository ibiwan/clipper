console.log('server-db.js');

// const EventEmitter = require('events');
// var emitter = new EventEmitter();
// emitter.setMaxListeners(15);

const Promise  = require('bluebird');
const mongodb  = require('mongodb');
const util     = require('util');
const md5      = require('md5');
const fs       = require('fs');
const dbConfig = require('./db');

var pDb    = mongodb.MongoClient.connect(dbConfig.url, { promiseLibrary : Promise });

pCollStuff = pDb.then(function ( db ) {
  return db.collection('stuff');
});

function formatTag(str){
  return str.toLowerCase();//.replace(/ /g, '-');
}

function find(coll, query, excludeContent){
  return coll.find(query, excludeContent ? {data:0} : {}).sort({ lastUpdated:-1, _id:-1 }).toArray();
}

function getClippets(){
  return pCollStuff.then(function(collStuff){
    return find(collStuff, {}, true)
  });
}

function uploadFile(originalName, localName, type){
  return pCollStuff.then(function ( collStuff ) {
    var content  = fs.readFileSync(localName);
    var hash     = md5(content);

    var newDoc      = {
      'data'       : content,
      'md5'        : hash,
      'type'       : type,
      'filename'   : originalName,
      'tags'       : [ formatTag(originalName) ],
      'lastUpdated': Date.now()
    };

    return collStuff
      .insert(newDoc)
      .then(function ( resp ) {
        var id = resp.ops[ 0 ]._id;
        return { id : id, hash : hash };
      })
      .catch(function ( err ) {
        if ( err.code === 11000 ) {
          return find(collStuff, { md5 : hash, filename : originalName })
            .then(function ( matched ) {
              return { id : matched[0]._id, hash : hash };
            });
        }
        throw err;
      })
      .finally(function () {
       fs.unlink(localName);
    });
  });
}

function getImageContent(_id){
  var idObj = mongodb.ObjectId(_id);
  return pCollStuff
    .then(function(collStuff){
      return find(collStuff, {_id:idObj});
    })
    .then(function(arr){
      return {
        data: arr[0].data.buffer,
        type: arr[0].type
      };
    });
}

function editTag(_id, updateDoc){ 
  var queryDoc  = { _id : mongodb.ObjectId(_id) };
  return pCollStuff.then(function(collStuff){
    return collStuff
      .updateMany(queryDoc, updateDoc)
      .then(function(){
        return find(collStuff, queryDoc, true);
      })
      .then(function(arr){
        return arr[0];
      });
  });
}

function addTag(_id, tag){
  var updateDoc = {
    '$set'      : { lastUpdated: Date.now() },
    '$addToSet' : { tags : { $each: tag.toLowerCase().split(' ') } }
  };
  return editTag(_id, updateDoc);
}

function deleteTag(_id, tag){
  var updateDoc = {
    '$set'     : { lastUpdated: Date.now() },
    '$pullAll' : { tags : [tag] }
  };
  return editTag(_id, updateDoc);
}

function deleteClippet(_id){
  return pCollStuff.then(function(collStuff){
    var queryDoc = { _id : mongodb.ObjectId(_id) };
    return collStuff.deleteOne(queryDoc);
  });
}

module.exports = {
  addTag          : addTag,
  deleteTag       : deleteTag,
  uploadFile      : uploadFile,
  getClippets     : getClippets,
  deleteClippet   : deleteClippet,
  getImageContent : getImageContent,
};
