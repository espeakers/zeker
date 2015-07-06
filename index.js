var _ = require('lodash');

module.exports = function(zeker, build_type, build_names){
	if(_.isEmpty(build_names)){
		build_names = _.unique(_.keys(zeker.js).concat(_.keys(zeker.css)));
	}

	var js_builds = _.filter(build_names, function(n){
		return _.has(zeker.js, n);
	});
	var css_builds = _.filter(build_names, function(n){
		return _.has(zeker.css, n);
	});

	require('./' + build_type)(zeker, js_builds, css_builds);
};
