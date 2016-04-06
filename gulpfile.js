/*jshint browser:false, node:true*/
'use strict';

var	Devour = require('devour'),
	Wanted = require('wanted'),
	fs = require('fs'),
	hjson = require('hjson');

(function(wanted) {
	wanted
		.on('install', function(module) {
			module.accept();

			console.log('wanted %s: %s (%s)', module.state, module.name, module.version);
		})
		.on('ready', function(stat) {
			fs.readFile(__dirname + '/gulp/config/defaults.json', function(error, data) {
				var config = hjson.parse(String(data)),
					push = process.cwd() + '/.push.json';

				if (fs.existsSync(push)) {
					config.push = require(push);
				}

				var devour = new Devour(config),
					build = {
						konflux: [
							//  do not build anything other than konflux.js
							'!./src/*/**/*.js',
							//  konflux.js
							'./src/konflux.js',
						]};

				devour
					.task(
						'konflux',
						//  the build pattern
						build.konflux,
						//  the watch pattern (we watch more than we build, thanks to the include plugin)
						[
							//  watch konflux.js
							'./src/konflux.js',
							//  watch core (and children)
							'./src/core/**/*.js'
						]
					)

					.task(
						'addon',
						//  the build pattern
						[
							//  we want averything in the subdirectories, except for core stuff
							'!./src/core/**/*.js',
							//  the subdirectories
							'./src/*/*.js',
						],
						//  the watch pattern (we watch more than we build, thanks to the include plugin)
						[
							//  nothing in core is our concern
							'!./src/core/**/*.js',
							//  everything else residing in a directory is
							'./src/*/**/*.js',
						]
					)

					.task(
						'bump',
						//  the build pattern
						'./package.json',
						//  update the prerelease version on every change
						'./src/**/*.js'
					)
				;


				['ajax', 'browser', 'dom', 'event', 'iterator', 'observer', 'style', 'event-observer'].forEach(function(special) {
					devour.task('konflux:' + special, build.konflux, false);
					console.log('To build the special ' + special + ' packages, run:\n\tdevour konflux:' + special + '\n');
				});

				devour
					.start()
				;

			});
		})
		.check({scope: 'devDependencies'})
	;

})(new Wanted());
