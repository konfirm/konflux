/*jshint browser:false, node:true*/
'use strict';

var	Devour = require('devour'),
	Wanted = require('wanted');

new Wanted()
	.on('install', function(module) {
		module.accept();

		console.log('wanted %s: %s (%s)', module.state, module.name, module.version);
	})
	.on('ready', function(stat) {
		new Devour(require('./gulp/config/defaults.json'))
			.task(
				'konflux',
				//  the build pattern
				[
					//  do not build anything other than konflux.js
					'!./src/*/**/*.js',
					//  konflux.js
					'./src/konflux.js',
				],
				//  the watch pattern (we watch more than we build, thanks to the include plugin)
				[
					//  watch konflux.js
					'./src/konflux.js',
					//  watch core (and children)
					'./src/core/**/*.js'
				]
			)

			.task(
				'script',
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
				['./package.json'],
				//  update the prerelease version on every change
				['./src/**/*.js']
			)

			.start()
		;

	})
	.check({scope: 'devDependencies'})
;
