/*jshint node:true*/
'use strict';

module.exports = function(project, stream) {
	return stream
		//  resolve inclusion
		.pipe(project.plugin('include'))
		//  write the full source to the output directory
		.pipe(project.write())

		//  call the 'minify' pipe
		.pipe(project.pipe('minify'))
	;
};
