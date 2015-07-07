module.exports = function(l, done){
	var start_time = Date.now();
	return function(err, n_bytes){
		if(err){
			l.err(err);
			done(err);
		}else{
			var delta = Date.now() - start_time;
			l.log(n_bytes + ' bytes written (' + (delta / 1000).toFixed(2) + ' seconds)');
			done();
		}
	};
};
