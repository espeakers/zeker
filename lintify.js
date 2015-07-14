var _ = require("lodash");
var jslint = require("jslint").load('latest');
var doLint = require("jslint/lib/linter").doLint;
var through = require("through2");

var lintMe = function(js_code){
	if(/^\/\/IM_NOT_JSLINT_WORTHY_YET\n/.test(js_code)){//temporarally provide an escape hatch for code that we have not yet migrated to pass jslint
		return [];
	}

	//Wrap in a function with 'use strict';
	//This is what babelify will do, so let's teach jslint that that's what's happening
	js_code = _.map(js_code.split(/\n/), function(line){
		return line.length === 0 ? "" : "    " + line;
	}).join("\n");
	js_code = "(function () {\n    'use strict';\n" + js_code + "\n}());";

	var r = doLint(jslint, js_code, {
		es6: true,
		node: true, // b/c we use browserify
		browser: true
	});
	return _.map(r.warnings, function(warning){
		return _.assign(warning, {
			//fixing line and col numbers
			line: warning.line - 2 + 1,
			column: warning.column - 4 + 1
		});
	});
};

var jslintWarningToHuman = function(file, warning){
	var loc = file.replace(/^.*\/src\//, '') + ':' + warning.line + ',' + warning.column;
	return 'jslint: ' + warning.message + ' @ ' + loc;
};

module.exports = function(file){
	if(!/\.js$/i.test(file)){
		return through();
	}
	var js_code = '';
	return through(function(data, enc, done){
		js_code += data;
		this.push(data);
		done();
	}, function(done){
		var warnings = lintMe(js_code);
		if(_.size(warnings) === 0){
			return done();
		}
		done(jslintWarningToHuman(file, _.first(warnings)));
	});
};
