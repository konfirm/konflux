/**
 *  Observer object, handles subscriptions to messages
 *  @module  observer
 *  @note    available as konflux.observer / kx.observer
 */
function kxObserver() {
	'use strict';

	/*global konflux, kxObservation, buffer, isType, unique, undef*/

	/*jshint validthis: true*/
	var observer = this,
		subscription = buffer('observer.subscriptions'),
		active = buffer('observer.active');

	//= include observer/observation.js

	/**
	 *  Create the subscription stack if it does not exist
	 *  @name    ensureSubscriptionStack
	 *  @type    function
	 *  @access  internal
	 *  @param   string stack name
	 *  @return  void
	 */
	function ensureSubscriptionStack(stack) {
		if (undef === typeof subscription[stack]) {
			subscription[stack] = [];
		}
	}

	/**
	 *  Add handler to specified stack
	 *  @name    add
	 *  @type    function
	 *  @access  internal
	 *  @param   string stack name
	 *  @param   function handler
	 *  @return  int total number of subscriptions in this stack
	 */
	function add(stack, handle) {
		ensureSubscriptionStack(stack);

		return subscription[stack].push(handle);
	}

	/**
	 *  Disable a handler for specified stack
	 *  @name    disable
	 *  @type    function
	 *  @access  internal
	 *  @param   string stack name
	 *  @param   function handler
	 *  @return  void
	 *  @note    this method is used from the Observation object, which would influence the number of
	 *           subscriptions if the subscription itself was removed immediately
	 */
	function disable(stack, handle) {
		var i;

		for (i = 0; i < subscription[stack].length; ++i) {
			if (subscription[stack][i] === handle) {
				subscription[stack][i] = false;
			}
		}
	}

	/**
	 *  Remove specified handler (and all disabled handlers) from specified stack
	 *  @name    remove
	 *  @type    function
	 *  @access  internal
	 *  @param   string stack name
	 *  @param   function handler [optional, default null - remove the entire stack]
	 *  @return  array removed handlers
	 */
	function remove(stack, handle) {
		var out = [],
			keep = [],
			i;

		ensureSubscriptionStack(stack);

		for (i = 0; i < subscription[stack].length; ++i) {
			(!subscription[stack][i] || subscription[stack][i] === handle ? out : keep).push(subscription[stack][i]);
		}

		subscription[stack] = keep;

		return out;
	}

	/**
	 *  Flush specified stack
	 *  @name    flush
	 *  @type    function
	 *  @access  internal
	 *  @param   string stack name
	 *  @return  array removed handlers (false if the stack did not exist);
	 */
	function flush(stack) {
		var out = false;

		if (!isType(undef, subscription[stack])) {
			out = subscription[stack];
			delete subscription[stack];
		}

		return out;
	}

	/**
	 *  Trigger the handlers in specified stack
	 *  @name    trigger
	 *  @type    function
	 *  @access  internal
	 *  @param   string stack name
	 *  @param   mixed variable1
	 *  @param   mixed ...
	 *  @param   mixed variableN
	 *  @return  void
	 */
	function trigger(stack) {
		var arg = konflux.array.cast(arguments),
			ref = unique(),
			part = stack.split('.'),
			wildcard = false,
			name, i;

		while (part.length >= 0)
		{
			active[ref] = true;
			name = part.join('.') + (wildcard ? (part.length ? '.' : '') + '*' : '');
			wildcard = true;

			if (undef !== typeof subscription[name]) {
				for (i = 0; i < subscription[name].length; ++i) {
					if (!active[ref]) {
						break;
					}

					if (subscription[name][i]) {
						arg[0] = new kxObservation(stack, subscription[name][i], ref);
						subscription[name][i].apply(subscription[name][i], arg);
					}
				}
			}

			if (!part.pop()) {
				break;
			}
		}

		delete active[ref];
	}

	/**
	 *  Subscribe a handler to an observer stack
	 *  @name    subscribe
	 *  @type    method
	 *  @access  public
	 *  @param   string stack name
	 *  @param   function handle
	 *  @param   function callback [optional, default undefined]
	 *  @return  kxObserver reference
	 */
	observer.subscribe = function(stack, handle, callback) {
		var list = stack.split(/[\s,]+/),
			result = true,
			i;

		for (i = 0; i < list.length; ++i) {
			result = (add(list[i], handle) ? true : false) && result;
		}

		if (callback) {
			callback.apply(observer, [result]);
		}

		return observer;
	};

	/**
	 *  Unsubscribe a handler from an observer stack
	 *  @name    unsubscribe
	 *  @type    method
	 *  @access  public
	 *  @param   string stack name
	 *  @param   function handle
	 *  @param   function callback [optional, default undefined]
	 *  @return  kxObserver reference
	 */
	observer.unsubscribe = function(stack, handle, callback) {
		var list = stack.split(/[\s,]+/),
			result = [],
			i;

		for (i = 0; i < list.length; ++i) {
			result = result.concat(handle ? remove(list[i], handle) : flush(list[i]));
		}

		if (callback) {
			callback.apply(observer, [result]);
		}

		return observer;
	};

	/**
	 *  Notify all subscribers to a stack
	 *  @name    notify
	 *  @type    method
	 *  @access  public
	 *  @param   string stack name
	 *  @param   mixed  variable1
	 *  @param   mixed  ...
	 *  @param   mixed  variableN
	 *  @return  void
	 */
	observer.notify = function() {
		var arg = konflux.array.cast(arguments),
			list = arg.shift().split(/[\s,]+/),
			i;

		for (i = 0; i < list.length; ++i) {
			trigger.apply(observer, [list[i]].concat(arg));
		}
	};
}
