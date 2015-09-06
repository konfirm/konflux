/*jshint node:true*/
'use strict';

module.exports = function(stream, devour, name) {
	var match = name.match(/([a-z]+)(?::(.*))?/),
		list = [],
		special = false,
		suffix;

	if (match) {
		if (match[2]) {
			list = match[2].split(/[,\s]+/).map(function(key) {
				return 'src/core/' + key;
			});
			name = match[0].replace(/[^a-z]+/i, '-');
			special = true;
		}
	}

	return stream
		//  'compile' the full files and check for changes
		.pipe(devour.pipe('compile', list))

		//  rename the file if we are dealing with a special compilation
		.pipe(devour.plugin('rename', function(file) {
			if (special) {
				file.basename = name;
				console.log('Building special "%s" version, saved as %s', match[2], file.basename + file.extname);
			}
		}))

		//  write the full source to the output directory
		.pipe(devour.write(name))

		//  check the syntax
		.pipe(devour.plugin('jscs'))

		//  call the 'minify' pipe
		.pipe(devour.pipe('minify', name))
	;
};
