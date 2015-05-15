/*jshint node:true*/
'use strict';

module.exports = function(project, stream) {
	return stream
		//  initialize the sourcemap creator
		.pipe(project.plugin('sourcemaps').init())

		//  uglify the source and rename it to <filename>.min.<extenstion>
		.pipe(project.plugin('uglify'))
		.pipe(project.plugin('rename', project.min))

		//  remove anything that is should go out (the now excessive use of 'use strict')
		.pipe(project.plugin('replace', /([\'\"])use strict\1;?/g, ''))

		//  write the sourcemap
		.pipe(project.plugin('sourcemaps').write('./', {sourceRoot: './'}))

		//  report the new filesize
		.pipe(project.plugin('filesize'))

		//  write the (now) minified sources to the output directory
		.pipe(project.write())
	;
};
