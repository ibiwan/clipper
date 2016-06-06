// init project
var express = require('express');
var mongodb = require('mongodb');
var app = express();
var db_uri = 'mongodb://'+process.env.DB_USER+':'+process.env.DB_PASS+'@'+process.env.DB_HOST+':'+process.env.DB_PORT+'/'+process.env.DB_NAME;
var bodyParser = require('body-parser')
var multer  = require('multer')
var upload = multer({ dest: 'uploads/' })

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));
// app.use(express.json());            // to support JSON-encoded bodies
// app.use(express.urlencoded());      // to support URL-encoded bodies
// app.use(express.json());
// app.use(express.urlencoded());
// app.use(express.multipart());
app.use(bodyParser.json());         // to support JSON-encoded bodies
// app.use(bodyParser.urlencoded());   // to support JSON-encoded bodies
// app.use(bodyParser.multipart());    // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 

var pDb = mongodb.MongoClient.connect(db_uri);

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (request, response) {
  // response.send(JSON.stringify({heya:'world'}));
  response.sendFile(__dirname + '/views/index.html');
});

pCollArr = pDb.then(function(db){
  // console.log('getting cursor');
  return db.listCollections();
})
.then(function(col){
  // console.log('getting array');
  return col.toArray();
});

pCollStuff = pDb.then(function(db){
  return db.collection('stuff');
});

app.get('/db', function(request, response){
  console.log('responding');
  pCollArr.then(function(arr){
    response.send(JSON.stringify(arr));
  });
});

// could also use the POST body instead of query string: http://expressjs.com/en/api.html#req.body
app.post("/file-upload", upload.single('avatar'), function (request, response) {
  pCollStuff.then(function(stuff){
    console.log(request);
    var post = request.body;
    console.log(post);
    var x = stuff.insert(post).then(function(x){ // insert, update, find, drop
      console.log('added', x.ops[0]._id);
    });
  }).catch(function(err){
    console.log('err', err);
  });
  response.sendStatus(200);
});

// listen for requests :)
listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
