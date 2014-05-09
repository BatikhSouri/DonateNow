
/**
 * Module dependencies.
 */

var express = require('express');
var dbmodels = require('./dbmodels');
var routes = require('./routes');
var fs = require('fs');
var http = require('http');
var path = require('path');
var configLoad = require('./configLoader');
var config = configLoad('./config.json');
var io = require('socket.io');

var mongoose = require('mongoose');
var Session = mongoose.model('Session');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.json());
app.use(express.urlencoded());
app.use(express.multipart());
app.use(express.methodOverride());
app.use(express.cookieParser());
app.use(express.cookieSession({secret: config.cookieSecret, cookie: {path: '/', maxAge: null}}));
app.use(function(req, res, next){
	//Session checker
	if (req.url.indexOf('/login') == 0 || req.url.indexOf('/stylesheets') == 0 || req.url.indexOf('/javascripts') == 0) {
		//Excluding from authentication redirection the login page, scripts and stylesheets
		next();
		return;
	}
	if (req.session){
		Session.findOne({writerId: req.session.writerId, sessionId: req.session.sessionId}, function(err, session){
			if (err){
				res.status(500).send('Internal error');
				return;
			}
			if (session) next();
			else res.redirect('/login');
		});
	} else res.redirect('/login');
});
app.use(app.router);
app.use(require('stylus').middleware(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

routes.ondonation = function(projectNumber, shares, total){
	io.sockets.emit('donation', {projectNumber: projectNumber, shares: shares, total: total});
};

app.get('/', routes.index);
app.get('/login', routes.loginPage);
app.post('/login', routes.loginCheck);
app.get('/logout', routes.logout);
app.get('/donation', routes.donationPage);
app.post('/donation', routes.saveDonation);
app.get('/search', routes.searchPage);
app.post('/search', routes.searchAjax);
app.post('/search/status', routes.updateStatus);

var server = http.createServer(app);
io = io.listen(server);
io.set('log level', 1);

exports.start = function(){
    server.listen(app.get('port'), function(){
	  console.log('Express server listening on port ' + app.get('port'));
	});
};

exports.stop = function(){

};

if (!module.parent){
	exports.start();
}
