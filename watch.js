var _ = require('lodash');
var mkMyLog = require('./mkMyLog');
var watchify = require('watchify');
var mkBrowserify = require('./mkBrowserify');
var mkOutputStream = require('./mkOutputStream');

module.exports = function(zeker, build_names){
	var js_builds = _.intersection(_.keys(zeker.js), build_names);
	js_builds = js_builds.length === 0 ? _.keys(zeker.js) : js_builds;

	_.each(js_builds, function(build_name){
		var l = mkMyLog(build_name + ".js");

		var w = watchify(mkBrowserify(zeker, build_name, false));
		w.on('log', l.log);

		var bundle = function(){
			var wb = w.bundle();
			var out = mkOutputStream(zeker, build_name, 'js', false);
			wb.on('error', l.err);
			wb.pipe(out);
		};
		w.on('update', bundle);
		bundle();
	});
};
