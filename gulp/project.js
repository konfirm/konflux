'use strict';

/**
 *  Convenience layer around the gulp build system to provide an even more modulair build system
 */
function Project() {
	var project = this,
		fs = require('fs'),
		gulp = require('gulp'),
		submerge = require('submerge'),
		defaults = {
			output: './dist',
			sauce: []
		},
		config, prepared, tasks;

	function init() {
		config   = submerge(require('./config/defaults.json'), defaults);
		prepared = {};
		tasks    = [];

		if ('tasks' in config && config.tasks instanceof Array) {
			config.tasks.forEach(function(task) {
				project.task.apply(project, [task].concat(config.tasks[task]));
			});
		}
	}

	function requireTaskFile(list, callback) {
		var file = list.length ? list.shift() : null;

		if (file) {
			if (fs.existsSync(file)) {
				return callback(null, require(file));
			}

			return requireTaskFile(list, callback);
		}

		callback(new Error('not found'));
	}

	function register(name, module, watch, build) {
		console.log('register task: %s', name);

		prepared[name] = module;

		gulp.task(name, function() {
			if (build) {
				return module(project, sauce(build));
			}

			return module(project, null);
		});

		if (watch) {
			tasks.push(name);
			gulp.watch(watch, [name]);
		}
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

	function sauce() {
		var stream = gulp.src.apply(null, arguments);

		config.sauce.forEach(function(plugin) {
			stream = stream.pipe(plug(plugin));
		});

		return stream;
	}

	project.config = function(key) {
		return key ? config[key] || null : config;
	};

	project.task = function(name, watch, build) {
		var file = __dirname + '/task/' + name + '/index.js';

		requireTaskFile([file, file.replace(/\/index/, '')], function(error, task) {
			if (error) {
				return console.log('Task not found: %s', name);
			}

			if (typeof watch === 'object' && !(watch instanceof Array)) {
				build = 'build' in watch ? watch.build : watch.watch;
				watch = watch.watch;
			}

			register(name, task, watch, build || watch);
		});
	};

	/**
	 *  Create a plugin and initialize it
	 *  @name    plugin
	 *  @access  public
	 *  @param   mixed   arguments
	 *  @return  stream
	 */
	project.plugin = function() {
		return plug.apply(null, arguments);
	};

	/**
	 *  Create a write steam (gulp.dest) and optionally set up a next stream
	 *  @name    output
	 *  @access  public
	 *  @param   string    next [optional, default undefined - no next]
	 *  @return  stream
	 */
	project.output = function(next) {
		var output = gulp.dest(config.output, {read: true});

		if (typeof next === 'string') {
			project.next(next, output);
		}

		return output;
	};

	project.next = function(task, stream, done) {
		stream.pipe(prepared[task](project, stream, done));

		return stream;
	};

	/**
	 *  Remove min or prep from given file basename and append .min to it
	 *  @name    min
	 *  @access  public
	 *  @param   object  file
	 *  @return  void
	 */
	project.min = function(file) {
		file.basename = file.basename.replace(/\.(?:min|prep)/, '') + '.min';
	};

	project.start = function() {
		var arg = Array.prototype.slice.call(arguments);

		gulp.task('default', arg.length ? arg : tasks);
	};

	init();
}

module.exports = new Project();
