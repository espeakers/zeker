var _ = require("lodash");
var λ = require("contra");
var fs = require('fs');
var chalk = require("chalk");
var convert = require("convert-source-map");
var mkMyLog = require("./mkMyLog");
var through = require("through2");
var buildCSS = require("./buildCSS");
var UglifyJS = require("uglify-js");
var spawnTask = require('./spawnTask');
var mkBrowserify = require("./mkBrowserify");
var getOutFilePath = require('./getOutFilePath');
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

module.exports = function (zeker) {

	λ.concurrent(_.flatten([

		//so clients know the .js/.css files have been changed
		λ.curry(updateHtmlAssetVersion, zeker.asset_version_file),

		/////////////////////////////////////////////
		//Build JS
		_.map(zeker.js, function (ignore, build_name) {
			var l = mkMyLog(build_name + ".min.js");

			return function (done) {
				var b = mkBrowserify(zeker, build_name, true);

				var wb = b.bundle();
				wb.on('error', function (err) {
					l.err(err);
					done(err);
				});

				if (build_name === 'tests') {
					var p = spawnTask('node', [], l, function (code) {
						if (code === 0) {
							l.log('tests passed');
							done();
						} else {
							l.err('tests failed (' + code + ')');
							done('tests failed (' + code + ')');
						}
					});
					wb.pipe(p.stdin);
				} else {
					var out_file_path = getOutFilePath(zeker, build_name, "js", true);
					var file_out_stream = fs.createWriteStream(out_file_path);
					outStreamWrap(file_out_stream, timeAndNBytesWritten(l, done));

					wb.pipe(minifyStream(out_file_path + ".map")).pipe(file_out_stream);
				}
			};
		}),

		/////////////////////////////////////////////
		//Build CSS
		_.map(zeker.css, function (ignore, build_name) {
			var l = mkMyLog(build_name + ".min.css");
			return function (done) {
				buildCSS(zeker, build_name, true, timeAndNBytesWritten(l, done));
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
