/*jshint node:true*/
'use strict';

function Embed(devour, build) {
	var embed = this,
		fs = require('fs'),
		through = require('through2'),
		pattern = {
			//  declarative
			include: /([\t ]*)\/\/@(include|register):?\s*([a-z0-9_\-\.\/]+)\n/g,
			depend: /@depend:?\s(.*)/g,
			modules: /([\t ]*)\/\/@modules/,
			info: /([\t ]*)\/\/@buildinfo/,

			//  sanitation
			header: /^;?\(function\([^\)]*\)\s*\{(?:\s*\/\/.*)?\s*(['"])use strict\1;?\n+/,
			footer: /\n+\s*\}\)\([^\)]*\);?\n+$/,
			indentation: /^(?:\n+?)?([\s]+)/,

			// convenience
			separator: /[,\s]+/,
			js: /\.js$/
		},
		list = {};

	function processBuffer(buffer) {
		var content = buffer.contents.toString(),
			start = process.hrtime(),
			dependencies;

		content = resolve(buffer.contents.toString(), buffer.path);
		dependencies = getDependencies(build);

		if (dependencies.length) {
			content = content.replace(pattern.modules, function() {
				return dependencies.sort(function(a, b) {
					return b.name < a.name;
				}).map(function(dep) {
					return dep.content;
				}).join('\n');
			});
		}

		content = buildInfo(content, start, dependencies);

		buffer.contents = new Buffer(content);
	}

	function buildInfo(content, start, dependencies) {
		return content.replace(pattern.info, function(match, indentation) {
			var result = [
				'/**',
				'BUILD INFO',
				new Array(70).join('-'),
				'  date: ' + new Date()
			];

			report(start, content.length).split(/[,\s]+/).forEach(function(unit, index) {
				result.push((index === 0 ? '  time: ' : '  size: ') + unit);
			});

			if (build && build.length) {
				result.push(
					' build: ' + build.join(', ')
				);
			}

			if (dependencies.length) {
				result.push(
					new Array(70).join('-'),
					' files: included ' + dependencies.length + ' files'
				);

				result = result.concat(dependencies.map(function(dep) {
					var size = unit(dep.content.length, 1024, ['bytes', 'KB', 'MB']);
					return new Array(10 - size.length).join(' ') + '+' + size + ' ' + dep.name;
				}));
			}

			result.push(' */');

			return result.map(function(line, index, all) {
				return indentation + (index > 0 && index < all.length - 1? ' *  ' : '') + line;
			}).join('\n');
		});
	}

	function getDependencies(requires) {
		var changes = true,
			keys = Object.keys(list),
			deps = keys.filter(function(key) {
				return !list[key].included && (requires.length <= 0 || requires.indexOf(key) >= 0);
			}),
			iteration = 0,
			append;

		while (changes) {
			append = [];
			++iteration;

			deps.forEach(function(dep) {
				keys.filter(function(key) {
					return 'dependant' in list[key].type && list[key].type.dependant.indexOf(dep) >= 0 && deps.indexOf(key) < 0;
				}).forEach(function(key) {
					if (append.indexOf(key) < 0) {
						append.push(key);
					}
				});
			});

			changes = append.length;
			if (changes) {
				deps = deps.concat(append);
			}
		}

		return deps.sort(function(a, b) {
			return b < a;
		}).map(function(dep) {
			return list[dep];
		});
	}

	function resolve(content, origin, indent) {
		var base = getProjectOffset(origin),
			baseDir = base.split('/').slice(0, -1).join('/') + '/';

		//  process includes and registers
		content = content.replace(pattern.include, function(match, indentation, type, files) {
			var result = files.split(pattern.separator).map(function(file) {
					var filename = process.cwd() + '/' + baseDir + file + (pattern.js.test(file) ? '' : '.js'),
						start = process.hrtime(),
						module = include(getProjectOffset(filename).replace(pattern.js, ''), base, type),
						data;

					if (!module.content) {
						data = resolve(
							fs.readFileSync(filename).toString(),
							baseDir + file,
							indentation
						);

						data = unwrap(data, (indent || '') + indentation);

						module.content = [
							indentation + '//BEGIN INCLUDE: ' + file,
							data.split(/\n/).map(function(line) {
								return line ? indentation + line : '';
							}).join('\n'),
							'',
							indentation + '//END INCLUDE: ' + file + ' [' + report(start, data.length) + ']'
						].join('\n');
					}

					if (type === 'include' && !module.included) {
						module.included = true;
						return module.content;
					}

					return '';
				}).join('');

			return (result ? '\n' : '') + result;
		});

		//  extract dependencies
		content = content.replace(pattern.depend, function(match, files) {
			files.split(pattern.separator).forEach(function(file) {
				include(getProjectOffset('src/core/' + file), origin, 'dependant');
			});

			//  remove them from the output
			return '';
		});

		return content;
	}

	function unit(value, step, units, dec) {
		var list = units.slice(),
			result = +value;

		while (result > step && list.length > 1) {
			list.shift();
			result /= step;
		}

		return result.toFixed(dec || 2) + list.shift();
	}

	function report(start, size) {
		var end = process.hrtime(start);

		return [
			unit(end[0] * 1e6 + end[1] / 1e3, 1000, ['µs', 'ms', 's']),
			', ',
			unit(size, 1024, ['bytes', 'KB', 'MB'])
		].join('');
	}

	function unwrap(content) {
		var indent;

		//  remove header and footer only if both are present in the expected format
		if (pattern.header.test(content) && pattern.footer.test(content)) {
			content = content.replace(pattern.header, '').replace(pattern.footer, '').split(/\n/).map(function(line) {
				var match;

				if (typeof indent === 'undefined') {
					match = line.match(pattern.indentation);

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

	function include(name, module, type) {
		if (!(name in list)) {
			list[name] = {
				name: name,
				content: null,
				type: {},
				included: false
			};
		}

		if (!(type in list[name].type)) {
			list[name].type[type] = [];
		}

		list[name].type[type].push(module.replace(pattern.js, ''));

		return list[name];
	}

	embed.resolve = function() {
		return through.obj(function(chunk, enc, done) {
			if (chunk.isBuffer()) {
				processBuffer(chunk);
			}

			this.push(chunk);
			done();
		});
	};
}

module.exports = function(stream, devour, list) {
	var embed = new Embed(devour, list);

	return stream
		.pipe(embed.resolve())
	;
};
