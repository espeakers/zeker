var _ = require('lodash');
var task = require('./task');
var mkMyLog = require('./mkMyLog');
var buildCSS = require('./buildCSS');
var chokidar = require('chokidar');
var watchify = require('watchify');
var spawnTask = require('./spawnTask');
var mkBrowserify = require('./mkBrowserify');
var mkOutputStream = require('./mkOutputStream');
var timeAndNBytesWritten = require("./timeAndNBytesWritten");

module.exports = function (zeker) {

	//js
	_.each(zeker.js, function (ignore, build_name) {
		var l = mkMyLog(build_name + ".js");

		var w = watchify(mkBrowserify(zeker, build_name, false));
		w.on('log', l.log);

		var bundle = function () {
			var wb = w.bundle();
			wb.on('error', function (err) {
							if(_.isEqual(["stream"], _.keys(err))){//a hack to get around a browserify bug
								return l.err("check your require paths");
							}
							l.err(err);
			});

			var out;
			if (build_name === 'tests') {
				var p = spawnTask('node', [], l);
				out = p.stdin;
			} else {
				out = mkOutputStream(zeker, build_name, 'js', false);
			}
			wb.pipe(out);
		};
		w.on('update', bundle);
		bundle();
	});

	//css
	var css_tasks = _.map(zeker.css, function (ignore, build_name) {
		var l = mkMyLog(build_name + ".css");
		return task(function (done) {
			buildCSS(zeker, build_name, false, timeAndNBytesWritten(l, done));
		});
	});

	chokidar.watch('src/').on('all', function (ignore, file_path) {
		if (/\.(less|css)$/.test(file_path)) {
			_.each(css_tasks, function (fn) {
				fn();
			});
		}
	});
};
