var _ = require('lodash');
var mkMyLog = require('./mkMyLog');

module.exports = function(zeker, build_names){
	var js_builds = _.pairs(zeker.js).filter(function(p){
		return _.contains(build_names, p[0]);
	});
	js_builds = js_builds.length === 0 ? _.pairs(zeker.js) : js_builds;

	_.each(js_builds, function(p){
		var l = mkMyLog('js-' + p[0]);
		l.err('TODO watchify this', p);
	});
};
