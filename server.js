var Promise    = require("bluebird");
var mongodb    = require('mongodb');
var express    = require('express');
var app        = express();
var bodyParser = require('body-parser')
var fs         = require('fs');
var md5        = require('md5');
var multer     = require('multer')
var upload     = multer({
  dest: 'uploads/tmp/'
})

app.use(express.static('public'));
app.use(bodyParser.json());        // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({    // to support URL-encoded bodies
  extended: true
}));

var db_uri = 'mongodb://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@' + process.env.DB_HOST + ':' + process.env.DB_PORT + '/' + process.env.DB_NAME;
var pDb    = mongodb.MongoClient.connect(db_uri, { promiseLibrary: Promise });

app.get("/", function (request, response, next) {
  response.sendFile(__dirname + '/views/index.html');
});

pCollStuff = pDb.then(function (db) {
  return db.collection('stuff');
});

app.post(
  "/file-upload", 
  upload.single('file'), 
  function (request, response, next) {
    pCollStuff
    .then(function (collStuff) {
      console.log('post', request.body);
      var original = request.file.originalname;
      var filename = request.file.destination + request.file.filename;
      var content  = fs.readFileSync(filename);
      var hash     = md5(content);
      var doc      = {
        'data'    : content,
        'md5'     : hash,
        'type'    : request.file.mimetype,
        'filename': original
      };

      collStuff.insert(doc)
      .then(function (resp) { // insert, update, find, drop
        var id = resp.ops[0]._id;
          console.log('added', id);
          response.send({id:id, hash:hash});
          return id;
      })
      .catch(function (err) {
        if (err.code === 11000) {
          console.log('handle duplicate');
          return collStuff
          .findOne({ md5: hash, filename: original })
          .then(function (matched) {
            console.log('already had', matched._id);
            response.send({id:matched._id, hash:matched.hash});
          });
        }
        throw err;
      })
      .catch(next)
      .finally(function(){
        fs.unlink(request.file.destination + request.file.filename);
      });
    }).catch(next);
});

app.get('/clippets', function (request, response, next) {
  pCollStuff
  .then(function (collStuff) {
    return collStuff
      .find({}, { data: 0 })
      .sort({ _id: -1 })
      .limit(10)
      .toArray();
  })
  .then(function (arr) {
    return response.json(arr);
  })
  .catch(next);
});

app.get('/imgfile/:id', function (request, response, next) {
  pCollStuff
  .then(function (collStuff) {
    var id = mongodb.ObjectId(request.params.id);
    return collStuff.findOne({ _id: id });
  })
  .then(function (doc) {
    response.set('Content-Type', doc.type);
    response.send(doc.data.buffer);
  })
  .catch(next);
});

// listen for requests :)
listener = app.listen(3000, function () {
  console.log(
    'Your app is listening on port ' 
    + listener.address().port);
});
