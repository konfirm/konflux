'use strict';

var placeholder = [
		'Math', 'Date', '\'object\'', '\'function\'', '\'length\''
	],
	replacements = {
		'[KX_LENGTH]': /\.length(?=\b)/g
	};

function replacement(input) {
	return 'KX_' + input.replace(/[^a-z]+/ig, '').toUpperCase();
}

module.exports = function(project, stream, done) {
	stream

		//  resolve script inclusion
		.pipe(project.plugin('include'))

		//  display the file size
		.pipe(project.plugin('size', {title: 'inclusion'}))

		//  write the `konflux.js` file
		.pipe(project.output())
	;

	//  traverse the replacements
	Object.keys(replacements).forEach(function(key) {
		stream = stream.pipe(project.plugin('replace', replacements[key], key));
	});

	//  Handle the placeholders
	placeholder.forEach(function(key) {
		var pattern = new RegExp(/^[a-z]/i.test(key) ? '\\b' + key + '(?=\\b)' : key, 'g');

		stream = stream.pipe(project.plugin('replace', pattern, replacement(key)));
	});

	return stream
		.pipe(project.plugin('replace', /var version/, 'var ' + placeholder.map(function(key) {
			return replacement(key) + '=' + key;
		}).join(',') + ', version'))

		//  display the file size
		.pipe(project.plugin('size', {title: 'horrify'}))

		//  write the .prep file
		.pipe(project.output('uglify', done))
	;
};
