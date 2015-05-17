/*jshint node:true*/
'use strict';

module.exports = function(stream, devour) {
	return stream
		//  resolve inclusion
		.pipe(devour.pipe('embed'))

		//  replace the placeholders
		.pipe(devour.pipe('placeholder'))
	;
};
