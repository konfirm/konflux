'use strict';

module.exports = function(project, stream, done) {
	return stream

		//  rename the file to <filename>.min<.ext>
		.pipe(project.plugin('rename', project.min))

		//  uglify the file
		.pipe(project.plugin('uglify'))

		//  display the file size
		.pipe(project.plugin('size', {title: 'uglify'}))

		//  remove anything that is should go out (the now excessive use of 'use strict')
		.pipe(project.plugin('replace', /([\'\"])use strict\1;?/g, ''))

		//  display the file size
		.pipe(project.plugin('size', {title: 'strict strip'}))

		//  write the file
		.pipe(project.output(done))
	;
};
