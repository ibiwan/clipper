// init project
var express = require('express');
var mongodb = require('mongodb');
var app = express();
var db_uri = 'mongodb://' + process.env.DB_USER + ':' + process.env.DB_PASS + '@' + process.env.DB_HOST + ':' + process.env.DB_PORT + '/' + process.env.DB_NAME;
var bodyParser = require('body-parser')
var fs = require('fs');
var md5 = require('md5');
var multer = require('multer')
var upload = multer({
  dest: 'uploads/tmp/'
})

app.use(express.static('public'));
app.use(bodyParser.json()); // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ // to support URL-encoded bodies
  extended: true
}));

function errorer(response){
	return function(err){
		console.log('error', err, err.stack);
		response.sendStatus(500, err);
	}
}

var pDb = mongodb.MongoClient.connect(db_uri);

app.get("/", function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});

app.get('health', function(request, response) {
  response.sendStatus(200);
});

pCollArr = pDb.then(function(db) {
    return db.listCollections();
  })
  .then(function(col) {
    return col.toArray();
  });

pCollStuff = pDb.then(function(db) {
  return db.collection('stuff');
});

app.get('/db', function(request, response) {
  pCollArr.then(function(arr) {
    var resp = JSON.stringify(arr);
    response.send(resp);
  });
});

app.post("/file-upload", upload.single('file'), function(request, response) {
  console.log('upload requested');
  pCollStuff.then(function(collStuff) {
    var filename = request.file.destination + request.file.filename;

      console.log('post', request.body);

      var content = fs.readFileSync(filename);
      var hash = md5(content);

      var doc = {
        'data': content,
        'md5': hash,
        'type': request.file.mimetype,
        'filename': request.file.originalname
      };

      collStuff.insert(doc)
        .then(function(resp) { // insert, update, find, drop
          console.log('added', resp.ops[0]._id);
          fs.unlink(request.file.destination + request.file.filename);
        })
        .catch(function(err){
          if(err.code === 11000){
            console.log('handle duplicate');
          } else {
            throw err;
          }
        })
        .catch(errorer(response));
    }).catch(errorer(response));
  response.sendStatus(200);
});

app.get('/clippets', function(request, response) {
  pCollStuff.then(function(collStuff) {
    var clippets = collStuff.find({}, {data:0})
      .sort({
        _id: -1
      })
      .limit(10);
    clippets.toArray().then(function(arr) {
        response.json(arr);
      }).catch(errorer(response));
  });
});

app.get('/imgfile/:id', function(request, response) {
  pCollStuff.then(function(collStuff) {
    var cursor = collStuff.findOne({
      _id: mongodb.ObjectId(request.params.id)
    })
    .then(function(doc) {
      response.set('Content-Type', doc.type);	
	  response.send(doc.data.buffer);
    }).catch(errorer(response));
  }).catch(errorer(response));
});

// listen for requests :)
listener = app.listen(3000, function() {
  console.log('Your app is listening on port ' + listener.address()
    .port);
});
