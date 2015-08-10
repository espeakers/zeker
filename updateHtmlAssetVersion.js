var fs = require("fs");

module.exports = function(html_path, callback){
	var cur_version = (new Date()).getTime();

	fs.readFile(html_path, function(err, data){
		if(err) return callback(err);

		var html_src = data.toString();
		html_src = html_src.replace(/assets_version = [0-9]+;/g, "assets_version = " + cur_version + ";");

		fs.writeFile(html_path, html_src, callback);
	});
};
