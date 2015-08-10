var path = require('path');

module.exports = function(zeker, build_name, type, is_prod){
	if(type === 'js'){
		return path.join(zeker.output_directory, 'js', build_name + (is_prod ? '.min' : '') + '.js');
	}else if(type === 'css'){
		return path.join(zeker.output_directory, 'css', build_name + (is_prod ? '.min' : '') + '.css');
	}else{
		throw new Error('Unknown build output type: ' + type);
	}
};
