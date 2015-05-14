/*jshint node:true*/
'use strict';

module.exports = function(project, stream) {
	var dest = project.config('output');

	return stream
		.pipe(project.plugin('rename', function(file) {
			console.log('a', file);
		}));

	// 	.pipe(project.plugin('sourcemaps').init())
	// 	.pipe(project.plugin('uglify'))
	// 	.pipe(project.plugin('rename', project.min))
	// 	.pipe(project.plugin('sourcemaps').write(dest, {sourceRoot: dest}))
	// 	.pipe(project.plugin('filesize'))
	// 	.pipe(project.write())
	// ;
};
