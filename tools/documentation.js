'use strict';

/*jshint browser:false, node:true*/

var fs = require('fs'),
	esprima = require('esprima'),
	eatil = require('esprima-ast-utils'),
	glob = require('glob');

function parse(list) {
	var result = {},
		section = 'description',
		pattern = /@([a-z]+)\s([a-z]+)(?:\s(.*))?(?:\s\[([^\]]+))?/i,
		match, type, extra, tmp;

	list.forEach(function(item) {
		if ((match = item.match(pattern))) {
			if (match[1] !== section || section === 'param') {
				section = match[1];
				type    = /return|param/.test(section) ? match[2] : null;
				item    = (type ? [] : [match[2]]).concat(match[3] ? [match[3]] : []).join(' ');
				extra   = match[4] || null;
				tmp     = null;
			}
		}

		if (!(section in result)) {
			result[section] = [];
		}

		if (!tmp) {
			tmp = {
				type: type,
				extra: extra,
				value: ''
			};
			result[section].push(tmp);
		}

		tmp.value += item;
	});

	return result;
}

function clean(obj) {
	var result = {};

	Object.keys(obj).forEach(function(key) {
		if (!!obj[key]) {
			result[key] = obj[key];
		}
	});

	return result;
}

function docblock(value) {
	var result = parse(value.split(/\n/).map(function(value) {
		var tokens = value.split(/[\s\*]+/),
			preserve = false;
		return tokens.filter(function(token) {
			if (!preserve && !!token) {
				preserve = true;
			}

			return preserve;
		}).join(' ');
	}).filter(function(value) {
		return value && value !== '*';
	}));

	Object.keys(result).forEach(function(key) {
		if (result[key].length === 1) {
			result[key] = clean(result[key][0]);

			if (Object.keys(result[key]).length === 1 && 'value' in result[key]) {
				result[key] = result[key].value;
			}
		}
		else {
			result[key] = result[key].map(function(item) {
				return clean(item);
			});
		}
	});

	return result;
}

function walker(tree, output) {
	var tmp = output;

	if (tree.body) {
		if (tree.body instanceof Array) {
			tree.body.forEach(function(body) {
				if (body.type === 'Block') {
					tmp = docblock(body.value);
					tmp.tree = [];

					output.tree.push(tmp);
				}
				else {
					walker(body, tmp);
				}
			});
		}
		else {
			walker(tree.body, output);
		}
	}
	else if (tree.expression) {
		walker(tree.expression, output);
	}
	else if (tree.callee) {
		walker(tree.callee, output);
	}
}

function markup(structure) {
	var output = [];

	if (structure instanceof Array) {
		structure.forEach(function(item) {
			output.push(markup(item));
		});
	}
	else {
		if ('file' in structure) {
			if ('tree' in structure && structure.tree.length) {
				output.push(
					'<ul>',
					'<li data-file="', structure.file, '">',
					markup(structure.tree),
					'</li>',
					'</ul>'
				);
			}
		}
		else {
			output.push('<section', 'access' in structure ? ' data-access="' + structure.access + '"' : '', '>');

			if ('module' in structure) {
				output.push('<h1 data-type=module>', structure.module, '</h1>');
			}
			else if ('name' in structure) {
				output.push('<h2 data-type=name>', structure.name, '</h2>');
			}

			Object.keys(structure).map(function(key) {
				switch (key) {
					case 'param':
						if (!(structure[key] instanceof Array)) {
							structure[key] = [structure[key]];
						}

						output.push('<ul data-', key, '>');
						structure[key].forEach(function(param) {
							output.push(
								'<li>',
								'<code data-type=', param.type || 'unknown', '>',
								param.value || '',
								'</code>',
								'extra' in param ? '<span data-extra>' + param.extra + '</span>' : '',
								'</li>'
							);
						});

						output.push('</ul>');
						break;

					case 'return':
						output.push(
							'<code data-type=', 'type' in structure[key] ? structure[key].type : 'unknown', '>',
							'value' in structure[key] ? structure[key].value : '',
							'</code>'
						);
						break;

					case 'description':
					case 'note':
						output.push('<div data-type=', key, '>', structure[key], '</div>');
						break;
				}
			});

			if ('tree' in structure && structure.tree.length) {
				output.push(
					'<ul>',
					markup(structure.tree),
					'</ul>'
				);
			}

			output.push('</section>');
		}
	}

	return output.join('');
}

glob('../build/**/*.js', function(error, files) {
	var collect = [],
		timer;

	files.forEach(function(file) {
		var tmp;
		if (!/\.min\.js/.test(file)) {
			tmp = {
				file: file.replace('../build/', ''),
				tree: [],
				busy: true
			};
			collect.push(tmp);

			fs.readFile(file, function(error, source) {
				clearTimeout(timer);
				var tree = esprima.parse(source, {
						loc: true,
						range: true,
						tolerant: true,
						comment: true
					}),
					workers;

				tree.comments = tree.comments.filter(function(comment) {
					return /block/i.test(comment.type) && !/^[^\*]/i.test(comment.value);
				});

				eatil.attachComments(tree);
				walker(tree, tmp);

				delete tmp.busy;
				workers = collect.filter(function(worker) {
					return 'busy' in worker;
				}).length;

				if (!workers.length) {
					clearTimeout(timer);
					timer = setTimeout(function() {
//						process.stderr.write(JSON.stringify(collect, null, 2));
						process.stdout.write(markup(collect.sort(function(a, b) {
							var pathA = a.file.split('/'),
								pathB = b.file.split('/');

							return pathB.length < pathA.length || b.file - a.file;
						})));
					}, 100);
				}
			});
		}
	});
});
