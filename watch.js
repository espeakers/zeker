var _ = require('lodash');
var fs = require('fs');
var path = require('path');
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
			build.log.err(err);
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

var onLessOrCssFileChange = function(folders_to_watch, onChange){
	var is_ready = false;
	chokidar.watch(folders_to_watch, {ignored: /[\/\\]\./}).on('all', function(event, file_path){
		if(is_ready && /\.(less|css)$/.test(file_path)){
			onChange();
		}
	}).on('ready', function(){
		is_ready = true;
		onChange();
	});
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

	var css_folders_to_watch = _.unique(_.filter(_.flattenDeep(_.map(builds, function(build){
		if(build.type !== "css"){
			return;
		}
		return _.map(build.inputs, function(input_file){
			return path.dirname(path.resolve(input_file)) + "/";
		});
	}))));

	onLessOrCssFileChange(css_folders_to_watch, function(){
		_.each(css_tasks, function(fn){
			fn();
		});
	});
};
