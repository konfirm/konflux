'use strict';

module.exports = function(project, stream) {
	stream

		//  nag about code formatting
		.pipe(project.plugin('jscs'))

		//  nag about anything else
		.pipe(project.plugin('jshint'))
	;
};
