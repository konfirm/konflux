/**
 *  Event attachment handler
 *  @module  event
 *  @note    available as konflux.event / kx.event
 */
function kxEvent() {
	'use strict';

	/*global konflux, kxEventDelegate, window, document, buffer, isType, deprecate, undef*/

	/*jshint validthis: true*/
	var event = this,
		queue = buffer('event.queue'),
		delegate, touch;

	//= include event/delegate.js

	/**
	 *  Ready state handler, removes all relevant triggers and executes any handler that is set
	 *  @name    handleReadyState
	 *  @type    function
	 *  @access  internal
	 *  @return  void
	 */
	function handleReadyState(e) {
		var run = false,
			p;

		if (document.removeEventListener) {
			document.removeEventListener('DOMContentLoaded', handleReadyState, false);
			window.removeEventListener('load', handleReadyState, false);
			run = true;
		}
		else if (document.readyState === 'complete') {
			document.detachEvent('onreadystate', handleReadyState);
			window.detachEvent('onload', handleReadyState);
			run = true;
		}

		if (run && queue.ready) {
			for (p in queue.ready) {
				queue.ready[p].call(e);
			}
		}
	}


	/**
	 *  Get the event name for given event
	 *  @name    getEventName
	 *  @type    function
	 *  @access  internal
	 *  @param   string     name
	 *  @param   DOMElement target
	 *  @return  string     name
	 */
	function getEventName(name, target) {
		var match = name.match(/^(transition|animation)(end|iteration|start)$/i),
			property;

		if (match && (property = konflux.style.property(match[1], target)) !== match[1]) {
			property = property.substr(0, property.length - match[1].length);
			name = property['to' + (property.length <= 2 ? 'Upper' : 'Lower') + 'Case']() + konflux.string.ucFirst(match[1]) + konflux.string.ucFirst(match[2]);
		}

		return name;
	}

	/**
	 *  Get the proper event type for given event trigger
	 *  @name    getEventType
	 *  @type    function
	 *  @access  internal
	 *  @param   string name
	 *  @return  string type
	 */
	function getEventType(name) {
		var list = '!afterprint!beforeprint!canplay!canplaythrough!change!domcontentloaded!durationchange!emptied!ended!input!invalid!loadeddata!loadedmetadata!offline!online!pause!play!playing!ratechange!readystatechange!reset!seeked!seeking!stalled!submit!suspend!timeupdate!volumechange!waiting!abort!domactivate!error!load!resize!scroll!select!unload!animationend!animationiteration!animationstart!beforeunload!blur!domfocusin!domfocusout!focus!focusin!focusout!click!contextmenu!dblclick!mousedown!mouseenter!mouseleave!mousemove!mouseout!mouseover!mouseup!show!compositionend!compositionstart!compositionupdate!copy!cut!paste!drag!dragend!dragenter!dragleave!dragover!dragstart!drop!hashchange!keydown!keypress!keyup!pagehide!pageshow!popstate!touchcancel!touchend!touchmove!touchstart!transitionend!wheel!',
			position = list.indexOf('!' + name.toLowerCase() + '!'),
			result;

		if (position < 0) {
			//  Use a Custom event for anything we don't know
			result = 'Custom';
		}

		//  'afterprint'         (HTML5) The associated document has started printing or the print preview has been closed.
		//  'beforeprint'        (HTML5) The associated document is about to be printed or previewed for printing.
		//  'canplay'            (HTML5 media) The user agent can play the media, but estimates that not enough data has been
		//                                     loaded to play the media up to its end without having to stop for further
		//                                     buffering of content.
		//  'canplaythrough'     (HTML5 media) The user agent can play the media, and estimates that enough data has been
		//                                     loaded to play the media up to its end without having to stop for further
		//                                     buffering of content.
		//  'change'             (DOM L2, HTML5) An element loses focus and its value changed since gaining focus.
		//  'DOMContentLoaded'   (HTML5) The document has finished loading (but not its dependent resources).
		//  'durationchange'     (HTML5 media) The duration attribute has been updated.
		//  'emptied'            (HTML5 media) The media has become empty; for example, this event is sent if the media has
		//                                     already been loaded (or partially loaded), and the load() method is called
		//                                     to reload it.
		//  'ended'              (HTML5 media) Playback has stopped because the end of the media was reached.
		//  'input'              (HTML5) The value of an element changes or the content of an element with the attribute
		//                               contenteditable is modified.
		//  'invalid'            (HTML5) A submittable element has been checked and doesn't satisfy its constraints.
		//  'loadeddata'         (HTML5 media) The first frame of the media has finished loading.
		//  'loadedmetadata'     (HTML5 media) The metadata has been loaded.
		//  'offline'            (HTML5 offline) The browser has lost access to the network.
		//  'online'             (HTML5 offline) The browser has gained access to the network (but particular websites
		//                                       might be unreachable).
		//  'pause'              (HTML5 media) Playback has been paused.
		//  'play'               (HTML5 media) Playback has begun.
		//  'playing'            (HTML5 media) Playback is ready to start after having been paused or delayed due to
		//                                     lack of data.
		//  'ratechange'         (HTML5 media) The playback rate has changed.
		//  'readystatechange'   (HTML5 and XMLHttpRequest) The readyState attribute of a document has changed.
		//  'reset'              (DOM L2, HTML5) A form is reset.
		//  'seeked'             (HTML5 media) A seek operation completed.
		//  'seeking'            (HTML5 media) A seek operation began.
		//  'stalled'            (HTML5 media) The user agent is trying to fetch media data, but data is unexpectedly
		//                                     not forthcoming.
		//  'submit'             (DOM L2, HTML5) A form is submitted.
		//  'suspend'            (HTML5 media) Media data loading has been suspended.
		//  'timeupdate'         (HTML5 media) The time indicated by the currentTime attribute has been updated.
		//  'volumechange'       (HTML5 media) The volume has changed.
		//  'waiting'            (HTML5 media) Playback has stopped because of a temporary lack of data.
		else if (position < 277) {
			//  HTMLEvent
			result = 'HTML';
		}

		//  'abort'              (DOM L3) The loading of a resource has been aborted.
		//  'DOMActivate'        (DOM L3) A button, link or state changing element is activated (use click instead).
		//  'error'              (DOM L3) A resource failed to load.
		//  'load'               (DOM L3) A resource and its dependent resources have finished loading.
		//  'resize'             (DOM L3) The document view has been resized.
		//  'scroll'             (DOM L3) The document view or an element has been scrolled.
		//  'select'             (DOM L3) Some text is being selected.
		//  'unload'             (DOM L3) The document or a dependent resource is being unloaded.
		else if (position < 334) {
			//  UIEvent
			result = 'UI';
		}

		//  'animationend'       (CSS Animations) A CSS animation has completed.
		//  'animationiteration' (CSS Animations) A CSS animation is repeated.
		//  'animationstart'     (CSS Animations) A CSS animation has started.
		else if (position < 381) {
			//  AnimationEvent
			result = 'Animation';
		}

		//  'beforeunload'       (HTML5)
		else if (position < 394) {
			//  BeforeUnloadEvent
			result = 'BeforeUnload';
		}

		//  'blur'               (DOM L3) An element has lost focus (does not bubble).
		//  'DOMFocusIn'         (DOM L3) An element has received focus (use focus or focusin instead).
		//  'DOMFocusOut'        (DOM L3) An element has lost focus (use blur or focusout instead).
		//  'focus'              (DOM L3) An element has received focus (does not bubble).
		//  'focusin'            (DOM L3) An element is about to receive focus (bubbles).
		//  'focusout'           (DOM L3) An element is about to lose focus (bubbles).
		else if (position < 445) {
			//  FocusEvent
			result = 'Focus';
		}

		//  'click'              (DOM L3) A pointing device button has been pressed and released on an element.
		//  'contextmenu'        (HTML5) The right button of the mouse is clicked (before the context menu is displayed).
		//  'dblclick'           (DOM L3) A pointing device button is clicked twice on an element.
		//  'mousedown'          (DOM L3) A pointing device button (usually a mouse) is pressed on an element.
		//  'mouseenter'         (DOM L3) A pointing device is moved onto the element that has the listener attached.
		//  'mouseleave'         (DOM L3) A pointing device is moved off the element that has the listener attached.
		//  'mousemove'          (DOM L3) A pointing device is moved over an element.
		//  'mouseout'           (DOM L3) A pointing device is moved off the element that has the listener attached or
		//                                off one of its children.
		//  'mouseover'          (DOM L3) A pointing device is moved onto the element that has the listener attached or
		//                                onto one of its children.
		//  'mouseup'            (DOM L3) A pointing device button is released over an element.
		//  'show'               (HTML5) A contextmenu event was fired on/bubbled to an element that has a
		//                               contextmenu attribute
		else if (position < 546) {
			//  MouseEvent
			result = 'Mouse';
		}

		//  'compositionend'     (DOM L3) The composition of a passage of text has been completed or canceled.
		//  'compositionstart'   (DOM L3) The composition of a passage of text is prepared (similar to keydown for
		//                                a keyboard input, but works with other inputs such as speech recognition).
		//  'compositionupdate'  (DOM L3) A character is added to a passage of text being composed.
		else if (position < 596) {
			//  CompositionEvent
			result = 'Composition';
		}

		//  'copy'               (Clipboard) The text selection has been added to the clipboard.
		//  'cut'                (Clipboard) The text selection has been removed from the document and added to the clipboard.
		//  'paste'              (Clipboard) Data has been transfered from the system clipboard to the document.
		else if (position < 611) {
			//  ClipboardEvent
			result = 'Clipboard';
		}

		//  'drag'               (HTML5) An element or text selection is being dragged (every 350ms).
		//  'dragend'            (HTML5) A drag operation is being ended (by releasing a mouse button or hitting the
		//                               escape key).
		//  'dragenter'          (HTML5) A dragged element or text selection enters a valid drop target.
		//  'dragleave'          (HTML5) A dragged element or text selection enters a valid drop target.
		//  'dragover'           (HTML5) An element or text selection is being dragged over a valid drop target (every 350ms).
		//  'dragstart'          (HTML5) The user starts dragging an element or text selection.
		//  'drop'               (HTML5) An element is dropped on a valid drop target.
		else if (position < 668) {
			//  DragEvent
			result = 'Drag';
		}

		//  'hashchange'         (HTML5) The fragment identifier of the URL has changed (the part of the URL after the #).
		else if (position < 679) {
			//  HashChangeEvent
			result = 'HashChange';
		}

		//  'keydown'            (DOM L3) A key is pressed down.
		//  'keypress'           (DOM L3) A key is pressed down and that key normally produces a character value
		//                                (use input instead).
		//  'keyup'              (DOM L3) A key is released.
		else if (position < 702) {
			//  KeyboardEvent
			result = 'Keyboard';
		}

		//  'pagehide'           (HTML5) A session history entry is being traversed from.
		//  'pageshow'           (HTML5) A session history entry is being traversed to.
		else if (position < 720) {
			//  PageTransitionEvent
			result = 'PageTransition';
		}

		//  'popstate'           (HTML5) A session history entry is being navigated to (in certain cases).
		else if (position < 729) {
			//  PopStateEvent
			result = 'PopState';
		}

		//  'touchcancel'        (Touch Events) A touch point has been disrupted in an implementation-specific manners
		//                                      (too many touch points for example).
		//  'touchend'           (Touch Events) A touch point is removed from the touch surface.
		//  'touchmove'          (Touch Events) A touch point is moved along the touch surface.
		//  'touchstart'         (Touch Events) A touch point is placed on the touch surface.
		else if (position < 771) {
			//  TouchEvent
			result = 'Touch';
		}

		//  'transitionend'      (Transition Events) A CSS Transition has completed.
		else if (position < 777) {
			//  TransitionEvent
			result = 'Transition';
		}

		//  'wheel'              (DOM L3) A wheel button of a pointing device is rotated in any direction.
		else if (position < 786) {
			//  WheelEvent
			result = 'Wheel';
		}

		return result + 'Event';
	}

	/**
	 *  Get a property name unique per event type/dom element
	 *  @name    getEventProperty
	 *  @type    function
	 *  @access  internal
	 *  @param   DOMElement target
	 *  @param   string     type
	 *  @return  string name
	 */
	function getEventProperty(target, type) {
		return '__kxEvent_' + type + '_' + konflux.dom.reference(target);
	}

	/**
	 *  Unify the event object, which makes event more consistent across browsers
	 *  @name    unifyEvent
	 *  @type    function
	 *  @access  internal
	 *  @return  Event object
	 */
	function unifyEvent(e) {
		var evt = e || window.event;

		if (isType(undef, evt.target)) {
			evt.target = !isType(undef, evt.srcElement) ? evt.srcElement : null;
		}

		if (isType(undef, evt.type)) {
			evt.type = evt.eventType;
		}

		evt.family = getEventType(evt.type);

		if (/^(mouse[a-z]+|drag(?:[a-z]+)?|drop|(?:dbl)?click)$/i.test(evt.type)) {
			evt.mouse = konflux.point(
				evt.pageX ? evt.pageX : (evt.clientX ? evt.clientX + document.body.scrollLeft + document.documentElement.scrollLeft : 0),
				evt.pageY ? evt.pageY : (evt.clientY ? evt.clientY + document.body.scrollTop + document.documentElement.scrollTop : 0)
			);
		}

		return evt;
	}

	/**
	 *  Prepare an iterator containing all given targets as item
	 *  @name    prepareTargetIterator
	 *  @type    function
	 *  @access  internal
	 *  @param   mixed target [one of: string CSSSelector, DOMElement, DOMNodeList, Array DOMElement, kxIterator DOMElement, window]
	 *  @return  kxIterator target
	 */
	function prepareTargetIterator(targets) {
		if (!targets) {
			targets = [];
		}

		if (targets === window) {
			targets = [targets];
		}

		if (isType('string', targets)) {
			targets = document.querySelectorAll(targets);
		}

		if (!isType('number', targets.length)) {
			targets = [targets];
		}

		return konflux.iterator(targets);
	}

	/**
	 *  Prepare an iterator containing all given events as item
	 *  @name    prepareEventIterator
	 *  @type    function
	 *  @access  internal
	 *  @param   mixed event [one of: string events, Array events, kxIterator events]
	 *  @return  kxIterator events
	 */
	function prepareEventIterator(events) {
		if (isType('string', events)) {
			events = events.replace(/\*/g, '').split(/[\s*,]+/);
		}
		else if (!events) {
			events = [];
		}

		return konflux.iterator(events);
	}

	/**
	 *  Attach event handler(s) to elements
	 *  @name    listen
	 *  @type    function
	 *  @access  internal
	 *  @param   mixed target [one of: string CSSSelector, DOMElement, DOMNodeList, Array DOMElement, kxIterator DOMElement, window]
	 *  @param   mixed event [one of: string events, Array events, kxIterator events]
	 *  @param   mixed [one of: function handler or string CSSSelector]
	 *  @param   mixed [one of: function handler or bool capture]
	 *  @param   mixed [one of: bool capture or null]
	 *  @return  void
	 */
	function listen(targets, events, filter, handler, capture) {
		if (!delegate) {
			delegate = new kxEventDelegate(unifyEvent);
		}

		events = prepareEventIterator(events);
		prepareTargetIterator(targets).each(function(target) {
			events.each(function(event) {
				var setting = delegate.create(target, event, filter, handler, capture || filter ? true : false);

				attach(setting.target, setting.type, setting.delegate, setting.capture);
			});
		});
	}

	/**
	 *  Remove event handlers from elements
	 *  @name    remove
	 *  @type    function
	 *  @access  internal
	 *  @param   mixed [one of: string CSSSelector, DOMElement, DOMNodeList, Array DOMElement, kxIterator DOMElement, function handler, window]
	 *  @param   mixed [one of: string events, Array events, kxIterator events, function handler, null]
	 *  @param   mixed [one of: string CSSSelector, function handler, null]
	 *  @param   mixed [one of: function handler, null]
	 *  @return  void
	 */
	function remove(targets, events, filter, handler) {
		var result = [],
			i;

		if (delegate) {
			if (!targets) {
				result = result.concat(delegate.find(null, null, null, handler));
			}
			else {
				prepareTargetIterator(targets).each(function(target) {
					if (!events) {
						result = result.concat(delegate.find(target, null, null, handler));
					}
					else {
						prepareEventIterator(events).each(function(event) {
							result = result.concat(delegate.find(target, event, filter, handler));
						});
					}
				});
			}

			if (result.length > 0) {
				for (i = 0; i < result.length; ++i) {
					detach(result[i].target, result[i].type, result[i].delegate, result[i].capture);
					delegate.remove(result[i].target, result[i].type, filter, handler);
				}

				return true;
			}
		}

		return false;
	}

	/**
	 *  Attach an event handler to the target element
	 *  @name    attach
	 *  @type    function
	 *  @access  internal
	 *  @param   DOMElement target
	 *  @param   string     event
	 *  @param   function   handler
	 *  @param   bool       capture
	 *  @return  void
	 */
	function attach(target, type, handler, capture) {
		var prop;

		if (target.addEventListener) {
			target.addEventListener(getEventName(type), handler, capture);
		}
		else if (target.attachEvent) {
			switch (getEventType(type)) {
				case 'CustomEvent':
					prop = getEventProperty(target, type);
					if (!(prop in target)) {
						Object.defineProperty(target, prop, {
							//  allow us to meddle with the defined property later on (e.g. remove it)
							configurable: true,

							//  prevent this property from showing up in a for .. in loop
							enumerable: false,
							get: function() {
								return type;
							},

							set: function(callback) {
								var name = 'on' + type,
									i;

								if (!(name in this)) {
									this[name] = [];
								}

								if (isType('function', callback)) {
									this[name].push(callback);
								}
								else {
									callback.returnValue = true;
									callback.srcElement  = this;

									for (i = 0; i < this[name].length; ++i) {
										this[name][i].apply(this, [callback]);
										if (!callback.returnValue) {
											break;
										}
									}
								}
							}
						});
					}

					//  assign the event handler
					target[prop] = handler;
					break;

				default:

					//  we deliberately ignore the 'capturing', as this will actually route any (such) event through
					//  the capture target in IE8 (which is the only browser using attachEvent
					target.attachEvent('on' + type, handler);
					break;
			}
		}

		return;
	}

	/**
	 *  Detach the event associated with the event type, handler and capturing from the target element
	 *  @name    detach
	 *  @type    function
	 *  @access  internal
	 *  @param   DOMElement target
	 *  @param   string     event
	 *  @param   function   handler
	 *  @param   bool       capture
	 *  @return  void
	 */
	function detach(target, type, handler, capture) {
		if (target.removeEventListener) {
			target.removeEventListener(getEventName(type), handler, capture);
		}
		else if (target.detachEvent) {
			switch (getEventType(type)) {
				case 'CustomEvent':
					delete target[getEventProperty(target, type)];
					break;

				default:
					target.detachEvent('on' + type, handler);
					break;
			}
		}
	}

	//  Custom events

	/**
	 *  Create an event object and fire it for any given target
	 *  @name    dispatch
	 *  @type    function
	 *  @access  internal
	 *  @param   mixed  target [one of: string CSSSelector, DOMElement, DOMNodeList, Array DOMElement, kxIterator DOMElement]
	 *  @param   string type
	 *  @param   object option
	 *  @return  void
	 */
	function dispatch(targets, name, option) {
		var type = getEventType(name) || 'CustomEvent',
			support = konflux.browser.feature(type),
			detail  = option || {},
			trigger = false,
			p;

		//  IE11 actually has the CustomEvent (and the likes), but one cannot construct those directly as they are objects
		if (support && isType('function', support)) {
			trigger = new support(name, {
				detail: detail,
				cancelable: true
			});
		}
		else if ('createEvent' in document) {
			trigger = document.createEvent(type);
			if (option || type === 'CustomEvent') {
				trigger.initCustomEvent(name, false, true, detail);
			}
			else {
				trigger.initEvent(name, false, true);
			}
		}
		else if ('createEventObject' in document) {
			trigger = document.createEventObject();
			trigger.eventType = name;
			trigger.detail    = detail;
		}

		if (trigger) {
			prepareTargetIterator(targets).each(function(target) {
				if ('dispatchEvent' in target) {
					target.dispatchEvent(trigger);
				}
				else if ('fireEvent' in target) {
					if (type === 'CustomEvent') {
						p = getEventProperty(target, name);

						//  simply set the event property as we've already set up an setter function on it
						if (!isType(undef, target[p])) {
							target[p] = trigger;
						}
					}
					else {
						target.fireEvent('on' + name, trigger);
					}
				}

			});

			return true;
		}

		return false;
	}

	//  expose public API

	/**
	 *  Attach event handler(s) to elements
	 *  @name    add
	 *  @type    method
	 *  @access  public
	 *  @param   mixed target [one of: string CSSSelector, DOMElement, DOMNodeList, Array DOMElement, kxIterator DOMElement]
	 *  @param   mixed event [one of: string events, Array events, kxIterator events]
	 *  @param   mixed [one of: function handler or string CSSSelector]
	 *  @param   mixed [one of: function handler or bool capture]
	 *  @param   mixed [one of: bool capture or null]
	 *  @return  kxEvent reference
	 *
	 *  @note    event.add(target, event, handler [,capture]) - add event handler(s) to target(s)
	 *  @note    event.add(target, event, filter, handler [,capture]) - add event handler(s) to a selection of elements in target(s) matching given filter
	 */
	event.add = function(targets, events, filter, handler, capture) {
		setTimeout(function() {
			listen.apply(event, [targets, events].concat(
				isType('function', filter) ? [null, filter, handler] : [filter, handler, capture]
			));
		}, 1);

		return event;
	};

	/**
	 *  Remove event handlers from elements
	 *  @name    remove
	 *  @type    method
	 *  @access  public
	 *  @param   mixed [one of: string CSSSelector, DOMElement, DOMNodeList, Array DOMElement, kxIterator DOMElement, function handler]
	 *  @param   mixed [one of: string events, Array events, kxIterator events, function handler, null]
	 *  @param   mixed [one of: string CSSSelector, function handler, null]
	 *  @param   mixed [one of: function handler, null]
	 *  @return  kxEvent reference
	 *
	 *  @note    event.remove(target)  - remove all event handling from given target(s)
	 *  @note    event.remove(handler) - remove any event handling using given handler from any target
	 *  @note    event.remove(target, event)   - remove given event(s) from given target(s)
	 *  @note    event.remove(target, handler) - remove any event handling using given handler from given target(s)
	 *  @note    event.remove(target, event, filter)  - remove given event(s) using given selector from given target(s)
	 *  @note    event.remove(target, event, handler) - remove given event(s) using given handler from given target(s)
	 *  @note    event.remove(target, event, filter, handler) - remove given event(s) matching given filter using given handler from given target(s)
	 */
	event.remove = function(targets, events, filter, handler) {
		var arg = [targets, events, filter, handler];

		//  if the first argument is a function, we assume it is a handler
		//  and remove the events using it from all elements
		if (isType('function', targets)) {
			arg = [null, null, null, targets];
		}

		//  if the second argument is a function, we assume the first argument
		//  to be the target(s) and remove all events using this handler from
		//  given target(s)
		else if (isType('function', events)) {
			arg = [targets, null, null, events];
		}

		//  if the third argument is a function, we know it is not a filter
		else if (isType('function', filter)) {
			arg = [targets, events, null, filter];
		}

		remove.apply(event, arg);
		return event;
	};

	/**
	 *  Add event listeners to target
	 *  @name    listen
	 *  @type    method
	 *  @access  public
	 *  @param   DOMElement target
	 *  @param   string event type
	 *  @param   function handler
	 *  @return  kxEvent reference
	 *  @alias   event.add
	 *  @note    This method is deprecated and will be removed in a future release, use event.add instead
	 */
	event.listen = function(targets, events, handler) {
		deprecate('konflux.event.listen will be deprecated, use konflux.event.add instead(which is a drop-in replacement)');
		return event.add(targets, events, handler);
	};

	/**
	 *  Listen for events on a parent element and only trigger it if the given selector applies
	 *  @name    live
	 *  @type    method
	 *  @access  public
	 *  @param   target element
	 *  @param   string event type(s)
	 *  @param   string filter
	 *  @param   function handler
	 *  @return  kxEvent reference
	 *  @alias   event.add
	 *  @note    This method is deprecated and will be removed in a future release, use event.add instead
	 */
	event.live = function(targets, events, filter, handler) {
		deprecate('konflux.event.live will be deprecated, use konflux.event.add instead(which is a drop-in replacement)');
		return event.add(targets, events, filter, handler);
	};

	/**
	 *  Trigger a custom event
	 *  @name    trigger
	 *  @type    method
	 *  @access  public
	 *  @param   DOMElement target
	 *  @param   string     name
	 *  @return  void
	 */
	event.trigger = function(target, name, option) {
		return dispatch(target, name, option);
	};

	/**
	 *  Is the browser capable of touch events
	 *  @name    hasTouch
	 *  @type    method
	 *  @access  public
	 *  @return  bool is touch device
	 */
	event.hasTouch = function() {
		if (!isType('boolean', touch)) {
			touch = konflux.browser.supports('touch');
		}

		return touch;
	};

	/**
	 *  Register handlers which get triggered when the DOM is ready for interactions
	 *  @name    ready
	 *  @type    method
	 *  @access  public
	 *  @param   function handler
	 *  @return  bool     isReady
	 */
	event.ready = function(handler) {
		//  the document is ready already
		if (/^interactive|complete$/.test(document.readyState)) {
			// make sure we run the 'event' asynchronously
			setTimeout(handler, 1);

			return true;
		}

		//  we cannot use the event.listen method, as we need very different event listeners
		if (undef === typeof queue.ready) {
			queue.ready = [];

			if (document.addEventListener) {
				//  prefer the 'DOM ready' event
				document.addEventListener('DOMContentLoaded', handleReadyState, false);

				//  failsafe to window.onload
				window.addEventListener('load', handleReadyState, false);
			}
			else {
				//  the closest we can get to 'DOMContentLoaded' in IE, this is still prior to onload
				document.attachEvent('onreadystatechange', handleReadyState);

				//  again the failsafe, now IE style
				window.attachEvent('onload', handleReadyState);
			}
		}

		queue.ready.push(handler);
		return false;
	};
}
