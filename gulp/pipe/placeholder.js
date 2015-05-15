/*jshint node:true*/
'use strict';

var fs = require('fs'),
	rev = require('git-revision');

function version() {
	var json = JSON.parse(fs.readFileSync(process.cwd() + '/package.json'));

	return json && 'version' in json ? json.version : 'unknown';
}

function date() {
	var d = new Date();
	return [d.getFullYear(), d.getMonth() + 1, d.getDate()].map(function(part, index) {
		return index > 0 ? ('00' + part).substr(-2) : part;
	}).join('-');
}

module.exports = function(project, stream) {
	return stream
		//  replace '$DATE$' with the current date
		.pipe(project.plugin('replace', /\$DATE\$/g, date()))

		//  replace '$DEV$' with the version defined in package.json
		.pipe(project.plugin('replace', /\$DEV\$/g, version()))

		//  replace '$COMMIT$' with the current git revision
		.pipe(project.plugin('replace', /\$COMMIT\$/g, rev('short')))
	;
};
