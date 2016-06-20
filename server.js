console.log('server.js');

const Promise    = require("bluebird");
const express    = require('express');
const app        = express();
const bodyParser = require('body-parser');
const multer     = require('multer');
const upload     = multer({ dest : 'uploads/tmp/' });
const serverDb   = require('./server-db.js');

app.use(express.static('public'));
app.use(bodyParser.json());                          // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({ extended : true })); // to support URL-encoded bodies

app.use(function (req, resp, next) {
  console.log(req.originalUrl, req.params);
  next();
});

app.get("/", function ( req, resp ) {
  resp.sendFile(__dirname + '/views/index.html');
});

app.post( "/file-upload", upload.single('file'),
  function ( req, resp, next ) {
    serverDb
      .uploadFile(req.file.originalname, req.file.destination + req.file.filename, req.file.mimetype)
      .then(function(idHash){
        resp.send(idHash);
      })
      .catch(next);

  });

app.get('/clippets', function ( req, resp, next ) {
  serverDb.getClippets().then(function(arr){
      return resp.json(arr);
  }).catch(next);
});

app.get('/tag/delete/:_id/:tag', function ( req, resp, next ) {
  serverDb.deleteTag(req.params._id, req.params.tag).then(function(doc){
    return resp.json(doc);
  });
});

app.get('/tag/add/:_id/:tag', function(req, resp, next){
  serverDb.addTag(req.params._id, req.params.tag).then(function(doc){
    return resp.json(doc);
  });
})

app.get('/imgfile/:_id', function ( req, resp, next ) {
  serverDb.getImageContent(req.params._id).then(function(doc){
      resp.set('Cache-Control', 'max-age=600');
      resp.set('Content-Type', doc.type);
      resp.send(doc.data);
    }).catch(next);
});

listener = app.listen(process.env.PORT || 8080, function () {
    'Your app is listening on port '
    + listener.address().port;
});
