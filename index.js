var watch = require("./watch");
var production = require("./production");
var zekerConfigToBuildDescriptions = require("./zekerConfigToBuildDescriptions");

module.exports = function(zeker, is_prod){
	var builds = zekerConfigToBuildDescriptions(zeker, is_prod);

	if(is_prod){
		production(builds, zeker.asset_version_file);
	}else{
		watch(builds);
	}
};
