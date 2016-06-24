app.post( "/file-upload", upload.single('file'),
  function ( req, res, next ) {
    serverDb
      .uploadFile(req.file.originalname, req.file.destination + req.file.filename, req.file.mimetype)
      .then(function(idHash){
        res.send(idHash);
      })
      .catch(next);

  });

app.get('/delete/:_id', function(req, res, next){
  var _id = req.params._id;
  serverDb.deleteClippet(_id).then(function(result){
    return res.json({success:true});
  }).catch(next);
});

app.get('/tag/delete/:_id/:tag', function ( req, res, next ) {
  serverDb.deleteTag(req.params._id, req.params.tag).then(function(doc){
    return res.json(doc);
  }).catch(next);
});

app.get('/tag/add/:_id/:tag', function(req, res, next){
  serverDb.addTag(req.params._id, req.params.tag).then(function(doc){
    return res.json(doc);
  }).catch(next);
})

app.get('/imgfile/:_id', function ( req, res, next ) {
  serverDb.getImageContent(req.params._id).then(function(doc){
      res.set('Cache-Control', 'max-age=600');
      res.set('Content-Type', doc.type);
      res.send(doc.data);
    }).catch(next);
});
