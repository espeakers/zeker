# zeker
opinionated asset bundler for front end projects (browserify + babel + uglify-js + eslint + less)

This assumes using [npm](https://www.npmjs.com/) as your package manager, and having a project.json file at the root of your project.

# Why not just use grunt, gulp, make, or bash?
When dealing with multiple projects that all need similar configuration keeping build processes constant can be a pain. Zeker just takes in a high level configuration and then handles all the rest for you.

It's hard to get front end builds done the "right way". When having multiple build tools and making them work together seamlessly it can be a pain. That's why there are so many grunt-\* packages b/c everyone needs to wrap some other tool to make it work better with their build process. Zeker side steps that by hand combining build tools to make a seamless experience that handles some of the harder cases for you. Such as:
 * Code must pass eslint before it's built
 * Tests should run against the same transform steps as your production code.
 * Your minified assets should have accurate source-maps. Which is hard to do when dealing with browserify + babel + uglify b/c each of them apply transformations to your code that need to be mapped.
 * You may want to build the same code but with different flags set

# What it does
 * bundles your code using browserify
 * runs eslint against your code, and doesn't compile until you make eslint happy.
 * compiles es6 features to es5 using babel (not all of es6 just some of the better parts of it)
 * compiles less into css
 * the output code is in strict mode (i.e. "use strict";)

Zeker has 2 modes:
 * **watch** - when you change code it will automatically run tests, eslint, and bundle your css and js
 * **production** - runs tests and eslint then bundles and minifies your css and js. It also emits accurate source-maps.

You define different builds i.e.
```js
{
  "main": ["app.js", "app.less"],
  "beta": ["beta.js", "app.less", "beta-extras.less"]
}
```
The `main` build will compile app.js into main.js for watch mode, and main.min.js for production.
The `beta` build will compile beta.js into beta.js or beta.min.js.

Likewise they each emit `main.css`/`main.min.css` and `beta.css`/`beta.min.css` respectively.

Zeker uses [envify](https://www.npmjs.com/package/envify) to allow you to use use environment variables in your builds. It sets `process.env.NODE\_ENV` to "development" in watch mode and "production" in production mode. It also sets `production.env.ZEKER\_BUILD\_NAME` to the name of the build. This way in your code you can do things like this:
```js
if(production.env.ZEKER_BUILD_NAME === "beta"){
  // do something that should only apear in the beta build
}else{
  // do something else
}
```
Although it may seem verbose to type it out rather than making a `is\_beta` variable, this way your code will be dead code eliminated during the minification step. Because your code gets compiled to this:
```js
if("beta" === "beta"){
  // do something that should only apear in the beta build
}else{
  // do something else
}
```
which then get's dead code eliminated to
```js
  // do something that should only apear in the beta build
```

# How to install / configure it
Install it
```sh
$ npm install --save-dev zeker
```

Add your zeker config to package.json
```js
  ...
  "zeker": {
    "builds": {
      "main": ["app.js", "app.less"],
      "beta": ["beta.js", "beta.less"],
      ...
    }
  },
  "scripts": {
    "start": "zeker watch",
    "production": "zeker production"
  }
  ...
```

Here are the defaults, you can over ride them as needed
```js
  ...
  "zeker": {
    "builds": {
      "tests": ["tests.js"]
    },
    "src_directory": "src",
    "output_directory": "public",
    "asset_version_file": "public/index.php",
    "sourcemap_directory": "source-maps"
  },
  ...
```
 * **src\_directory** where it should start looking for src files you defined in "builds"
 * **output\_directory** where the compiled assets should go by default "public/css/*" and "public/js/*"
 * **asset\_version\_file** this is so you can increment the build id so the browser clients will refresh their cache. This file just needs to have a variable somewhere that says `assets\_version = [0-9]+;`
 * **sourcemap\_directory** where the sourcemaps of the compiled js files should go.

# Node API
You can also use zeker directly via node
```js
var zeker = require("zeker");
...
zeker(config, is_prod);
```

# FYI

This project follows [semantic versioning](http://semver.org/) for releases.

# License

The MIT License (MIT)

Copyright (c) 2015 eSpeakers.com

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
