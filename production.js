var _ = require("lodash");
var λ = require("contra");
var mkMyLog = require("./mkMyLog");
var buildCSS = require("./buildCSS");
var chokidar = require("chokidar");
var mkBrowserify = require("./mkBrowserify");
var mkOutputStream = require("./mkOutputStream");
var timeAndNBytesWritten = require("./timeAndNBytesWritten");

var outStreamWrap = function (out, done) {
    var n_bytes = 0;
    out.on("pipe", function (src) {
        src.on("data", function (data) {
            n_bytes += data.length;
        });
    });
    out.on("close", function () {
        done(undefined, n_bytes);
    });
};

module.exports = function (zeker) {

    λ.concurrent(_.flatten([

        /////////////////////////////////////////////
        //Build JS
        _.map(zeker.js, function (ignore, build_name) {
            var l = mkMyLog(build_name + ".min.js");

            return function (done) {
                var b = mkBrowserify(zeker, build_name, true);
                var out = mkOutputStream(zeker, build_name, "js", true);

                outStreamWrap(out, timeAndNBytesWritten(l, done));

                b.bundle().pipe(out);
            };
        }),

        /////////////////////////////////////////////
        //Build CSS
        _.map(zeker.css, function (ignore, build_name) {
            var l = mkMyLog(build_name + ".min.css");
            return function (done) {
                buildCSS(zeker, build_name, true, timeAndNBytesWritten(l, done));
            };
        })
    ]), function (err) {
        if (err) throw err;
        console.log("DONE!");
    });
};
