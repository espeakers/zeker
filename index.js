var fs = require('fs');
var watchify = require('watchify');
var browserify = require('browserify');

var mkBrowserify = function(file_in){
	return browserify({
		entries: ['./src/' + file_in]
	});
};

var mkOutStream = function(file_out){
	return fs.createWriteStream(file_out);
};

var watchJS = function(file_in, file_out){
	var w = watchify(mkBrowserify(file_in));
	w.on('log', function(text){
		console.log('watchify:', text);
	});

	var bundle = function(){
		var out = mkOutStream(file_out);
		var wb = w.bundle();
		wb.on('error', function(err){
			console.error(err);
		});
		wb.pipe(out);
	};
	w.on('update', bundle);
	bundle();
};

watchJS('app.js', 'bundle.js');
