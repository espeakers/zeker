var path = require('path');
var envify = require('envify/custom');
var browserify = require('browserify');

module.exports = function(zeker, build_name, is_prod){
	var b = browserify({
		entries: [path.join('.', zeker.js[build_name])]
	});
	b.transform(envify({
		ZEKER_BUILD_NAME: build_name,
		NODE_ENV: is_prod ? "production" : "development"
	}));
	return b;
};
