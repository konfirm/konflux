'use strict';

/*jshint browser:false, node:true*/

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

var gulp = require('gulp'),
	plumber = require('gulp-plumber'),
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
		.pipe(sourcemaps.init())
		.pipe(include())
		.pipe(gulp.dest('./build', {read: true}))
		.pipe(size())

		.pipe(uglify())
		.pipe(rename(function(file) {
			file.basename += '.min';
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(size())
		.pipe(gulp.dest('./build'))
	;
});

gulp.task('scripts', function() {
	gulp.src([
		'!./src/konflux.js',
		'!./src/core/**/*.js',
		'./src/*/*.js'
	])
		.pipe(plumber())
		.pipe(sourcemaps.init())
		.pipe(rename(function(file) {
			file.basename = 'konflux.' + file.basename;
		}))
		.pipe(include())
		.pipe(gulp.dest('./build', {read: true}))
		.pipe(size())

		.pipe(uglify())
		.pipe(rename(function(file) {
			file.basename += '.min';
		}))
		.pipe(sourcemaps.write('./'))
		.pipe(size())
		.pipe(gulp.dest('./build'))
	;
});

gulp.task('syntax', function() {
	gulp.src('./src/**/*.js')
		.pipe(jscs())
	;
});

gulp.task('clean', function(done) {
	del(['./build/*'], done);
});

gulp.task('watch', function() {
	gulp.watch([
		'./src/konflux.js',
		'./src/core/**/*.js'
	], [
		'konflux'
	]);

	gulp.watch([
		'!./src/konflux.js',
		'!./src/core/**/*.js',
		'./src/**/*.js'
	], [
		'scripts'
	]);

	gulp.watch(['./src/**/*.js'], ['syntax']);
});

gulp.task('default', ['clean', 'watch', 'konflux', 'scripts', 'syntax']);
