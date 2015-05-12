/**
 *  FormData stub, in case a browser doesn't feature the FormData object
 *  @name    kxFormData
 *  @type    module
 *  @access  internal
 *  @return  kxFormData object
 */
function kxFormData() {
	'use strict';

	/*global isType*/

	/*jshint validthis: true*/
	var formdata = this,
		data = {};

	/**
	 *  Append a key/value pair to the kxFormData instance
	 *  @name    append
	 *  @type    method
	 *  @access  public
	 *  @param   string key
	 *  @param   mixed  value (can be anything but an object)
	 *  @return  kxFormData reference
	 */
	formdata.append = function(key, value) {
		if (!isType('object', value)) {
			data[key] = value;
		}

		return formdata;
	};

	/**
	 *  Serialize the kxFormData instance into a string
	 *  @name    serialize
	 *  @type    method
	 *  @access  public
	 *  @return  string  urlencoded data
	 */
	formdata.serialize = function() {
		var r = [],
			p;

		for (p in data) {
			r.push(p + '=' + encodeURIComponent(data[p]));
		}

		return r.join('&');
	};

	/**
	 *  Convenience method to make kxFormData serialization work if used as string
	 *  @name    toString
	 *  @type    method
	 *  @access  public
	 *  @return  string urlencodes data
	 *  @note    This method is autmatically called when a kxFormData instance is used as string (e.g. kxFormData + '')
	 */
	kxFormData.toString = function() {
		return formdata.serialize();
	};
}
