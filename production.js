var _ = require("lodash");
var λ = require("contra");
var chalk = require("chalk");
var mkMyLog = require("./mkMyLog");
var buildCSS = require("./buildCSS");
var spawnTask = require('./spawnTask');
var mkBrowserify = require("./mkBrowserify");
var mkOutputStream = require("./mkOutputStream");
var timeAndNBytesWritten = require("./timeAndNBytesWritten");
var updateHtmlAssetVersion = require("./updateHtmlAssetVersion");

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

        //so clients know the .js/.css files have been changed
        λ.curry(updateHtmlAssetVersion, zeker.asset_version_file),

        /////////////////////////////////////////////
        //Build JS
        _.map(zeker.js, function (ignore, build_name) {
            var l = mkMyLog(build_name + ".min.js");

            return function (done) {
                var b = mkBrowserify(zeker, build_name, true);

                var wb = b.bundle();
                wb.on('error', function (err) {
                    l.err(err);
                    done(err);
                });

                var out;
                if (build_name === 'tests') {
                    var p = spawnTask('node', [], l, function (code) {
                        if (code === 0) {
                            l.log('tests passed');
                            done();
                        } else {
                            l.err('tests failed (' + code + ')');
                            done('tests failed (' + code + ')');
                        }
                    });
                    out = p.stdin;
                } else {
                    out = mkOutputStream(zeker, build_name, "js", true);
                    outStreamWrap(out, timeAndNBytesWritten(l, done));
                }

                wb.pipe(out);
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
        if (err) {
            console.error(chalk.red("==============="));
            console.error(err);
            console.error(chalk.red("==============="));
            console.error(chalk.red("FAILED TO BUILD"));
            process.exit(1);
        }
        console.log("DONE!");
    });
};
