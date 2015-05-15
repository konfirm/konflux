/*jshint node:true*/
'use strict';

module.exports = function(project, stream) {
	return stream
		//  resolve inclusion
		.pipe(project.plugin('include'))

		//  replace the placeholders
		.pipe(project.pipe('placeholder'))

		//  write the full source to the output directory
		.pipe(project.write())

		//  call the 'minify' pipe
		.pipe(project.pipe('minify'))
	;
};
