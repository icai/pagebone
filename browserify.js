var fs = require("fs");
var browserify = require("browserify");
browserify("./src/pagebone.js",{
	standalone: 'Pagebone'
})
.transform("babelify", {
	presets: ["es2015"],
	"plugins": ["babel-plugin-add-module-exports"]
})
.bundle()
.pipe(fs.createWriteStream("dist/pagebone.bundle.js"));