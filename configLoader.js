var fs = require('fs');

module.exports = function(filename){
    if (typeof filename != 'string') throw new TypeError('filename must be a string');

    if (!fs.existsSync(filename)) {
        console.log('No config found');
        return undefined;
    }
    var content = fs.readFileSync(filename, {encoding: 'utf8'});
    var obj;
    try {
        obj = JSON.parse(content);
    } catch (e){
        return undefined;
    }
    return obj;
};
