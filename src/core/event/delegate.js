/**
 *  Delegate manager object, keep track of all delegates created for DOMElement/Event combinations
 *  @name    KonfluxEventDelegate
 *  @type    module
 *  @access  internal
 */
function KonfluxEventDelegate(unifier) {
	'use strict';

	/*global konflux*/

	/*jshint validthis: true*/
	var delegation = this,
		separator = '!',
		store = {};

	/**
	 *  Unify the event type into an object alway containing the name and the namespace
	 *  @name    namespace
	 *  @type    function
	 *  @access  internal
	 *  @param   string event type
	 *  @return  object namespace ({name: * | type, namespace: * || namespace})
	 */
	function namespace(type) {
		var match = type ? type.match(/^([^\.]*)?(?:\.(.+))?$/) : ['', '*', '*'];

		return {
			name: match[1] || '*',
			namespace: match[2] || '*'
		};
	}

	/**
	 *  Obtain a proper key value for given target DOMElement
	 *  @name    targetKey
	 *  @type    function
	 *  @access  internal
	 *  @param   DOMElement target
	 *  @return  string     key
	 */
	function targetKey(target) {
		return konflux.dom.reference(target);
	}

	/**
	 *  Remove whitespace and comments from given input, making nearly every string usable as key
	 *  @name    strip
	 *  @type    function
	 *  @access  internal
	 *  @param   string input
	 *  @return  string stripped
	 */
	function strip(input) {
		return (input + '').replace(/\s+|\/\*.*?\*\//g, '');
	}

	/**
	 *  Create a delegate function for the given combination of arguments, or return the previously created one
	 *  @name    create
	 *  @type    function
	 *  @access  internal
	 *  @param   DOMElement target
	 *  @param   string event namespace
	 *  @param   string event name
	 *  @param   string filter
	 *  @param   function handler
	 *  @param   bool capture
	 *  @return  object delegate ({target, namespace, type, filter, capture, delegate})
	 */
	function create(target, ns, type, filter, handler, capture) {
		var key = [
				targetKey(target),
				ns,
				type,
				filter ? strip(filter) : false,
				capture || false,
				strip(handler)
			].join(separator);

		//  if the key does not yet exist in the store, we create it
		if (!(key in store)) {
			store[key] = {
				target: target,
				namespace: ns,
				type: type,
				filter: filter,
				capture: capture || false,
				delegate: function(e) {
					var evt = e || window.event,
						result;

					if (filter) {
						if (!('target' in evt) && 'srcElement' in evt) {
							evt.target = evt.srcElement;
						}

						konflux.select(filter, target).each(function(element) {
							if (evt.target === element || konflux.dom.contains(element, evt.target)) {
								evt.delegate = target;
								result = handler.apply(element, [unifier(evt)]);
							}
						});
					}
					else if (handler) {
						result = handler.apply(target, [unifier(evt)]);
					}

					if (result === false) {
						if (evt.stopPropagation) {
							evt.stopPropagation();
						}
						else if (evt.cancelBubble) {
							evt.cancelBubble = true;
						}
					}
				}
			};
		}

		return store[key];
	}

	/**
	 *  Remove given key from the store
	 *  @name    remove
	 *  @type    function
	 *  @access  internal
	 *  @param   string key
	 *  @return  void
	 */
	function remove(key) {
		if (key in store) {
			delete store[key];
		}
	}

	/**
	 *  Find all delegates that match given arguments
	 *  @name    find
	 *  @type    function
	 *  @access  internal
	 *  @param   DOMElement target
	 *  @param   string event namespace
	 *  @param   string event name
	 *  @param   string filter
	 *  @param   function handler
	 *  @return  Array matches
	 */
	function find(target, ns, type, filter, handler) {
		var wildcard = '.*?',
			pattern = new RegExp([
				'^' + (target ? konflux.string.escapeRegExp(targetKey(target)) : wildcard),
				ns && ns !== '*' ? konflux.string.escapeRegExp(ns) : wildcard,
				type && type !== '*' ? konflux.string.escapeRegExp(type) : wildcard,
				filter ? konflux.string.escapeRegExp(strip(filter)) : wildcard,
				wildcard,
				(handler ? konflux.string.escapeRegExp(strip(handler)) : wildcard) + '$'
			].join(separator)),
			result = {},
			p;

		for (p in store) {
			if (pattern.test(p)) {
				result[p] = store[p];
			}
		}

		return result;
	}

	/**
	 *  Find all delegates that match given arguments
	 *  @name    find
	 *  @type    method
	 *  @access  public
	 *  @param   DOMElement target
	 *  @param   string event namespace
	 *  @param   string event name
	 *  @param   string filter
	 *  @param   function handler
	 *  @return  Array matches
	 */
	delegation.find = function(target, name, filter, handler) {
		var type = namespace(name),
			finds = find(target, type.namespace, type.name, filter, handler),
			result = [],
			p;

		for (p in finds) {
			result.push(finds[p]);
		}

		return result;
	};

	/**
	 *  Remove all delegates that match given arguments, and return all of the removed delegates
	 *  @name    find
	 *  @type    method
	 *  @access  public
	 *  @param   DOMElement target
	 *  @param   string event namespace
	 *  @param   string event name
	 *  @param   string filter
	 *  @param   function handler
	 *  @return  Array matches
	 */
	delegation.remove = function(target, name, filter, handler) {
		var type = namespace(name),
			finds = find(target, type.namespace, type.name, filter, handler),
			result = [],
			p;

		for (p in finds) {
			result.push(finds[p]);
			remove(p);
		}

		return result;
	};

	/**
	 *  Create a delegate function for the given combination of arguments, or return the previously created one
	 *  @name    create
	 *  @type    method
	 *  @access  public
	 *  @param   DOMElement target
	 *  @param   string event
	 *  @param   string filter
	 *  @param   function handler
	 *  @param   bool capture
	 *  @return  object delegate ({target, namespace, type, filter, capture, delegate})
	 */
	delegation.create = function(target, name, filter, handler, capture) {
		var type = namespace(name);

		return create(target, type.namespace, type.name, filter, handler, capture || false);
	};
}
