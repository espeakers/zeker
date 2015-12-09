var path = require("path");
var envify = require("envify/custom");
var lintify = require("./lintify");
var babelify = require("babelify");
var browserify = require("browserify");
var bundleCollapser = require("bundle-collapser/plugin");

module.exports = function(build, is_prod){
	var b = browserify({
		entries: build.inputs,
		cache: {},//must set for watchify
		packageCache: {},//must set for watchify
		debug: true//source maps
	});

	//we must lint the code first before any other transforms are applied
	b.transform(lintify);

	b.transform(envify({
		ZEKER_BUILD_NAME: build.name,
		NODE_ENV: is_prod ? "production" : "development"
	}));
	b.transform(babelify.configure({
		"plugins": [
			//For the list of whats available and what these do go here:
			//https://babeljs.io/docs/advanced/transformers/

			//browser compatability/bug avoidance
			"transform-strict-mode",
			"transform-es3-property-literals",
			"transform-es3-member-expression-literals",
			"transform-undefined-to-void",

			//the good parts of es6
			"transform-es2015-block-scoping",
			"transform-es2015-destructuring",
			"transform-es2015-parameters",
			"transform-es2015-shorthand-properties"
		]
	}));
	if(is_prod){
		b.plugin(bundleCollapser);
	}
	return b;
};
