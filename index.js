var _ = require("lodash");
var watch = require("./watch");
var production = require("./production");
var zekerConfigToBuildDescriptions = require("./zekerConfigToBuildDescriptions");

var zeker_defaults = {
	builds: {},
	src_directory: "src",
	output_directory: "public",
	asset_version_file: "public/index.php",
	sourcemap_directory: "source-maps"
};

module.exports = function(zeker_orig, is_prod){
	is_prod = !!is_prod;

	var zeker = _.assign(zeker_defaults, zeker_orig);
	if(!_.has(zeker.builds, "tests")){
		zeker.builds.tests = ["tests.js"];
	}

	var builds = zekerConfigToBuildDescriptions(zeker, is_prod);

	if(is_prod){
		production(builds, zeker.asset_version_file);
	}else{
		watch(builds);
	}
};
