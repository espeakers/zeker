var fs = require('fs');
var path = require('path');
var getOutFilePath = require('./getOutFilePath');

module.exports = function(zeker, build_name, type, is_prod){
	var file = getOutFilePath(zeker, build_name, type, is_prod);
	return fs.createWriteStream(file);
};
