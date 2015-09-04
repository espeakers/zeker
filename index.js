var _ = require("lodash");
var λ = require("contra");
var path = require("path");
var watch = require("./watch");
var mkdirp = require("mkdirp");
var production = require("./production");
var zekerConfigToBuildDescriptions = require("./zekerConfigToBuildDescriptions");

var zeker_defaults = {
	builds: {},
	src_directory: "src",
	output_directory: "public",
	asset_version_file: "public/index.php",
	sourcemap_directory: "source-maps"
};

var mkdirsForOutputPathsIfTheyDontExist = function(builds, callback){
	var paths_needed = _.unique(_.flattenDeep(_.map(builds, function(build){
		return [
			path.dirname(build.output),
			path.dirname(build.output_map)
		];
	})));
	λ.map(paths_needed, mkdirp, callback);
};

module.exports = function(zeker_orig, is_prod){
	is_prod = !!is_prod;

	var zeker = _.assign(zeker_defaults, zeker_orig);
	if(!_.has(zeker.builds, "tests")){
		zeker.builds.tests = ["tests.js"];
	}

	var builds = zekerConfigToBuildDescriptions(zeker, is_prod);

	mkdirsForOutputPathsIfTheyDontExist(builds, function(err){
		if(err) throw err;

		if(is_prod){
			production(builds, zeker.asset_version_file);
		}else{
			watch(builds);
		}
	});
};
