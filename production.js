var _ = require('lodash');
var path = require('path');
var task = require('./task');
var mkMyLog = require('./mkMyLog');
var buildCSS = require('./buildCSS');
var chokidar = require('chokidar');
var runTests = require('./runTests');
var watchify = require('watchify');
var mkBrowserify = require('./mkBrowserify');
var mkOutputStream = require('./mkOutputStream');

module.exports = function(zeker, js_builds, css_builds){

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
	var tests_l = mkMyLog('npm test');
	var testIt = task(function(done){
		runTests(tests_l, done);
	});

	//css
	var css_tasks = _.map(css_builds, function(name){
		var l = mkMyLog(name + '.css');
		return task(function(done){
			var start_time = Date.now();
			buildCSS(zeker, name, false, function(err, n_bytes){
				done();
				if(err){
					l.err(err);
				}else{
					var delta = Date.now() - start_time;
					l.log(n_bytes + ' bytes written (' + (delta / 1000).toFixed(2) + ' seconds)');
				}
			});
		});
	});

	chokidar.watch('src/').on('all', function(event, file_path){
		var type = path.extname(file_path).replace(/[ \.]+/g, '').toLowerCase();
		if(type === 'js'){
			testIt();
		}
		if(type === 'less' || type === 'css'){
			_.each(css_tasks, function(fn){fn();});
		}
	});
};
