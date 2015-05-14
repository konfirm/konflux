'use strict';

/*jshint browser:false, node:true*/

function Project(base) {
	var project = this,
		gulp = require('gulp'),
		glob = require('glob'),
		submerge = require('submerge'),
		definitions = {},
		path = base || __dirname,
		config = submerge(require(path + '/config/defaults.json'), {
			output: './dist'
		}),
		active = [];

	function init() {
		var dirname = new RegExp('^' + path + '/');

		register('pipe', 'defaults', function(project, stream) {
			if ('defaults' in config) {
				config.defaults.forEach(function(name) {
					stream = stream.pipe(project.plugin(name));
				});
			}

			return stream;
		});

		glob.sync(path + '/*/*.js').map(function(file) {
			return file.replace(dirname, '').split('/');
		}).forEach(function(file) {
			register(
				file[0],
				file[file.length - 1].replace(/\.js$/, ''),
				require(path + '/' + file.join('/'))
			);
		});

		console.log([
			'Project initialized',
			'Pipes: ' + ('pipe' in definitions ? Object.keys(definitions.pipe).join(', ') : '/'),
			'Tasks: ' + ('task' in definitions ? Object.keys(definitions.task).join(', ') : '/')
		].join('\n\t'));
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
		var stream;

		if (!('buffer' in plug.prototype)) {
			plug.prototype.buffer = {};
		}

		if (!(name in plug.prototype.buffer)) {
			plug.prototype.buffer[name] = require('gulp-' + name);
		}

		//  this may be an a-typical gulp plugin (e.g. sourcemaps) which provides no stream, the implementer probably
		//  knows what to do with this
		if (typeof plug.prototype.buffer[name] !== 'function') {
			return plug.prototype.buffer[name];
		}

		stream = plug.prototype.buffer[name].apply(null, Array.prototype.slice.call(arguments, 1));

		//  always register an error listener
		stream.on('error', function() {
			console.log('ERROR', name, arguments);
		});

		return stream;
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
		return plug('clone');

		if ('pipe' in definitions && name in definitions.pipe) {
			return definitions.pipe[name](project, plug('clone'));
		}

		throw new Error('Pipe not found: ' + name);
	};

	project.config = function(value, otherwise) {
		return arguments.length ? config[value] || otherwise : config;
	};

	project.write = function(relative, options) {
		return gulp.dest(config.output + '/' + (relative || ''), options || null);
	};

	project.task = function(name, build, watch) {
		gulp.task(name, function() {
			return definitions.task[name](project, project.source(build));
		});

		if (watch !== false) {
			active.push(name);
			gulp.watch(watch || build, [name]);
		}

		return project;
	};

	project.start = function() {
		gulp.task('default', active);
	};

	init();
}

var	project = new Project(__dirname + '/gulp'),
	konflux = [
		'./src/konflux.js',
		'./src/core/ * * /*.js'
	],
	notkonflux = konflux.map(function(file) {
		return '!' + file;
	});

project
	.task('konflux', konflux, [notkonflux[1], konflux[0]])
	.start()
;

/*
var project = require('./gulp/project'),
	konflux = [
		'./src/konflux.js',
		'./src/core/ * * /*.js'
	],
	notkonflux = konflux.map(function(file) {
		return '!' + file;
	}),
	config = {
		//  stream tasks (non-watching)
		uglify: false,

		//  file watch tasks
		konflux: {
			watch: konflux,
			build: [notkonflux[1], konflux[0]]
		},

		script: {
			watch: notkonflux.concat(['./src/ ** / *.js']),
			build: notkonflux.concat(['./src/ * / *.js'])
		},

		syntax: './src/ * * / *.js'
	};

Object.keys(config).forEach(function(task) {
	project.task(task, config[task]);
});

project.start('konflux', 'script', 'syntax');
*/
/*
var gulp = require('gulp'),
	plumber = require('gulp-plumber'),
	changed = require('gulp-changed'),
	include = require('gulp-include'),
	uglify = require('gulp-uglify'),
	sourcemaps = require('gulp-sourcemaps'),
	rename = require('gulp-rename'),
	replace = require('gulp-replace'),
	jscs = require('gulp-jscs'),
	jshint = require('gulp-jshint'),
	size = require('gulp-filesize'),
	del = require('del');

gulp.task('konflux', function() {
	gulp.src([
		'./src/konflux.js'
	])
		.pipe(plumber())
		.pipe(include())
		.pipe(gulp.dest('./build'))
		.pipe(size())
		.pipe(sourcemaps.init())

		.pipe(uglify())
		.pipe(rename(function(file) {
			file.basename += '.min';
		}))
		.pipe(sourcemaps.write('./', {sourceRoot:'./'}))
		.pipe(size())
		.pipe(gulp.dest('./build'))
	;
});

gulp.task('scripts', function() {
	gulp.src([
		'!./src/konflux.js',
		'!./src/core/ ** / *.js',
		'./src/ * / *.js'
	])
		.pipe(plumber())
		.pipe(changed('./build'))
		.pipe(sourcemaps.init())
		.pipe(rename(function(file) {
			file.basename = 'konflux.' + file.basename;
		}))
		.pipe(include())
		.pipe(gulp.dest('./build'))
		.pipe(size())

		.pipe(uglify())
		.pipe(rename(function(file) {
			file.basename += '.min';
		}))
		.pipe(sourcemaps.write('./', {sourceRoot:'./'}))
		.pipe(size())
		.pipe(gulp.dest('./build'))
	;
});

gulp.task('syntax', function() {
	gulp.src('./src/ ** / *.js')
		.pipe(plumber())
		.pipe(changed('./build'))
		.pipe(jscs())
		.on('error', function(error) {
			console.log('JSCS', error.message);
		})

		.pipe(jshint())
		.on('error', function(error) {
			console.log('JSHINT', error.message);
		})
	;
});

gulp.task('clean', function(done) {
	del(['./build/*'], done);
});

gulp.task('watch', function() {
	gulp.watch([
		'./src/konflux.js',
		'./src/core/ ** / *.js'
	], ['konflux']);

	gulp.watch([
		'!./src/konflux.js',
		'!./src/core/ ** / *.js',
		'./src/ ** / *.js'
	], ['scripts']);

	gulp.watch(['./src/ ** / *.js'], ['syntax']);
});

gulp.task('default', ['clean', 'watch', 'konflux', 'scripts', 'syntax']);
*/
