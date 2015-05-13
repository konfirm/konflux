/**
 *  FormData stub, in case a browser doesn't feature the FormData object
 *  @name    KonfluxFormData
 *  @type    module
 *  @access  internal
 *  @return  KonfluxFormData object
 */
function KonfluxFormData() {
	'use strict';

	/*global  konflux*/

	/*jshint validthis: true*/
	var formdata = this,
		data = {};

	/**
	 *  Append a key/value pair to the KonfluxFormData instance
	 *  @name    append
	 *  @type    method
	 *  @access  public
	 *  @param   string key
	 *  @param   mixed  value (can be anything but an object)
	 *  @return  KonfluxFormData reference
	 */
	formdata.append = function(key, value) {
		if (konflux.isType('object', value)) {
			data[key] = value;
		}

		return formdata;
	};

	/**
	 *  Serialize the KonfluxFormData instance into a string
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
	 *  Convenience method to make KonfluxFormData serialization work if used as string
	 *  @name    toString
	 *  @type    method
	 *  @access  public
	 *  @return  string urlencodes data
	 *  @note    This method is autmatically called when a KonfluxFormData instance is used as string (e.g. KonfluxFormData + '')
	 */
	KonfluxFormData.toString = function() {
		return formdata.serialize();
	};
}
