var config = require('./config');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var Project = new Schema({
	projectNumber: Number,
	name: String,
	shareSize: Number,
	currency: String
});

var Donation = new Schema({
	writerId: Number,
	donorNumber: Number,
	projectNumber: Number,
	shares: Number,
	total: Number
});

var Writer = new Schema({
	writerId: Number,
	username: String,
	password: String
});

var Session = new Schema({
	sessionId: String,
	writerId: Number
});

var connectionString = 'mongodb://';
if (config.user && config.pass){
	connectionString += config.user + ':' + config.pass + '@';
}
connectionString += config.host + ':' + config.port + '/' + config.dbname;

mongoose.connect(connectionString, function(err){
	if (err) throw err;
})

mongoose.model('Project', Project);
mongoose.model('Donation', Donation);
mongoose.model('Writer', Writer);
mongoose.model('Session', Session);

mongoose.connection.on('error', console.error.bind(console, 'Connection error:'));
mongoose.connection.once('open', function(){
	console.log('Connection to DB established');
});