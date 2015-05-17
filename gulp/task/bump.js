/*jshint node:true*/
'use strict';

module.exports = function(stream, devour, type) {
	return stream
		//  bump the prerelease version on each change
		.pipe(devour.plugin('bump', {type:type || 'prerelease'}))
		//  as we are watching the package.json, we ensure it gets written to the working directory
		.pipe(devour.write(process.cwd()))
	;
};
