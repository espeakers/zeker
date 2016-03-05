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

module.exports = function(zeker, is_prod){
	return _.flatten(_.map(zeker.builds, function(build_config, build_name){
		return _.map(groupPathsByType(_.isArray(build_config) ? build_config : build_config.files), function(files, type){
			var file_name = build_name + (is_prod ? '.min' : '') + '.' + type;

			return {
				log: mkMyLog(file_name),
				name: build_name,
				type: type,
				package_json_version: zeker.package_json_version,
				eslint_config_overrides: zeker.eslint_config_overrides,
				inputs: _.map(files, function(file_path){
					return path.join(zeker.src_directory, file_path);
				}),
				output: path.resolve(path.join(
									_.has(build_config, "output_directory")
										? build_config.output_directory
										: zeker.output_directory,
									type,
									file_name
								)),
				output_map: path.resolve(path.join(zeker.sourcemap_directory, file_name)) + ".map"
			};
		});
	}));
};
