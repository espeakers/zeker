var _ = require('lodash');
var fs = require('fs');
var task = require('./task');
var buildCSS = require('./buildCSS');
var chokidar = require('chokidar');
var watchify = require('watchify');
var spawnTask = require('./spawnTask');
var mkBrowserify = require('./mkBrowserify');
var timeAndNBytesWritten = require("./timeAndNBytesWritten");

var jsBuild = function(build){
	var w = watchify(mkBrowserify(build, false));
	w.on('log', build.log.log);

	var bundle = function(){
		var wb = w.bundle();
		wb.on('error', function(err){
			if(_.isEqual(["stream"], _.keys(err))){//a hack to get around a browserify dump of the bundle to the log
				build.log.err("check your require paths");
			}else{
				build.log.err(err);
			}
		});

		var out;
		if(build.name === 'tests'){
			var p = spawnTask('node', [], build.log);
			out = p.stdin;
		}else{
			out = fs.createWriteStream(build.output);
		}
		wb.pipe(out);
	};
	w.on('update', bundle);
	bundle();
};

module.exports = function(builds){

	var css_tasks = [];

	_.each(builds, function(build){
		if(build.type === "js"){
			jsBuild(build);
		}else if(build.type === "css"){
			css_tasks.push(task(function(done){
				buildCSS(build, timeAndNBytesWritten(build.log, done));
			}));
		}else{
			throw new Erorr("unsupported build type: " + build.type);
		}
	});

	chokidar.watch('src/').on('all', function(ignore, file_path){
		if(/\.(less|css)$/.test(file_path)){
			_.each(css_tasks, function(fn){
				fn();
			});
		}
	});
};
