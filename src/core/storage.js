/**
 *  Storage object, a simple wrapper for localStorage
 *  @module  storage
 *  @note    available as konflux.storage / kx.storage
 */
function KonfluxStorage() {
	'use strict';

	/*global konflux, window*/

	/*jshint validthis: true*/
	var ls = this,
		maxSize = 2048,
		storage = konflux.isType('undefined', window.localStorage) ? window.localStorage : false,
		fragmentPattern = /^\[fragment:([0-9]+),([0-9]+),([a-z0-9_]+)\]$/;

	/**
	 *  Combine stored fragments together into the original data string
	 *  @name    combineFragments
	 *  @type    function
	 *  @access  internal
	 *  @param   string data index
	 *  @return  string data combined
	 */
	function combineFragments(data) {
		var match = data ? data.match(fragmentPattern) : false,
			part, fragment, length, variable, i;

		if (match) {
			fragment = parseInt(match[1], 10);
			length   = parseInt(match[2], 10);
			variable = match[3];
			data     = '';

			for (i = 0; i < fragment; ++i) {
				part = storage.getItem(variable + i);
				if (part !== null) {
					data += part;
				}
				else {
					return false;
				}
			}

			if (!data || data.length !== length) {
				return false;
			}
		}

		return data;
	}

	/**
	 *  Split a large data string into several smaller fragments
	 *  @name    createFragments
	 *  @type    function
	 *  @access  internal
	 *  @param   string name
	 *  @param   string data
	 *  @return  bool   success
	 */
	function createFragments(name, data) {
		var variable = '__' + name,
			fragment = Math.ceil(data.length / maxSize),
			i;

		for (i = 0; i < fragment; ++i) {
			storage.setItem(variable + i, data.substring(i * maxSize, Math.min((i + 1) * maxSize, data.length)));
		}

		//  write the index
		storage.setItem(name, '[fragment:' + fragment + ',' + data.length + ',' + variable + ']');
	}

	/**
	 *  Remove all fragmented keys
	 *  @name    dropFragments
	 *  @type    function
	 *  @access  internal
	 *  @param   array  match
	 *  @return  void
	 */
	function dropFragments(match) {
		var fragment = parseInt(match[1], 10),
			variable = match[3],
			i;

		for (i = 0; i < fragment; ++i) {
			remove(variable + i);
		}
	}

	/**
	 *  Obtain all data from localStorage
	 *  @name    getAll
	 *  @type    function
	 *  @access  internal
	 *  @return  mixed  data
	 */
	function getAll() {
		var result = null,
			i, key;

		if (storage) {
			result = {};
			for (i = 0; i < storage.length; ++i) {
				key = storage.key(i);
				result[key] = getItem(key);
			}
		}

		return result;
	}

	/**
	 *  Obtain the data for given name
	 *  @name    getItem
	 *  @type    function
	 *  @access  internal
	 *  @param   string name
	 *  @return  mixed  data
	 */
	function getItem(name) {
		var data = storage ? storage.getItem(name) : false;

		if (data && data.match(fragmentPattern)) {
			data = combineFragments(data);
		}

		if (data && data.match(/^[a-z0-9]+:.*$/i)) {
			data = /([a-z0-9]+):(.*)/i.exec(data);
			if (data.length > 2 && data[1] === konflux.string.checksum(data[2])) {
				return JSON.parse(data[2]);
			}
		}

		return data ? data : false;
	}

	/**
	 *  Set the data for given name
	 *  @name    setItem
	 *  @type    function
	 *  @access  internal
	 *  @param   string name
	 *  @param   mixed  data
	 *  @return  string data
	 */
	function setItem(name, data) {
		data = JSON.stringify(data);
		data = konflux.string.checksum(data) + ':' + data;

		if (storage) {
			return data.length > maxSize ? createFragments(name, data) : storage.setItem(name, data);
		}

		return false;
	}

	/**
	 *  Remove the data for given name
	 *  @name    remove
	 *  @type    function
	 *  @access  internal
	 *  @param   string name
	 *  @return  bool   success
	 */
	function remove(name) {
		var data, match;

		if (storage) {
			data = storage.getItem(name);
			if (data && (match = data.match(fragmentPattern))) {
				dropFragments(match);
			}

			return storage.removeItem(name);
		}

		return false;
	}

	/**
	 *  Get the data for given name
	 *  @name    get
	 *  @type    method
	 *  @access  public
	 *  @param   string name [optional, default null - get all stored entries]
	 *  @return  mixed  data
	 */
	ls.get = function(name) {
		return name ? getItem(name) : getAll();
	};

	/**
	 *  Set the data for given name
	 *  @name    set
	 *  @type    method
	 *  @access  public
	 *  @param   string name
	 *  @param   mixed  data
	 *  @return  void
	 */
	ls.set = setItem;

	/**
	 *  Remove the data for given name
	 *  @name    remove
	 *  @type    method
	 *  @access  public
	 *  @param   string name
	 *  @return  bool   success
	 */
	ls.remove = remove;

	/**
	 *  Get the amount of stored keys
	 *  @name    length
	 *  @type    method
	 *  @access  public
	 *  @return  number stored keys
	 */
	ls.length = function() {
		return storage ? storage.length : false;
	};

	/**
	 *  Obtain all the keys
	 *  @name    keys
	 *  @type    method
	 *  @access  public
	 *  @return  Array  keys
	 */
	ls.keys = function() {
		var key = getAll(),
			list = [],
			p;

		for (p in key) {
			list.push(p);
		}

		return list;
	};

	/**
	 *  Flush all stored items
	 *  @name    flush
	 *  @type    method
	 *  @access  public
	 *  @return  void
	 */
	ls.flush = function() {
		var list = ls.keys(),
			i;
		for (i = 0; i < list.length; ++i) {
			remove(list[i]);
		}
	};

	/**
	 *  Obtain the (approximate) byte size of the entire storage
	 *  @name    size
	 *  @type    method
	 *  @access  public
	 *  @return  int size
	 */
	ls.size = function() {
		return decodeURI(encodeURIComponent(JSON.stringify(localStorage))).length;
	};
}
