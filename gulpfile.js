'use strict';

var project = require('./gulp/project'),
	konflux = [
		'./src/konflux.js',
		'./src/core/**/*.js'
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
			watch: notkonflux.concat(['./src/**/*.js']),
			build: notkonflux.concat(['./src/*/*.js'])
		}
	};

Object.keys(config).forEach(function(task) {
	project.task(task, config[task]);
});

project.start('konflux', 'script');
