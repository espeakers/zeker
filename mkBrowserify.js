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
	b.transform(lintify(build.eslint_config_overrides));

	b.transform(envify({
		ZEKER_BUILD_NAME: build.name,
		NODE_ENV: is_prod ? "production" : "development"
	}));
	b.transform(babelify.configure({
		"plugins": [
			//For the list of whats available and what these do go here:
			//https://babeljs.io/docs/advanced/transformers/

			//browser compatability/bug avoidance
			require("babel-plugin-transform-strict-mode"),
			require("babel-plugin-transform-es3-property-literals"),
			require("babel-plugin-transform-es3-member-expression-literals"),
			require("babel-plugin-transform-undefined-to-void"),

			//the good parts of es6
			require("babel-plugin-transform-es2015-block-scoping"),
			require("babel-plugin-transform-es2015-destructuring"),
			require("babel-plugin-transform-es2015-parameters"),
			require("babel-plugin-transform-es2015-shorthand-properties")
		]
	}));
	if(is_prod){
		b.plugin(bundleCollapser);
	}
	return b;
};
