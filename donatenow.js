var readline = require('readline');
var crypto = require('crypto');
var spawn = require('child_process').spawn;

var dbmodels = require('./dbmodels');
var mongoose = require('mongoose');

var Project = mongoose.model('Project');
var Donation = mongoose.model('Donation');
var Writer = mongoose.model('Writer');
var Session = mongoose.model('Session');

var appProcess;

var rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
});

function generateText(length){
	var charset = 'aAbBcCdDeEfFgGhHiIjJkKlLmMnNoOpPqQrRsStTuUvVwWxXyYzZ01234567890';
	var gen = '';
	for (var i = 0; i < length; i++){
		gen += charset[Math.floor(Math.random() * charset.length)];
	}
	return gen;
}

function checkUsername(username){
	var usernameRegex = /^\w$/;
	return usernameRegex.test(username);
}

function promptChoice(){
	console.log('What do you want to do?');
	console.log('1. Start/stop the app');
	console.log('2. Manage projects');
	console.log('3. Manage users');
	console.log('4. Exit');
	rl.question('Your choice: ', function(choice){
		if (!choice || choice.length == 0){
			console.log('Invalid choice. Please retry');
			promptChoice();
			return;
		}
		choice = choice[0];
		if (!(choice == '1' || choice == '2' || choice == '3' || choice == '4')){
			console.log('Invalid choice. Please retry');
			promptChoice();
			return;
		}
		if (choice == '1'){
			startStopApp(promptChoice);
		} else if (choice == '2'){
			manageProjects(promptChoice);
		} else if (choice == '3'){
			manageUsers(promptChoice);
		} else {
			console.log('Thank you, come again.');
			if (appProcess) appProcess.kill();
			rl.close();
			process.exit();
		}
	});
}

function startStopApp(callback){
	if (appProcess){
		appProcess.kill();
		appProcess = null;
		callback();
	} else {
		appProcess = spawn('node', ['app.js']);
		appProcess.stdout.setEncoding('utf8');
		appProcess.stdout.on('data', function(data){
			if (data.indexOf('Express server listening on port') < 0){
				callback();
			}
		});
	}
}

function manageUsers(callback){
	console.log('What do you want to do?');
	console.log('1. list users');
	console.log('2. Add a user');
	console.log('3. Remove a user');
	console.log('4. Go back');
	rl.question('Your choice: ', function(choice){
		if (!choice || choice.length == 0){
			console.log('Invalid choice. Please retry.');
			manageUsers(callback);
			return;
		}
		choice = choice[0];
		if (!(choice == '1' || choice == '2' || choice == '3' || choice == '4')){
			console.log('Invalid choice. Please retry');
			manageUsers(callback);
			return;
		}
		if (choice == '1'){
			listUsers(function(){
				manageUsers(callback);
			});
		} else if (choice == '2'){
			addUser(function(){
				manageUsers(callback);
			});
		} else if (choice == '3'){
			removeUser(function(){
				manageUsers(callback);
			});
		} else if (choice == '4'){
			callback();
		}
	});
}

function addUser(callback){
	rl.question('Enter the username', function(username){
		if (!username || username.length == 0){
			console.log('username can\'t be null');
			addUser(callback);
			return;
		}
		if (!checkUsername(username)){
			console.log('Invalid username. Must be alphanumerical only.');
			addUser(callback);
			return;
		}
		var pass = generateText(8);
		var salt = generateText(4);
		var passHash = crypto.createHash('sha1');
		passHash.update(pass + salt, 'utf8');
		var passField = passHash.digest('hex');
		var newWriter = new Writer({
			writerId: generateText(8),
			username: username,
			hashedPassword: passField,
			salt: salt
		});
		newWriter.save(function(err){
			if (err){
				throw err;
			}
			console.log('Password for user ' + username + ' : ' + pass);
			callback();
		});
	});
}

function removeUser(callback){
	
}

function listUsers(callback){

}

function manageProjects(callback){

}

function addProject(callback){

}

function removeProject(callback){

}

function editProject(callback){

}

function listProjects(callback){

}

promptChoice();