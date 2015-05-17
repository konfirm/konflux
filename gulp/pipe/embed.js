/*jshint node:true*/
'use strict';

var fs = require('fs'),
	through = require('through2'),
	embed = /([\t ]*)\/\/@embed:?\s*([a-z0-9_\-\.\/]+)/g;

function unwrap(content) {
	var header = /^;?\(function\([^\)]*\)\s*\{\s*(['"])use strict\1;?\n+/,
		footer = /\n+\s*\}\)\([^\)]*\);?\n+$/,
		indent;

	//  remove header and footer only if both are present in the expected format
	if (header.test(content) && footer.test(content)) {
		content = content.replace(header, '').replace(footer, '').split(/\n/).map(function(line) {
			var match;

			if (typeof indent === 'undefined') {
				match = line.match(/^(?:\n+?)?([\s]+)/);

				if (match) {
					indent = new RegExp('^' + match[1]);
				}
			}

			return line.replace(indent, '');
		}).join('\n');
	}

	return content.replace(/^\n+|\n+$/, '');
}

function getProjectOffset(path) {
	var self = __dirname.split('/'),
		base = path.split('/'),
		same = true;

	return base.filter(function(part, index) {
		if (same && part !== self[index]) {
			same = false;
		}

		return !same;
	}).join('/');
}

function report(start, size) {
	var end = process.hrtime(start),
		time = ['µs', 'ms', 's'],
		byte = ['bytes', 'KB', 'MB'],
		t, b;

	end = end[0] * 1e6 + end[1] / 1e3;

	while (end > 1000 && time.length > 1) {
		time.shift();
		end /= 1000;
	}

	while (size > 1024 && byte.length > 1) {
		byte.shift();
		size /= 1024;
	}

	return [
		end.toFixed(2), time.shift(),
		', ',
		size.toFixed(2), byte.shift()
	].join('');
}

function resolve(content, base, indent) {
	var path = getProjectOffset(base);

	return content.replace(embed, function(match, indentation, files) {
		return '\n' + files.split(/[,\s]+/).map(function(file) {
			var partial = file.split('/'),
				start = process.hrtime(),
				data, end;

			if (!/\.js$/.test(file)) {
				file += '.js';
			}

			data = resolve(
				unwrap(
					fs.readFileSync(base + file).toString(),
					(indent || '') + indentation
				),
				base + partial[0] + '/',
				indentation
			);

			end = process.hrtime(start);

			return [
				indentation + '//BEGIN EMBED: ' + path + file,
				data.split('\n').map(function(line) {
					return line ? indentation + line : '';
				}).join('\n'),
				'',
				indentation + '//END EMBED: ' + path + file + ' [' + report(start, data.length) + ']'
			].join('\n');
		}).join('');
	});
}

function checkDeclarations() {
	return through.obj(function(chunk, enc, done) {
		var path = chunk.path.split('/');

		if (chunk.isBuffer()) {
			chunk.contents = new Buffer(resolve(chunk.contents.toString(), path.slice(0, -1).join('/') + '/'));
		}

		this.push(chunk);
		done();
	});
}

module.exports = function(stream, devour) {
	return stream
		.pipe(checkDeclarations(devour))
	;
};
