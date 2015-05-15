/*jshint node:true*/
'use strict';

module.exports = function(project, stream) {
	var destination = project.config('output');

	return stream
		//  Add the "changed" plugin
		.pipe(project.plugin('changed', destination))
	;
};
