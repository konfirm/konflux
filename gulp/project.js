/*jshint node:true*/
'use strict';

/**
 *  Convenience layer around the gulp build system to provide an even more modulair/reusable build system
 */
function Project(settings) {
	var project = this,
		gulp = require('gulp'),
		glob = require('glob'),
		through = require('through2'),
		submerge = require('submerge'),
		definitions = {},
		path = process.cwd(),
		config = submerge(settings, {
			debounce: 100,
			gulpFiles: path + '/gulp',
			output: './dist'
		}),
		active = [];

	function init() {
		register('pipe', 'defaults', function(project, stream) {
			if ('defaults' in config) {
				config.defaults.forEach(function(name) {
					stream = stream.pipe(project.plugin(name));
				});
			}

			return stream;
		});

		glob.sync(config.gulpFiles + '/*/*.js').map(function(file) {
			return file.replace(config.gulpFiles, '').split('/').filter(function(split) {
				return !!split;
			});
		}).forEach(function(file) {
			register(
				file[0],
				file[file.length - 1].replace(/\.js$/, ''),
				require(config.gulpFiles + '/' + file.join('/'))
			);
		});

		console.log([
			'Project initialized',
			'- available pipes: ' + ('pipe' in definitions ? Object.keys(definitions.pipe).join(', ') : '/'),
			'- available tasks: ' + ('task' in definitions ? Object.keys(definitions.task).join(', ') : '/')
		].join('\n  '));
	}

	function register(type, name, callback) {
		if (!(type in definitions)) {
			definitions[type] = {};
		}

		definitions[type][name] = callback;
	}

	/**
	 *  Obtain a gulp plugin, initialized with given arguments
	 *  @name    plug
	 *  @access  internal
	 *  @param   string  name [automatically prefixed with 'gulp-']
	 *  @return  stream  initialized plugin
	 */
	function plug(name) {
		var part, scope, stream;

		if (!('buffer' in plug.prototype)) {
			plug.prototype.buffer = {};
		}

		part  = name.split('.');
		scope = part.shift();

		if (!(scope in plug.prototype.buffer)) {
			plug.prototype.buffer[scope] = require('gulp-' + scope);
		}
		scope = plug.prototype.buffer[scope];

		part.forEach(function(p) {
			scope = scope[p];
		});

		//  this may be an a-typical gulp plugin (e.g. sourcemaps) which provides no stream, the implementer probably
		//  knows what to do with this
		if (typeof scope !== 'function') {
			return scope;
		}

		//  invoke the function in the scope with the arguments after the name
		//  this should create a stream
		stream = scope.apply(null, Array.prototype.slice.call(arguments, 1));
		//  always register an error listener
		stream.on('error', function() {
			console.log('ERROR', name, arguments);
		});

		return stream;
	}

	function combiner(pipe) {
		var writer = through.obj(),
			piped  = pipe(project, writer),
			wrap = through.obj(function(chunk, enc, done) {
					writer.push(chunk);
					done();
				});

			piped.on('data', function(chunk) {
				wrap.push(chunk);
			});

		return wrap;
	}

	/**
	 *  Create a plugin and initialize it
	 *  @name    plugin
	 *  @access  public
	 *  @param   mixed   arguments
	 *  @return  stream
	 */
	project.plugin = plug;

	/**
	 *  Cleanup file basename and append .min to it
	 *  @name    min
	 *  @access  public
	 *  @param   object  file
	 *  @return  void
	 */
	project.min = function(file) {
		file.basename = file.basename.replace(/\.(?:min|prep)/, '') + '.min';
	};

	project.source = function() {
		return gulp.src.apply(gulp, arguments)
			.pipe(project.pipe('defaults'))
		;
	};

	project.pipe = function(name) {
		if ('pipe' in definitions && name in definitions.pipe) {
			return combiner(definitions.pipe[name]);
		}

		throw new Error('Pipe not found: ' + name);
	};

	project.config = function(value, otherwise) {
		return arguments.length ? config[value] || otherwise : config;
	};

	project.write = function(relative, options) {
		return gulp.dest(config.output + '/' + (relative || ''), options || {read:true});
	};

	project.task = function(name, build, watch) {
		console.log(
			'preparing task %s\n  - build pattern: %s\n  - watch pattern: %s',
			name,
			build.join(', '),
			watch !== false ? (watch || build).join(', ') : '(none, not watching)'
		);

		gulp.task(name, function() {
			return definitions.task[name](project, project.source(build));
		});

		if (watch !== false) {
			active.push(name);
			gulp.watch(watch || build, {debounceDelay: config.debounce}, [name]);
		}

		return project;
	};

	project.start = function() {
		gulp.task('default', active);
	};

	init();
}

module.exports = Project;
