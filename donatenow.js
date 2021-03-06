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
	var usernameRegex = /^\w+$/;
	return usernameRegex.test(username);
}

function isUsernameAvailable(username, callback){
	Writer.count({username: username}, function(err, count){
		if (err){
			callback(err);
			return;
		}
		callback(undefined, count == 0);
	});
}

function promptChoice(){
	console.log('What do you want to do?');
	console.log('1. Start/stop the app');
	console.log('2. Manage projects');
	console.log('3. Manage users');
	console.log('4. Exit');
	rl.question('Your choice: ', function(choice){
		if (nullString(choice)){
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
		appProcess.stderr.setEncoding('utf8');
		appProcess.stderr.on('data', function(data){
			console.error(data);
		})
		appProcess.stdout.setEncoding('utf8');
		appProcess.stdout.on('data', function(data){
			if (data.indexOf('Express server listening on port') > -1){
				callback();
			}
		});
	}
}

function manageUsers(callback){
	console.log('What do you want to do?');
	console.log('1. List users');
	console.log('2. Add a user');
	console.log('3. Remove a user');
	console.log('4. Go back');
	rl.question('Your choice: ', function(choice){
		if (nullString(choice)){
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
	console.log('');
	rl.question('Enter the username: ', function(username){
		if (nullString(username)){
			console.log('username can\'t be null');
			addUser(callback);
			return;
		}
		if (!checkUsername(username)){
			console.log('Invalid username. Must be alphanumerical only.');
			addUser(callback);
			return;
		}
		isUsernameAvailable(username, function(err, isAvailable){
			if (err){
				console.error('Error while checking username availability: ' + err);
				callback();
				return;
			}
			if (!isAvailable){
				console.log('Username ' + username + ' is already taken. Please choose an other one');
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
				console.log('Password for user ' + username + ' : ' + pass + '\r\n');
				callback();
			});
		})
	});
}

function removeUser(callback){
	listUsers(function(err){
		if (err){
			callback();
			return;
		}

		function promptChoice(){
			rl.question('Enter the username of the account you want to delete:\r\n', function(username){
				if (!(username && username.length > 0)){
					console.error('Invalid username');
					promptChoice();
					return;
				}
				Writer.remove({username: username}, function(err){
					if (err){
						console.error('Error while deleting user account ' + username + ' : ' + err);
						callback();
						return;
					}
					callback();
				});
			});
		}
	});
}

function listUsers(callback){
	Writer.find(function(err, writers){
		if (err){
			console.error(err);
			callback(err);
			return;
		}
		console.log('\r\nRegistered users: ' + writers.length)
		var usernames = [];
		for (var i = 0; i < writers.length; i++){
			console.log(writers[i].username);
		}
		console.log('\r\n');
		callback();
	});
}

function manageProjects(callback){
	console.log('What do you want to do?');
	console.log('1. List projects');
	console.log('2. Add a project');
	console.log('3. Remove a project');
	console.log('4. Go back');
	rl.question('Your choice: ', function(choice){
		if (nullString(choice)){
			console.log('Invalid choice. Please retry');
			manageProjects(callback);
			return;
		}
		choice = choice[0];
		if (!(choice == '1' || choice == '2' || choice == '3' || choice == '4')){
			console.log('Invalid choice. Please retry');
			manageProjects(callback);
			return;
		}
		if (choice == '1'){
			listProjects(function(){
				manageProjects(callback);
			});
		} else if (choice == '2'){
			addProject(function(){
				manageProjects(callback);
			});
		} else if (choice == '3'){
			removeProject(function(){
				manageProjects(callback);
			});
		} else if (choice == '4'){
			callback();
		}
	});
}

function addProject(callback){

	var projectObject = {};

	function promptName(pos, cb){
		rl.question((pos == 1 ? '1st' : '2nd') + ' project name: ', function(projectName){
			if (nullString(projectName)){
				console.log('Invalid project name');
				promptName(pos, cb);
				return;
			}
			projectObject[pos == 1 ? 'name' : 'name2'] = projectName;
			cb();
		});
	}

	function promptImagePath(cb){
		rl.question('Relative project image path (public): ', function(imagePath){
			if (nullString(imagePath)){
				console.log('Invalid project image path');
				promptImagePath(cb);
				return;
			}
			projectObject.imageUrl = imagePath;
			cb();
		});
	}

	function promptShareCurrency(cb){
		rl.question('Project share unit/currency: ', function(projCurrency){
			if (nullString(projCurrency)){
				console.log('Invalid unit/currency');
				promptShareCurrency(cb);
				return;
			}
			projectObject.currency = projCurrency;
			cb();
		});
	}

	function promptShareSize(cb){
		rl.question('Project share size: ', function(projShareSize){
			projShareSize = parseInt(projShareSize);
			if (isNaN(projShareSize)){
				console.log('Invalid share size');
				promptShareSize(cb);
				return;
			}
			projectObject.shareSize = projShareSize;
			cb();
		});
	}

	function promptTarget(cb){
		rl.question('Project fundraising target: ', function(projTarget){
			projTarget = parseInt(projTarget);
			if (isNaN(projTarget)){
				console.log('Invalid project target');
				promptTarget(cb);
				return;
			}
			projectObject.target = projTarget;
			cb();
		});
	}

	function nextProjectNumber(cb){
		var maxProjectNumber = -1;
		Project.find(function(err, currentProjects){
			if (err){
				cb(err);
				return;
			}
			for (var i = 0; i < currentProjects.length; i++) if (currentProjects[i].projectNumber > maxProjectNumber) maxProjectNumber = currentProjects[i].projectNumber;
			maxProjectNumber++;
			projectObject.projectNumber = maxProjectNumber;
			cb(undefined, maxProjectNumber);
		});
	}

	nextProjectNumber(function(err){
		if (err) throw err;
		promptName(1, function(err){
			if (err) throw err;
			promptName(2, function(err){
				if (err) throw err;
				promptShareCurrency(function(err){
					if (err) throw err;
					promptTarget(function(err){
						if (err) throw err;
						promptShareSize(function(err){
							if (err) throw err;

							var newProject = new Project(projectObject);
							newProject.save(function(err){
								if (err){
									console.error('Error while saving project ' + JSON.stringify(projectObject) + ': ' + err);
									cb();
									return;
								}

								console.log('Project "' + projectObject.name + '" has been saved');
								callback();
							});
						});
					});
				});
			});
		});
	});
}

function removeProject(callback){

}

function editProject(callback){

}

function listProjects(callback){
	console.log('\r\nProjects:');
	Project.find(function(err, projects){
		if (err){
			console.error('Error while getting the projects list: ' + err);
			callback();
			return;
		}
		for (var i = 0; i < projects.length; i++) console.log(projects[i].name + ' (' + projects[i].name2 + ')');
		console.log('\r\n');
		callback();
	});
}

function nullString(s){return !(typeof s == 'string' && s.length > 0)}

promptChoice();
