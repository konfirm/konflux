;(function(konflux) {

	/**
	 *  Iterator object, providing a uniform mechanism to traverse collections (Array, Object, DOMNodeList, etc)
	 *  @module  iterator
	 *  @factory konflux.iterator
	 *  @param   mixed collection
	 *  @note    available as konflux.iterator / kx.iterator
	 */
	function KonfluxIterator(collection) {
		'use strict';

		/*global konflux*/

		/*jshint validthis: true*/
		var iterator = this,
			keys, current;

		/**
		 *  Initialize the iterator object
		 *  @name    init
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function init() {
			var p;

			collection = collection || [];

			if (typeof collection !== 'object') {
				collection = [collection];
			}

			//  create a magic property for the length
			if ('length' in collection) {
				property('length');
			}

			//  decorate the iterator with the various collection members
			for (p in collection) {
				if (!(p in iterator)) {
					iterator[p] = relay(p);
				}
			}

			keys = iterator.keys();
		}

		/**
		 *  Create relayed access to a collection member
		 *  @name    relay
		 *  @type    function
		 *  @access  internal
		 *  @param   string member name
		 *  @return  function relay
		 */
		function relay(member) {
			if (konflux.isType('function', collection[member])) {
				return function() {
					return collection[member].apply(collection, konflux.array.cast(arguments));
				};
			}

			return collection[member];
		}

		/**
		 *  Try to create a getter for the given property, copy the value if a getter is not possible
		 *  @name    property
		 *  @type    function
		 *  @access  internal
		 *  @param   string name
		 *  @return  mixed  result (the property value if it was copied, KonfluxIterator otherwise)
		 */
		function property(name) {
			//  Unfortunatly we have to fall back onto a try catch block, as the IE8 implementation does not
			//  accept defined properties on any object other than DOMElements
			try {
				return Object.defineProperty(iterator, name, {
					get: function() {
						return collection[name];
					}
				});
			}
			catch (e) {
				return (iterator[name] = collection[name]);
			}
		}

		/**
		 *  Expand the underlying collection with another
		 *  @name    add
		 *  @type    function
		 *  @access  internal
		 *  @param   mixed  append
		 *  @return  void
		 */
		function add(append) {
			var length, i;

			//  for now we only support index based objects to handle expansion
			if (!('length' in collection)) {
				return false;
			}

			//  we enforce the underlying collection to become an array
			if (!(collection instanceof Array)) {
				collection = konflux.array.cast(collection);
			}

			//  if we are trying to append a KonfluxIterator instance, we want the underlying collection
			if (append instanceof KonfluxIterator) {
				append = append.collection();
			}

			//  and ensure it'll be an array
			if (!(append instanceof Array)) {
				append = konflux.isType('object', append) ? [append] : konflux.array.cast(append);
			}

			//  if the appending variable holds an array, we concatenate it into the collection
			if (append instanceof Array) {
				length     = collection.length;
				collection = collection.concat(append);
				keys       = iterator.keys();

				for (i = length; i < collection.length; ++i) {
					property(i);
				}

				return true;
			}

			return false;
		}


		/**
		 *  Create a function which implements a specific signature (which occurs repeatedly)
		 *  @name    implement
		 *  @type    function
		 *  @access  internal
		 *  @param   string   name
		 *  @param   function evaluation
		 *  @param   bool     one [optional, default undefined (false-ish) - return a KonfluxIterator]
		 *  @return  function implementation
		 */
		function implement(name, evaluate, one) {
			return function(callback, context) {
				var list, result, keys, i;

				//  always use the native implementation, if it exists
				if (name in collection && konflux.isType('function', collection[name])) {
					return new KonfluxIterator(collection[name].apply(collection, arguments));
				}

				list = collection instanceof Array ? [] : {};

				keys = iterator.keys();
				for (i = 0; i < keys.length; ++i) {
					result = evaluate(callback.apply(context || undefined, [collection[keys[i]], keys[i], collection]), collection[keys[i]]);

					if (result) {
						if (one) {
							return result;
						}

						list[keys[i]] = result;
					}
				}

				return konflux.iterator(list);
			};
		}

		/**
		 *  Obtain the raw underlying collection
		 *  @name    collection
		 *  @type    method
		 *  @access  public
		 *  @return  mixed collection
		 */
		iterator.collection = function() {
			return collection;
		};

		/**
		 *  Get or set the cursor position, if an non-existant position is given, the cursor does not budge
		 *  @name    cursor
		 *  @type    method
		 *  @access  public
		 *  @param   mixed index [optional, default null - don't update the cursor]
		 *  @return  mixed value
		 */
		iterator.cursor = function(index) {
			var result;

			if (index) {
				if (collection instanceof Array && index in keys) {
					current = index;
				}
				else if (!(collection instanceof Array)) {
					result = konflux.array.contains(keys, index);

					if (result) {
						current = result;
					}
				}
			}

			result = current || 0;

			return collection instanceof Array ? result : keys[result];
		};


		/**
		 *  Obtain a member from the underlying collection
		 *  @name    item
		 *  @type    method
		 *  @access  public
		 *  @param   mixed index
		 *  @return  mixed value
		 */
		iterator.item = function(index) {
			if ('item' in collection && konflux.isType('function', collection.item)) {
				return collection.item(index);
			}

			return ('length' in collection && (index >= 0 || index < collection.length)) || index in collection ? collection[index] : null;
		};

		/**
		 *  Obtain the current value, whithout shifting the cursor
		 *  @name    current
		 *  @type    method
		 *  @access  public
		 *  @return  mixed value
		 */
		iterator.current = function() {
			if (!current) {
				current = 0;
			}

			return 'undefined' !== typeof keys[current] ? iterator.item(keys[current]) : false;
		};

		/**
		 *  Obtain an array which contains all the keys for the underlying collection
		 *  @name    keys
		 *  @type    method
		 *  @access  public
		 *  @return  Array keys
		 */
		iterator.keys = function() {
			var result = [];

			iterator.each(function(value, key) {
				result.push(key);
			});

			return result;
		};

		/**
		 *  Create a new KonfluxIterator from the current containing only elements which received a true(-ish) result
		 *  from the provided filter method
		 *  @name    filter
		 *  @type    method
		 *  @access  public
		 *  @param   function evaluate
		 *  @param   object   thisArg 'this' [optional, default undefined]
		 *  @return  KonfluxIterator matches
		 */
		iterator.filter = implement('filter', function(result, item) {
			return !!result ? item : false;
		});

		/**
		 *  Return the first matching item (true-ish result from the evaluation function) from the iterator
		 *  @name    find
		 *  @type    method
		 *  @access  public
		 *  @param   function map
		 *  @param   object   thisArg 'this' [optional, default undefined]
		 *  @return  KonfluxIterator found
		 */
		iterator.find = implement('find', function(result, item) {
			return !!result ? item : false;
		}, true);

		/**
		 *  Create a new KonfluxIterator from the current containing items (possibly) modified by the map function
		 *  @name    map
		 *  @type    method
		 *  @access  public
		 *  @param   function map
		 *  @param   object   thisArg 'this' [optional, default undefined]
		 *  @return  KonfluxIterator mapped
		 */
		iterator.map = implement('map', function(result) {
			return result;
		});

		/**
		 *  Obtain the previous value, shifting the cursor to the previous position
		 *  @name    previous
		 *  @type    method
		 *  @access  public
		 *  @return  mixed value
		 */
		iterator.previous = function() {
			current = Math.max('undefined' !== typeof current ? current - 1 : 0, -1);

			return iterator.current();
		};

		/**
		 *  Obtain the previous value, shifting the cursor back
		 *  @name    prev
		 *  @type    method
		 *  @access  public
		 *  @return  mixed value
		 *  @alias   iterator.previous
		 */
		iterator.prev = iterator.previous;

		/**
		 *  Obtain the next value, shifting the cursor to the next position
		 *  @name    next
		 *  @type    method
		 *  @access  public
		 *  @return  mixed value
		 */
		iterator.next = function() {
			current = Math.min('undefined' !== typeof current ? current + 1 : 0, keys.length);

			return iterator.current();
		};

		/**
		 *  Traverse the underlying collection and call given handle on every item in the collection
		 *  @name    each
		 *  @type    method
		 *  @access  public
		 *  @param   function   callback
		 *  @param   object     thisArg (value to use as this when executing callback)
		 *  @return  KonfluxIterator instance
		 */
		iterator.each = function(callback, thisArg) {
			var p;

			if ('length' in collection) {
				for (p = 0; p < collection.length; ++p) {
					callback.apply(thisArg || undefined, [collection[p], p, iterator]);
				}
			}
			else {
				for (p in collection) {
					callback.apply(thisArg || undefined, [collection[p], p, iterator]);
				}
			}

			return iterator;
		};

		/**
		 *  Add items to the collection
		 *  @name    add
		 *  @type    method
		 *  @access  public
		 *  @param   mixed argument1
		 *  @param   mixed ...
		 *  @param   mixed argumentN
		 *  @return  KonfluxIterator instance
		 *  @note    Adding items to the collection will destroy the original collection and turn it into an array
		 *  @note    Any scalar variable type (String, Number, Boolean and NULL) will added as is, any
		 *           Array or Object will be disected and treated as array (if possible)
		 */
		iterator.add = function() {
			var i;

			for (i = 0; i < arguments.length; ++i) {
				add(arguments[i]);
			}

			return iterator;
		};

		init();
	}

	/**
	 *  Create a KonfluxIterator instance
	 *  @name   iterator
	 *  @type   method
	 *  @access public
	 *  @param  mixed collection
	 *  @return KonfluxIterator iterator
	 */
	konflux.register('iterator', function(collection) {
		return collection instanceof KonfluxIterator ? collection : new KonfluxIterator(collection);
	});

})(konflux);
