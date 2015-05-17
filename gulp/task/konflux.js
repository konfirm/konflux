/*jshint node:true*/
'use strict';

module.exports = function(stream, devour) {
	return stream
		//  'compile' the full files and check for changes
		.pipe(devour.pipe('compile'))

		//  write the full source to the output directory
		.pipe(devour.write())

		//  check the syntax
		.pipe(devour.plugin('jscs'))

		//  call the 'minify' pipe
		.pipe(devour.pipe('minify'))
	;
};
