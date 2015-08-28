var _ = require("lodash");
var λ = require("contra");
var fs = require('fs');
var chalk = require("chalk");
var convert = require("convert-source-map");
var through = require("through2");
var buildCSS = require("./buildCSS");
var UglifyJS = require("uglify-js");
var spawnTask = require('./spawnTask');
var mkBrowserify = require("./mkBrowserify");
var timeAndNBytesWritten = require("./timeAndNBytesWritten");
var updateHtmlAssetVersion = require("./updateHtmlAssetVersion");

var outStreamWrap = function (out, done) {
	var n_bytes = 0;
	out.on("pipe", function (src) {
		src.on("data", function (data) {
			n_bytes += data.length;
		});
	});
	out.on("close", function () {
		done(undefined, n_bytes);
	});
};

var minifyStream = function(source_map_file){
	var chuncks = [];

	return through(function(data, enc, done){
		chuncks.push(data);
		done();
	}, function(done){

		var js_code = chuncks.join("");

		var result = UglifyJS.minify(js_code, {
			fromString: true,
			inSourceMap: convert.fromSource(js_code).toObject(),
			outSourceMap: source_map_file
		});

		this.push(result.code);
		fs.writeFile(source_map_file, result.map, function(err){
			done(err || undefined);
		});
	});
};

var build_types = {
	js: function(build, done){
		var b = mkBrowserify(build, true);

		var wb = b.bundle();
		wb.on('error', function (err) {
			build.log.err(err);
			done(err);
		});

		if (build.name === 'tests') {
			var p = spawnTask('node', [], build.log, function (code) {
				if (code === 0) {
					build.log.log('tests passed');
					done();
				} else {
					build.log.err('tests failed (' + code + ')');
					done('tests failed (' + code + ')');
				}
			});
			wb.pipe(p.stdin);
		} else {
			var file_out_stream = fs.createWriteStream(build.output);
			outStreamWrap(file_out_stream, timeAndNBytesWritten(build.log, done));

			wb.pipe(minifyStream(build.output_map)).pipe(file_out_stream);
		}
	},
	css: function(build, done){
		buildCSS(build, timeAndNBytesWritten(build.log, done));
	}
};

module.exports = function(builds, asset_version_file){
	λ.concurrent(_.flatten([
		//so clients know the .js/.css files have been changed
		λ.curry(updateHtmlAssetVersion, asset_version_file),

		_.map(builds, function(build){
			if(!_.has(build_types, build.type)){
				throw new Erorr("unsupported build type: " + build.type);
			}
			return function(done){
				build_types[build.type](build, done);
			};
		})
	]), function (err) {
		if (err) {
			console.error(chalk.red("==============="));
			console.error(err);
			console.error(chalk.red("==============="));
			console.error(chalk.red("FAILED TO BUILD"));
			process.exit(1);
		}
		console.log("DONE!");
	});
};
