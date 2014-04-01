var mongoose = require('mongoose');
var Project = mongoose.model('Project');
var Donation = mongoose.model('Donation');
var Writer = mongoose.model('Writer');
var Session = mongoose.model('Session');

/*
 * GET home page.
 */

exports.ondonation = function(){}; //On "new donation" event handler. To be catched by socket.io

exports.index = function(req, res){
  res.render('index', { title: 'DonateNow' });
};

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
	var projectNumber = req.body.projectNumber;
	var donorNumber = req.body.donorNumber;
	var numShares = req.body.numShares;
	Project.findOne({projectNumber: projectNumber}, function(err, project){
		if (err){
			console.log('Error while saving the donation:\n' + JSON.stringify(err));
			res.status(500).send('Erreur : la donation n\'a pas pu être sauvegardée');
		}
		if (project){
			var total = numShares * project.shareSize;
			var newDonation = new Donation({
				donorNumber: donorNumber,
				projectNumber: projectNumber,
				shares: numShares,
				total: total
			});
			newDonation.save(function(err){
				if (err){
					console.log('Error while saving the donation:\n' + JSON.stringify(err));
					res.status(500).send('Erreur : la donation n\'a pas pu être sauvegardée');
				} else {
					res.send('Donation saved');
				}
			});
		} else {
			res.status(400).send('Le project numero ' + projectNumber + ' n\'existe pas');
		}
	});
};