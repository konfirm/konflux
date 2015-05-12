'use strict';

module.exports = function(project, stream) {
	stream

		//  rename the file to konflux.<filename>.<ext>
		.pipe(project.plugin('rename', function(file) {
			if (file.basename.indexOf('konflux') < 0) {
				file.basename = 'konflux.' + file.basename;
			}
		}))

		//  resolve script inclusion
		.pipe(project.plugin('include'))

		//  write the full file
		.pipe(project.output())

		//  uglify the file
		.pipe(project.output('uglify'))
	;
};
