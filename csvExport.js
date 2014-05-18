var fs = require('fs');
var path = require('path');
var readline = require('readline');
var dbmodels = require('./dbmodels');
var mongoose = require('mongoose');

var Project = mongoose.model('Project');
var Donation = mongoose.model('Donation');

var rl = readline.createInterface({input: process.stdin, output: process.stdout});

var q = '"';
var t = ', ';
var n = '\n';

function promptLocation(callback){
    if (typeof callback != 'function') throw new TypeError('callback must be a function');

    rl.question('Where do you want to save the exported data?\n', function(filePath){
        var holdingFolder = path.join(filePath, '..');
        if (!(fs.existsSync(holdingFolder) && fs.statSync(holdingFolder).isDirectory())){
             console.log('Invalid file path. Please retry');
             promptLocation(callback);
             return;
        }
        callback(filePath);
    });
}

function exportData(filename, callback){
    if (typeof filename != 'string') throw new TypeError('filename must be a string');
    if (typeof callback != 'function') throw new TypeError('callback must be a function');

    Project.find(function(err, projects){
        if (err) throw err;
        Donation.find(function(err, donations){
            if (err) throw err;
            var content = '';
            //Order donations, then build file content
            if (!donations){
                console.log('No donations registered on DoonateNow. Exiting');
                process.exit();
            }
            var donationsCopy = [];
            for (var i = 0; i < donations.length; i++){
                var d = donations[i];
                donationsCopy.push({donorNumber: d.donorNumber, projectNumber: d.projectNumber, shares: d.shares, total: d.total, collected: d.collected});
            }
            donationsCopy.sort(function(a, b){
                if (a.donorNumber < b.donorNumber) return -1;
                if (a.donorNumber > b.donorNumber) return 1;
                return 0;
            });
            //console.log('donationsCopy: ' + JSON.stringify(donationsCopy));
            var perDonor = [];
            for (var i = 0; i < donationsCopy.length; i++){
                if (i == 0){
                    var firstElem = blankDonorObject(donationsCopy[i].donorNumber);
                    firstElem['project' + donationsCopy[i].projectNumber] += donationsCopy[i].total;
                    firstElem.total += donationsCopy[i].total;
                    firstElem.collected = donationsCopy[i].collected;
                    perDonor.push(firstElem);
                    continue;
                }
                if (last(perDonor).donorNumber == donationsCopy[i].donorNumber){
                    last(perDonor)['project' + donationsCopy[i].projectNumber] += donationsCopy[i].total;
                    last(perDonor).total += donationsCopy[i].total;
                    if (last(perDonor).collected && !donationsCopy[i].collected) last(perDonor).collected = false;
                } else {
                    var d = blankDonorObject(donationsCopy[i].donorNumber);
                    d['project' + donationsCopy[i].projectNumber] += donationsCopy[i].total;
                    d.total += donationsCopy[i].total;
                    d.collected = donationsCopy[i].collected;
                    perDonor.push(d);
                }
            }
            //Building tsv string
            content = q + 'Donor number' + q + t;
            for (var i = 0; i < projects.length; i++){
                content += q + projects[i].name + q + t
            }
            content += q + 'Total' + q + t + q + 'Collected' + q + n;
            for (var i = 0; i < perDonor.length; i++){
                content += perDonor[i].donorNumber + t;
                for (var j = 0; j < projects.length; j++){
                    content += perDonor[i]['project' + projects[j].projectNumber] + t;
                }
                content += perDonor[i].total + t;
                content += (perDonor[i].collected ? '1': '0');
                if (i != perDonor.length - 1) content += n;
            }
            fs.writeFileSync(filename, content);
            callback();
            function last(a){
                if (!Array.isArray(a)) throw new Error();
                return a[a.length - 1];
            }
            function blankDonorObject(donorNumber){
                var d = {donorNumber: donorNumber, total: 0, collected: true};
                for (var i = 0; i < projects.length; i++){
                    d['project' + projects[i].projectNumber] = 0;
                }
                return d;
            }
        });
    });
}

promptLocation(function(filename){
    exportData(filename, function(){
        console.log('Export ended');
        process.exit();
    });
});
