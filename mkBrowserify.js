var path = require("path");
var envify = require("envify/custom");
var babelify = require("babelify");
var browserify = require("browserify");
var bundleCollapser = require("bundle-collapser/plugin");

module.exports = function(zeker, build_name, is_prod){
	var b = browserify({
		entries: [path.join(".", zeker.js[build_name])],
		cache: {},//must set for watchify
		packageCache: {},//must set for watchify
		debug: true//source maps
	});
	b.transform(envify({
		ZEKER_BUILD_NAME: build_name,
		NODE_ENV: is_prod ? "production" : "development"
	}));
	b.transform(babelify.configure({
		whitelist: [
			//For the list of whats available and what these do go here:
			//https://babeljs.io/docs/advanced/transformers/

			//browser compatability/bug avoidance
			"strict",
			"es3.propertyLiterals",
			"es3.propertyLiterals",
			"spec.undefinedToVoid",

			//the good parts of es6
			"es6.blockScoping",
			"es6.destructuring",
			"es6.parameters",
			"es6.spread",
			"es6.properties.shorthand"
		]
	}));
	if(is_prod){
		b.plugin(bundleCollapser);
	}
	return b;
};
