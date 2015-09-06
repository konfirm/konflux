/*jshint node:true*/
'use strict';

module.exports = function(stream, devour, suffix) {
	return stream
		//  initialize the sourcemap creator
		.pipe(devour.plugin('sourcemaps').init())

		//  uglify the source and rename it to <filename>.min.<extenstion>
		.pipe(devour.plugin('uglify'))
		.pipe(devour.plugin('rename', devour.min))

		//  remove anything that is should go out (the now excessive use of 'use strict')
		.pipe(devour.plugin('replace', /([\'\"])use strict\1;?/g, ''))

		//  write the sourcemap
		.pipe(devour.plugin('sourcemaps').write('./', {sourceRoot: './'}))

		//  report the new filesize
		.pipe(devour.pipe('size'))

		//  write the (now) minified sources to the output directory
		.pipe(devour.write(suffix))
	;
};
