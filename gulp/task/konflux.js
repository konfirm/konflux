/*jshint node:true*/
'use strict';

module.exports = function(project, stream) {
	return stream
		.pipe(project.plugin('include'))
		.pipe(project.write())

		.pipe(project.pipe('minify'))
	;
};
