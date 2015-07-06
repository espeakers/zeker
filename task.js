var _ = require('lodash');

module.exports = function(fn){
	//make sure it runs one at a time and re-runs if one is triggered before it finishes
	var running = false;
	var queued = false;
	return _.debounce(function(){
		if(running){
			queued = true;//queue it
			return;
		}
		running = true;
		fn(function(){
			running = false;
			if(queued){
				queued = false;
				testIt();
			}
		});
	}, 100);
};
