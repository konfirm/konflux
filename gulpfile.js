'use strict';

/*jshint browser:false, node:true*/

var	Project = require('./gulp/project'),
	project = new Project(require('./gulp/config/defaults.json'));

project
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

	.start()
;
