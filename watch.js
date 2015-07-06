var _ = require('lodash');
var path = require('path');
var mkMyLog = require('./mkMyLog');
var chokidar = require('chokidar');
var runTests = require('./runTests');
var watchify = require('watchify');
var mkBrowserify = require('./mkBrowserify');
var mkOutputStream = require('./mkOutputStream');

module.exports = function(zeker, build_names){
	var js_builds = _.intersection(_.keys(zeker.js), build_names);
	js_builds = js_builds.length === 0 ? _.keys(zeker.js) : js_builds;

	//spawn all the watchify tasks
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

	//tests
	var testIt = (function(){
		var l = mkMyLog('tests');

		//make sure it runs one at a time and re-runs if one is triggered before it finishes
		var running = false;
		var queued = false;
		return _.debounce(function(){
			if(running){
				queued = true;//queue it
				return;
			}
			running = true;
			runTests(l, function(){
				running = false;
				if(queued){
					queued = false;
					testIt();
				}
			});
		}, 100);
	}());

	chokidar.watch('src/').on('all', function(event, file_path){
		var type = path.extname(file_path).replace(/[ \.]+/g, '').toLowerCase();
		if(type === 'js'){
			testIt();
		}
		if(type === 'less' || type === 'css'){
			//TODO build css
		}
	});
};
