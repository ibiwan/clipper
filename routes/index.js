var express = require('express');
var router = express.Router();
const serverDb = require('../server-db');
const multer       = require('multer');
const upload   = multer({ dest : 'uploads/tmp/' });

var isAuthenticated = function (req, res, next) {
	// if user is authenticated in the session, call the next() to call the next request handler 
	// Passport adds this method to request object. A middleware is allowed to add properties to
	// request and response objects
	if (req.isAuthenticated())
		return next();
	// if the user is not authenticated then redirect him to the login page
	res.redirect('/');
}

module.exports = function(passport){

	/* GET login page. */
	router.get('/', function(req, res) {
    	// Display the Login page with any flash message, if any
		res.render('index', { message: req.flash('message') });
	});

	/* Handle Login POST */
	router.post('/login', passport.authenticate('login', {
		successRedirect: '/home',
		failureRedirect: '/',
		failureFlash : true  
	}));

	/* GET Registration Page */
	router.get('/signup', function(req, res){
		res.render('register',{message: req.flash('message')});
	});

	/* Handle Registration POST */
	router.post('/signup', passport.authenticate('signup', {
		successRedirect: '/home',
		failureRedirect: '/signup',
		failureFlash : true  
	}));

	/* GET Home Page */
	router.get('/home', isAuthenticated, function(req, res){
		res.render('home', { user: req.user, title: "Here's Your Stuff!" });
	});

	/* Handle Logout */
	router.get('/signout', function(req, res) {
		req.logout();
		res.redirect('/');
	});

	router.get('/clippets', function ( req, res, next ) {
	  serverDb.getClippets().then(function(arr){
	      return res.json(arr);
	  }).catch(next);
	});

	router.get('/imgfile/:_id', function ( req, res, next ) {
	  serverDb.getImageContent(req.params._id).then(function(doc){
	      res.set('Cache-Control', 'max-age=600');
	      res.set('Content-Type', doc.type);
	      res.send(doc.data);
	    }).catch(next);
	});



	router.post( "/file-upload", upload.single('file'),
	  function ( req, res, next ) {
	    serverDb
	      .uploadFile(req.file.originalname, req.file.destination + req.file.filename, req.file.mimetype)
	      .then(function(idHash){
	        res.send(idHash);
	      })
	      .catch(next);

	  });

	router.get('/delete/:_id', function(req, res, next){
	  var _id = req.params._id;
	  serverDb.deleteClippet(_id).then(function(result){
	    return res.json({success:true});
	  }).catch(next);
	});

	router.get('/tag/delete/:_id/:tag', function ( req, res, next ) {
	  serverDb.deleteTag(req.params._id, req.params.tag).then(function(doc){
	    return res.json(doc);
	  }).catch(next);
	});

	router.get('/tag/add/:_id/:tag', function(req, res, next){
	  serverDb.addTag(req.params._id, req.params.tag).then(function(doc){
	    return res.json(doc);
	  }).catch(next);
	})

	router.get('/imgfile/:_id', function ( req, res, next ) {
	  serverDb.getImageContent(req.params._id).then(function(doc){
	      res.set('Cache-Control', 'max-age=600');
	      res.set('Content-Type', doc.type);
	      res.send(doc.data);
	    }).catch(next);
	});




	return router;
}
