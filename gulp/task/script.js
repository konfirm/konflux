/*jshint node:true*/
'use strict';

module.exports = function(project, stream) {
	return stream
		//  resolve inclusion
		.pipe(project.plugin('include'))

		//  rename the file to konflux.<filename>.<ext>
		.pipe(project.plugin('rename', function(file) {
			if (file.basename.indexOf('konflux') < 0) {
				file.basename = 'konflux.' + file.basename;
			}
		}))

		//  only process changed files
		.pipe(project.pipe('changed'))

		//  write the full source to the output directory
		.pipe(project.write())

		//  call the 'minify' pipe
		.pipe(project.pipe('minify'))
	;
};
