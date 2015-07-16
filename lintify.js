var _ = require("lodash");
var linter = require("eslint").linter;
var through = require("through2");

var eslintWarningToHuman = function (file, warning) {
	var loc = file.replace(/^.*\/src\//, '') + ':' + warning.line + ',' + warning.column;
	return 'eslint: ' + warning.message + ' @ ' + loc;
};

var eslint_config = {
	ecmaFeatures: {
		//good parts
		blockBindings: true,
		destructuring: true,
		restParams: true,
		objectLiteralShorthandMethods: true,
		objectLiteralShorthandProperties: true,

		//gray area :)
		jsx: true,

		//bad parts (somewhat according to Douglas Crockford)
		arrowFunctions: false,//these can be good if there were more rules to specify a jslint style arrow function
		binaryLiterals: false,
		classes: false,
		defaultParams: false,
		forOf: false,
		generators: false,
		modules: false,//these are good if you only use a subset of its features. But we're using CommonJS modules so we don't need to turn these on now
		objectLiteralComputedProperties: false,
		objectLiteralDuplicateProperties: false,
		octalLiterals: false,
		regexUFlag: false,
		regexYFlag: false,
		spread: false,
		superInFunctions: false,
		templateStrings: false,//since we're using react and lodash we shouldn't ever need this
		unicodeCodePointEscapes: false,
		globalReturn: false
	},
	globals: {
		"console": true,
		"setTimeout": true,
		"setInterval": true,
		"clearTimeout": true,
		"clearInterval": true,

		//node (via browserify)
		"module": true,
		"process": true,
		"require": true,

		//browsers
		"window": true,
		"document": true
	},
	rules: {
		//language hazards
		"semi": 2,
		"radix": 2,
		"strict": [2, "never"],// b/c babelify takes care of this for us
		"no-eval": 2,
		"no-void": 2,//babelify will convert undefined into void 0; Other than that void shouldn't be used
		"no-with": 2,
		"no-undef": 2,
		"no-octal": 2,
		"no-caller": 2,
		"use-isnan": 2,
		"no-labels": 2,//too much like goto
		"no-multi-str": 2,
		"no-implied-eval": 2,
		"no-new-wrappers": 2,
		"no-self-compare": 2,
		"no-sparse-arrays": 2,
		"no-native-reassign": 2,
		"no-use-before-define": 2,

		//bad ideas
		"no-alert": 2,//make a bootstrap modal or use console.log
		"no-bitwise": 2,//if(a & b){... but what they really ment was if(a && b){...
		"no-plusplus": 2,//var i = 1, b = i++; is b 2 or 1? how about ++i? Just use i += 1;
		"no-script-url": 2,//just use react onClick handlers
		"no-cond-assign": 2,//if(a = b){... but what they really ment was if(a === b){...
		"no-new-require": 2,
		"no-unused-vars": [2, {
			vars: "all",
			args: "none"//unused arguments can provide good documentation about what is available
		}],

		//style consistency
		"wrap-iife": [2, "outside"],
		"consistent-this": [2, "self"],
		"no-trailing-spaces": 2
	}
};

module.exports = function(file){
	if (!/\.js$/i.test(file)){
		return through();
	}
	var js_code = '';
	return through(function (data, enc, done) {
		js_code += data;
		this.push(data);
		done();
	}, function(done){
		var warnings = linter.verify(js_code, eslint_config, file);

		if(_.size(warnings) === 0){
			return done();
		}
		done(eslintWarningToHuman(file, _.first(warnings)));
	});
};
