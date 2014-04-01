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
	writerId: Number
	donorNumber: Number,
	projectNumber: Number,
	shares: Number
});

var Writer = new Schema({
	writerId: Number,
	username: String,
	password: String
});

mongoose.model('Project', Project);
mongoose.model('Donation', Donation);
mongoose.model('Writer', Writer);

var connectionString = 'mongodb://';
if (config.user && config.pass){
	connectionString += config.user + ':' + config.pass + '@';
}
connectionString += config.host + ':' + config.port + '/' + config.dbname;

mongoose.connect(connectionString, function(err){
	if (err) throw err;
})

mongoose.on('error', console.error.bind(console, 'Connection error:'));
mongoose.once('open', function(){
	console.log('Connection to DB established');
});