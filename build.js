var mkBrowserify = require("./mkBrowserify");

module.exports = function (zeker, build_name) {
    var b = mkBrowserify(zeker, build_name, true);

    var wb = b.bundle();
    wb.on("error", function (err) {
        console.error(err);
        process.exit(1);
    });

    wb.pipe(process.stdout);
};