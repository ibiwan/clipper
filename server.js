const Promise    = require("bluebird");
const mongodb    = require('mongodb');
const express    = require('express');
const app        = express();
const bodyParser = require('body-parser');
const fs         = require('fs');
const md5        = require('md5');
const multer     = require('multer');
const upload     = multer({ dest : 'uploads/tmp/' });
const util       = require('util');

app.use(express.static('public'));
app.use(bodyParser.json());                          // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended : true })); // to support URL-encoded bodies
app.use(function (req, resp, next) {
  console.log(req.originalUrl, req.params);
  next();
});
var db_uri = util.format( 'mongodb://%s:%s@%s:%s/%s',
  process.env.DB_USER, process.env.DB_PASS, process.env.DB_HOST, process.env.DB_PORT, process.env.DB_NAME
);
var pDb    = mongodb.MongoClient.connect(db_uri, { promiseLibrary : Promise });

app.get("/", function ( req, resp ) {
  resp.sendFile(__dirname + '/views/index.html');
});

pCollStuff = pDb.then(function ( db ) {
  return db.collection('stuff');
});

app.post(
  "/file-upload",
  upload.single('file'),
  function ( req, resp, next ) {
    pCollStuff.then(function ( collStuff ) {
        var original = req.file.originalname;
        var filename = req.file.destination + req.file.filename;
        var content  = fs.readFileSync(filename);
        var hash     = md5(content);
        var firstTag = original.toLowerCase().replace(/ /g, '-');
        var doc      = {
          'data' : content,
          'md5' : hash,
          'type' : req.file.mimetype,
          'filename' : original,
          'tags' : [ firstTag ]
        };

        collStuff
           .insert(doc)
           .then(function ( resp ) {
             var id = resp.ops[ 0 ]._id;
             resp.send({ id : id, hash : hash });
             return id;
           })
           .catch(function ( err ) {
             if ( err.code === 11000 ) {
               return collStuff
                 .find({ md5 : hash, filename : original })
                 .toArray()
                 .then(function ( matched ) {
                   resp.send({ id : matched._id, hash : matched.hash });
                 });
             }
             throw err;
           })
           .catch(next)
           .finally(function () {
             fs.unlink(req.file.destination + req.file.filename);
           });
      }).catch(next);
  });

app.get('/clippets', function ( req, resp, next ) {
  pCollStuff.then(function ( collStuff ) {
      return collStuff
        .find({}, { data : 0 })
        .sort({ lastUpdated:-1, _id:-1 })
        .toArray();
    })
    .then(function ( arr ) {
      return resp.json(arr);
    }).catch(next);
});

function updateStuff(req, resp, next, queryDoc, updateDoc){
  updateDoc['$set'] = {
    lastUpdated: Date.now()
  };
  pCollStuff.then(function(collStuff){
      collStuff
        .updateMany(queryDoc, updateDoc)
        .then(function () {
          return collStuff
            .find(queryDoc, { data : 0 })
            .toArray();
        })
        .then(function ( arr ) {
          return resp.json(arr[ 0 ]);
        });
  }).catch(next);
}

app.get('/tag/delete/:_id/:tag', function ( req, resp, next ) {
  var idObj     = mongodb.ObjectId(req.params._id);
  var queryDoc  = { _id : idObj };
  var updateDoc = { '$pullAll' : { tags : [ req.params.tag ] } };
  return updateStuff(req, resp, next, queryDoc, updateDoc);
});

app.get('/tag/add/:_id/:tag', function(req, resp, next){
  var idObj     = mongodb.ObjectId(req.params._id);
  var queryDoc  = { _id : idObj };
  var updateDoc = { '$addToSet' : { tags : req.params.tag } };
  return updateStuff(req, resp, next, queryDoc, updateDoc);
})

app.get('/imgfile/:_id', function ( req, resp, next ) {
  pCollStuff
    .then(function ( collStuff ) {
      var id = mongodb.ObjectId(req.params._id);
      return collStuff.find({ _id : id }).toArray();
    })
    .then(function ( docs ) {
      var doc = docs[0];
      resp.set('Cache-Control', 'max-age=600');
      resp.set('Content-Type', doc.type);
      resp.send(doc.data.buffer);
    })
    .catch(next);
});

listener = app.listen(3000, function () {
    'Your app is listening on port '
    + listener.address().port;
});
