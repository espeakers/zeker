var _ = require("lodash");
var λ = require("contra");
var fs = require("fs");
var path = require("path");
var less = require("less");
var CleanCSS = require("clean-css");

module.exports = function(build, done){
	λ.map(build.inputs, function(src, done){
		fs.readFile(src, function(err, data){
			done(err, err ? undefined : data.toString());
		});
	}, function(err, data){
		if(err) return done(err);

		var less_code = data.join("\n");

		less.render(less_code, {
			paths: _.unique(_.map(build.inputs, _.ary(path.dirname, 1)))
		}, function(err, output){
			if(err) return done(err);

			var css = output.css;
			if(/\.min\.css$/i.test(build.output)){
				css = new CleanCSS().minify(css).styles;
			}

			var out = fs.createWriteStream(build.output);
			out.on("close", function(){
				done(undefined, css.length);
			});
			out.end(css);
		});
	});
};
