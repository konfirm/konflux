/*jshint node:true*/
'use strict';

module.exports = function(stream, devour) {
	return stream
		//  resolve inclusion
		.pipe(devour.plugin('include'))

		//  replace the placeholders
		.pipe(devour.pipe('placeholder'))

		//  write the full source to the output directory
		.pipe(devour.write())

		//  call the 'minify' pipe
		.pipe(devour.pipe('minify'))
	;
};
