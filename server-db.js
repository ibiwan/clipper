console.log('server-db.js');

const Promise = require('bluebird');
const mongodb = require('mongodb');
const util    = require('util');
const md5     = require('md5');
const fs      = require('fs');

var db_uri = util.format( 'mongodb://%s:%s@%s:%s/%s',
  process.env.DB_USER, process.env.DB_PASS, process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME
);

var pDb    = mongodb.MongoClient.connect(db_uri, { promiseLibrary : Promise });

pCollStuff = pDb.then(function ( db ) {
  return db.collection('stuff');
});

function formatTag(str){
  return str.toLowerCase().replace(/ /g, '-');
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

    collStuff
      .insert(newDoc)
      .then(function ( resp ) {
        var id = resp.ops[ 0 ]._id;
        return { id : id, hash : hash };
      })
      .catch(function ( err ) {
        if ( err.code === 11000 ) {
          return find(collStuff, { md5 : hash, filename : originalName })
            .then(function ( matched ) {
              return { id : matched._id, hash : matched.hash };
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

function editTag(_id, tag, verb){ // if using pullAll, tag must be an array
  var queryDoc  = { _id : mongodb.ObjectId(_id) };
  var updateDoc = { 
    '$set' : { lastUpdated: Date.now() }
  };
  updateDoc[verb] = { tags : tag };
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
  return editTag(_id, formatTag(tag), '$addToSet');
}

function deleteTag(_id, tag){
  return editTag(_id, [tag], '$pullAll');
}

exports.addTag          = addTag;
exports.deleteTag       = deleteTag;
exports.uploadFile      = uploadFile;
exports.getClippets     = getClippets;
exports.getImageContent = getImageContent;
