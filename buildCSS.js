var fs = require("fs");
var path = require("path");
var less = require("less");
var CleanCSS = require("clean-css");
var mkOutputStream = require("./mkOutputStream");

module.exports = function(zeker, build_name, is_prod, done){
	var in_file = path.join(".", zeker.css[build_name]);
	fs.readFile(in_file, function(err, data){
		if(err) return done(err);

		var less_code = data.toString();

		less.render(less_code, {
			paths: [path.dirname(in_file)]
		}, function(err, output){
			if(err) return done(err);

			var css = is_prod ? new CleanCSS().minify(output.css).styles : output.css;

			var out = mkOutputStream(zeker, build_name, "css", is_prod);
			out.on("close", function(){
				done(undefined, css.length);
			});
			out.end(css);
		});
	});
};
