/*jshint node:true*/
'use strict';

module.exports = function(stream, devour) {
	return stream
		//  rename the file to konflux.<filename>.<ext>
		.pipe(devour.plugin('rename', function(file) {
			if (file.basename.indexOf('konflux') < 0) {
				file.basename = 'konflux.' + file.basename;
			}
		}))

		//  'compile' the full files and check for changes
		.pipe(devour.pipe('compile'))

		//  write the full source to the output directory
		.pipe(devour.write())

		//  call the 'minify' pipe
		.pipe(devour.pipe('minify'))
	;
};
