
/**
 * Module dependencies.
 */

var express = require('express');
var dbmodels = require('./dbmodels');
var routes = require('./routes');
var http = require('http');
var path = require('path');
var config = require('./config');
var io = require('socket.io');

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
app.get('/donation', routes.donationPage);
app.post('/donation', routes.saveDonation);
app.get('/search', routes.searchPage);
app.post('/search', routes.searchAjax);

var server = http.createServer(app);
io = io.listen(server);
io.set('log level', 1);

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
