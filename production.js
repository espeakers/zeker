var _ = require("lodash");
var λ = require("contra");
var path = require("path");
var task = require("./task");
var mkMyLog = require("./mkMyLog");
var buildCSS = require("./buildCSS");
var chokidar = require("chokidar");
var runTests = require("./runTests");
var watchify = require("watchify");
var mkBrowserify = require("./mkBrowserify");
var mkOutputStream = require("./mkOutputStream");
var timeAndNBytesWritten = require("./timeAndNBytesWritten");

var outStreamWrap = function(out, done){
	var n_bytes = 0;
	out.on("pipe", function(src){
		src.on("data", function(data){
			n_bytes += data.length;
		});
	});
	out.on("close", function(){
		done(undefined, n_bytes);
	});
};

module.exports = function(zeker, js_builds, css_builds){

	var buildJSandCSS = function(onBuilt){
		λ.concurrent(_.flatten([

			/////////////////////////////////////////////
			//Build JS
			_.map(js_builds, function(build_name){
				var l = mkMyLog(build_name + ".min.js");

				return function(done){
					var b = mkBrowserify(zeker, build_name, true);
					var out = mkOutputStream(zeker, build_name, "js", true);

					outStreamWrap(out, timeAndNBytesWritten(l, done));

					b.bundle().pipe(out);
				};
			}),

			/////////////////////////////////////////////
			//Build CSS
			_.map(css_builds, function(build_name){
				var l = mkMyLog(build_name + ".min.css");
				return function(done){
					buildCSS(zeker, build_name, true, timeAndNBytesWritten(l, done));
				};
			})
		]), onBuilt);
	};

	console.log("== Running Tests ==");
	runTests(mkMyLog("npm test"), function(err){
		if(err) throw err;

		console.log("== Building JS and CSS ==");
		buildJSandCSS(function(){
			if(err) throw err;
			console.log("DONE!");
		});
	});
};
