var _ = require("lodash");
var path = require("path");
var mkMyLog = require("./mkMyLog");

var pathToAssetType = function(file_path){
	if(/\.js$/i.test(file_path)){
		return 'js';
	}else if(/\.(less|css)$/i.test(file_path)){
		return 'css';
	}else{
		throw new Error("unexpected input file type: " + file_path);
	}
};

var groupPathsByType = function(paths){
	return _.mapValues(_.groupBy(_.map(paths, function(file_path){
		return [pathToAssetType(file_path), file_path];
	}), 0), function(pairs){
		return _.pluck(pairs, 1);
	});
};

module.exports = function(zeker_orig, is_prod){
	is_prod = !!is_prod;

	var zeker = _.assign({
		tests: "tests.js",
		src_directory: "src",
		output_directory: "public",
		asset_version_file: "public/index.php"
	}, zeker_orig);

	zeker.builds["tests"] = _.flatten([zeker.tests]);//to ensure it's an array of paths;

	var builds = _.flatten(_.map(zeker.builds, function(entry_files, build_name){
		return _.map(groupPathsByType(entry_files), function(files, type){
			var file_name = build_name + (is_prod ? '.min' : '') + '.' + type;

			return {
				log: mkMyLog(file_name),
				name: build_name,
				type: type,
				inputs: files,
				output: path.join(zeker.output_directory, type, file_name)
			};
		});
	}));
	_.each(builds, function(build){
		build.inputs = _.map(build.inputs, function(file_path){
			return path.join(zeker.src_directory, file_path);
		});
	});
	return builds;
};
