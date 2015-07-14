var _ = require("lodash");
var jslint = require("jslint").load('latest');
var doLint = require("jslint/lib/linter").doLint;
var through = require("through2");

var extractDirectiveLines = function (lines) {
    var directive_lines = [];
    var cur_line;
    if (/^\/\*/.test(lines[0])) {
        while (true) {
            cur_line = lines[directive_lines.length];
            directive_lines.push(cur_line);
            if (/\*\/$/.test(cur_line)) {
                break;
            }
        }
    }
    return directive_lines;
};

function supplant(string, object) {//copy pasted this from jslint
    return string.replace(/\{([^{}]*)\}/g, function (found, filling) {
        var replacement = object[filling];
        return replacement !== undefined
            ? replacement
            : found;
    });
}

var lintMe = function (js_code) {
    if (/^\/\/IM_NOT_JSLINT_WORTHY_YET\n/.test(js_code)) { //temporarally provide an escape hatch for code that we have not yet migrated to pass jslint
        return [];
    }

    var lines = js_code.split(/\n/);
    var directive_lines = extractDirectiveLines(lines);
    lines = lines.slice(directive_lines.length);

    //Wrap in a function with 'use strict';
    //This is what babelify will do, so let's teach jslint that that's what's happening
    js_code = directive_lines.join("\n") + "\n" + "(function () {\n    'use strict';\n" + _.map(lines, function (line) {
        return line.length === 0 ? "" : "    " + line;
    }).join("\n") + "\n}());";
    js_code = js_code.trim();

    var r = doLint(jslint, js_code, {
        es6: true,
        node: true, // b/c we use browserify
        "this": true, // this is only allowed for working with React
        browser: false //only very few files need browser globals, those files should declare that dependancy using the jslint /*global ...*/ at the top of their file
    });
    return _.filter(_.map(r.warnings, function (warning) {
        if (warning.code === 'bad_property_a' && /^__/.test(warning.a)) {
            //ignore these b/c we use dunder for private methods
            return;
        }
        if (warning.code === 'expected_a_before_b' && warning.a === 'new' && /^[A-Z]/.test(warning.b)) {
            //ignore these b/c the React convention is to name components uppercase and not use "new"
            return;
        }
        //fixing line and col numbers
        warning.line = warning.line - 2 + 1;
        warning.column = warning.column - 4 + 1;

        if (warning.code === 'expected_a_at_b_c') {
            warning.b = warning.b - 4 + 1;
            warning.c = warning.c - 4 + 1;
            warning.message = supplant("Expected '{a}' at column {b}, not column {c}.", warning);
        } else if(warning.code=== 'expected_a_b_from_c_d') {
            warning.c = warning.c - 4 + 1;
            warning.message = supplant("Expected '{a}' to match '{b}' from line {c} and instead saw '{d}'.", warning);
        }

        return warning;
    }));
};

var jslintWarningToHuman = function (file, warning) {
    var loc = file.replace(/^.*\/src\//, '') + ':' + warning.line + ',' + warning.column;
    return 'jslint: ' + warning.message + ' @ ' + loc;
};

module.exports = function (file) {
    if (!/\.js$/i.test(file)) {
        return through();
    }
    var js_code = '';
    return through(function (data, enc, done) {
        js_code += data;
        this.push(data);
        done();
    }, function (done) {
        var warnings = lintMe(js_code);
        if (_.size(warnings) === 0) {
            return done();
        }
        done(jslintWarningToHuman(file, _.first(warnings)));
    });
};
