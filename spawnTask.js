var _ = require("lodash");
var spawn = require('child_process').spawn;

var toLines = function (str) {
    return _.reject(String(str && str.toString()).split("\n"), function (line) {
        return line.trim().length === 0;
    });
};

module.exports = function (cmd, args, l, done) {
    done = _.isFunction(done) ? done : _.noop;

    var p = spawn(cmd, args, {
        env: process.env
    }).on("close", function (code) {
        done(_.parseInt(code ? (code.code || code) : code, 10));
    });

    p.stdout.on("data", function (data) {
        _.each(toLines(data), _.ary(l.log, 1));
    });
    p.stderr.on("data", function (data) {
        _.each(toLines(data), _.ary(l.err, 1));
    });

    return p;
};
