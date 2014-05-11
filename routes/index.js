var crypto = require('crypto');
var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var Donation = mongoose.model('Donation');
var Writer = mongoose.model('Writer');
var Session = mongoose.model('Session');
var configLoad = require('../configLoader');
var config = configLoad('./config.json'); //process.cwd(), take that into account and you'll see that this path should be correct

/*
 * GET home page.
 */

exports.ondonation = function(){}; //On "new donation" event handler. To be catched by socket.io

exports.index = function(req, res){
    res.render('menu', {title: 'DonateNow'});
};

exports.counter = function(req, res){
    config = configLoad('./config.json');
	Project.find().sort({projectNumber: 'asc'}).exec(function(err, projects){
		if (err){
			console.log('Error while getting projects :\n' + JSON.stringify(err));
			res.status(500).send('Internal error');
			return;
		}
		//Summing up all the donations already in the system, to let it be part of the rendered page
		Donation.find(function(err, donations){
			if (err){
				console.log('Error while getting donations :\n' + JSON.stringify(err));
				res.status(500).send('Internal error');
				return;
			}
			//Copying projects to an other array, cuz it seems that mongoose don't allow to set fields that are not part of the data model
			var projectsCopy = [];
            var globalTotal = 0;
            var partTotals = [];
			for (var i = 0; i < projects.length; i++){
				projectsCopy[i] = {};
				projectsCopy[i].projectNumber = projects[i].projectNumber;
				projectsCopy[i].name = projects[i].name;
				projectsCopy[i].name2 = projects[i].name2;
				projectsCopy[i].imageUrl = projects[i].imageUrl;
				projectsCopy[i].shareSize = projects[i].shareSize;
				projectsCopy[i].currency = projects[i].currency;
                projectsCopy[i].target = projects[i].target;
				projectsCopy[i].total = 0;
				projectsCopy[i].numShares = 0;
			}
			for (var i = 0; i < donations.length; i++){
				projectsCopy[donations[i].projectNumber].total += donations[i].shares * projectsCopy[donations[i].projectNumber].shareSize;
				projectsCopy[donations[i].projectNumber].numShares += donations[i].shares;
                globalTotal += donations[i].shares * projectsCopy[donations[i].projectNumber].shareSize;
			}
            //Pushing partTotals
            for (var i = 0; i < projectsCopy.length; i++){
                partTotals.push(projectsCopy[i].total);
            }
			console.log('Projects state:\n' + JSON.stringify(projectsCopy));
            console.log('partTotals: ' + JSON.stringify(partTotals));
			res.render('index', { title: 'DonateNow', projects: projectsCopy, beneficiaryName: config.beneficiaryName, beneficiaryLogo: config.beneficiaryLogo, globalTarget: config.globalTarget, globalTotal: globalTotal, globalProgress: ((globalTotal / config.globalTarget) * 100).toFixed(2), partTotals: JSON.stringify(partTotals) });
		});
	});
};

exports.loginPage = function(req, res){
	res.render('login', {title: 'Login - DonateNow'});
};

exports.loginCheck = function(req, res){
	var username = req.body.username;
	var password = req.body.password;
	Writer.findOne({username: username}, function(err, user){
		if (err){
			res.status(500).send('Erreur interne lors de la connexion');
			return;
		}
		if (!user){
			res.render('login', {title: 'Login - DonateNow', invalidCredentials: true});
			return;
		}
		var sha1Pass = crypto.createHash('sha1');
		sha1Pass.update(password + user.salt, 'utf8');
		var hash = sha1Pass.digest('hex');
		if (hash == user.hashedPassword){
			//Generating sessionId
			crypto.pseudoRandomBytes(8, function(err, sessionIdBytes){
				var sessionId = sessionIdBytes.toString('hex');
				var newSession = new Session({
					writerId: user.writerId,
					sessionId: sessionId
				});
				newSession.save(function(err){
					if (err){
						res.status(500).send('Erreur interne lors de la connexion');
						return;
					}
					req.session.writerId = user.writerId;
					req.session.sessionId = sessionId;
					res.redirect('/');
				});
			});
		} else {
			res.render('login', {title: 'Login - DonateNow', invalidCredentials: true});
		}
	});
};

exports.logout = function(req, res){
	if (req.session){
		Session.remove({writerId: req.session.writerId, sessionId: req.session.sessionId}, function(err){
			if (err){
				res.status(500).send('Internal error');
				return;
			}
			req.session = null;
			res.redirect('/login');
		});
	} else res.redirect('/login');
}

exports.donationPage = function(req, res){
	//Check for cookies later on
	Project.find(function(err, projects){
		if (err){
			console.log('Error while getting projects :\n' + JSON.stringify(err));
			res.status(500).send('Internal error');
			return;
		}
		res.render('donate', {title: 'Donation', projects: projects});
	});
};

exports.saveDonation = function(req, res){
	var projectName = req.body.projectName;
	//console.log('Project name: ' + projectName);
	var donorNumber = Number(req.body.donorNumber);
	var numShares = Number(req.body.numShares);
	Project.findOne({name: projectName}, function(err, project){
		if (err){
			console.log('Error while saving the donation:\n' + JSON.stringify(err));
			res.status(500).send('Erreur : la donation n\'a pas pu être sauvegardée');
		}
		if (project){
			var total = numShares * project.shareSize;
			var newDonation = new Donation({
				donorNumber: donorNumber,
				projectNumber: project.projectNumber,
				shares: numShares,
				total: total,
				writerId: req.session.writerId
			});
			newDonation.save(function(err){
				if (err){
					console.log('Error while saving the donation:\n' + JSON.stringify(err));
					res.status(500).send('Erreur : la donation n\'a pas pu être sauvegardée');
				} else {
					res.send('Donation saved');
					exports.ondonation(project.projectNumber, numShares, total);
				}
			});
		} else {
			res.status(400).send('Le project numero ' + projectName + ' n\'existe pas');
		}
	});
};

exports.searchPage = function(req, res){
	res.render('search', {title: 'Search'});
};

exports.searchAjax = function(req, res){
	var donorNumber = req.body.donorNumber;
	Donation.find({donorNumber: donorNumber}, function(err, results){
		if (err){
			console.log('Error while searching donations from number ' + donorNumber + '\n' + JSON.stringify(err));
			res.status(500).send('Erreur lors de la recherche');
		} else {
			var perProjectSums = [];
			var writers = [];
			var collected = true;
			for (var i = 0; i < results.length; i++){
				perProjectSums = insertDonation(results[i], perProjectSums);
				if (collected) collected = results[i].collected; //Will end up being false if one of the donations is not collected. Bim.
				var writerInserted = false;
				for (var j = 0; j < writers.length; j++){
					if (writers[j] == results[i].writerId){
						writerInserted = true;
						break;
					}
				}
				if (!writerInserted) writers.push(results[i].writerId);
			}
			//Adding projects details to resulting donation objects
			Project.find(function(err, projects){
				if (err){
					res.status(500).send('Erreur lors de la recherche');
				} else {
					//Navigate donation objects first, because #donationObjects <= #projects
					for (var i = 0; i < perProjectSums.length; i++){
						for (var j = 0; i < projects.length; j++){
							if (perProjectSums[i].projectNumber == projects[j].projectNumber){
								perProjectSums[i].projectName = projects[j].name;
								break;
							}
						}
					}
					//Translate writerIDs into usernames...
					Writer.find(function(err, registeredWriters){
						if (err){
							res.status(500).send('Erreur lors de la recherche');
							return;
						}
						for (var i = 0; i < writers.length; i++){
							for (var j = 0; j < registeredWriters.length; j++){
								if (writers[i] == registeredWriters[j].writerId){
									writers[i] = registeredWriters[j].username;
									break;
								}
							}
						}
						res.json({donations: perProjectSums, writers: writers, collected: collected});
					});
				}
			});
		}
	});
	function insertDonation(donation, donationSums){
		for (var i = 0; i < donationSums.length; i++){
			if (donationSums[i].projectNumber == donation.projectNumber){
				donationSums[i].total += donation.total;
				donationSums[i].shares += donation.shares;
				return donationSums;
			}
		}
		donationSums.push({donorNumber: donation.donorNumber, projectNumber: donation.projectNumber, shares: donation.shares, total: donation.total});
		return donationSums;
	}
};

exports.updateStatus = function(req, res){
	var donorNumber = Number(req.body.donorNumber);
	var collected = req.body.collected == 'true' ? true : false;
	Donation.find({donorNumber: donorNumber}, function(err, results){
		if (err){
			console.log('Error while searching donations (to update their status) from number ' + donorNumber + '\n' + JSON.stringify(err));
			res.status(500).send('Erreur lors de la mise à jour');
			return;
		}
		for (var i = 0; i < results.length; i++){
			results[i].collected = collected;
			results[i].collector = req.session.writerId;
			results[i].save();
		}
		res.send('updated');
	});
};
