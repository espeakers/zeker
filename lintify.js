var _ = require("lodash");
var linter = require("eslint").linter;
var through = require("through2");

var eslintWarningToHuman = function (file, warning) {
	var loc = file.replace(/^.*\/src\//, '') + ':' + warning.line + ',' + warning.column;
	return 'eslint: ' + warning.message + ' @ ' + loc;
};

linter.defineRule("no-class", require("eslint-plugin-no-class/lib/rules/no-class"));

var defaults = {
	parserOptions: {
		ecmaVersion: 6,
		"ecmaFeatures": {
	    	"jsx": true
	  	}
	},
	"plugins": [
		"react"
	],
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

		// https://medium.com/javascript-scene/inside-the-dev-team-death-spiral-6a7ea255467b
		"no-class": 2,

		//style consistency
		"wrap-iife": [2, "outside"],
		"consistent-this": [2, "self"],
		"no-trailing-spaces": 2
	}
};

module.exports = function(config_overrides){
	var eslint_config = _.defaultsDeep({}, config_overrides || {}, defaults);//yep defaultsDeep mutates arg 1, and first one to define a property wins
	return function(file){
		if (!/\.js$/i.test(file)){
			return through();
		}
		var js_code = '';
		return through(function(data, enc, done){
			js_code += data;
			this.push(data);
			done();
		}, function(done){
			var warnings = linter.verify(js_code, eslint_config, {
				filename: file
			});

			if(_.size(warnings) === 0){
				return done();
			}
			done(eslintWarningToHuman(file, _.first(warnings)));
		});
	};
};
