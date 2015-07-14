var _ = require('lodash');
var pad = require('pad');
var chalk = require('chalk');

var getNextColorFn = (function(){
	var colors = [
		'green',
		'yellow',
		'blue',
		'magenta',
		'cyan',
		'gray'
	];
	var i = -1;
	return function(){
		i++;
		if(i >= colors.length){
			i = 0;
		}
		return chalk[colors[i]];
	};
}());

var logs = {};
var max_len = 0;
var show_ids = false;

module.exports = function(my_name){
	if(!logs.hasOwnProperty(my_name)){
		logs[my_name] = 0;
	}else{
		show_ids = true;//show ids if at least one task has more than one instance
	}
	var my_id = logs[my_name];
	logs[my_name]++;

	var color = getNextColorFn();

	var prefix = function(){
		var n = my_name + (show_ids ? '.' + my_id : '');
		if(n.length > max_len){
			max_len = n.length;
		}
		return color((new Date()).toString().substr(16, 8), pad(n, max_len), '|');
	};

	return {
		log: function(){
			console.log.apply(console, [prefix()].concat(_.toArray(arguments)));
		},
		err: function(){
			console.error.apply(console, [prefix()].concat(_.toArray(arguments).map(function(a){
				return chalk.red(JSON.stringify(a));
			})));
		}
	};
};
