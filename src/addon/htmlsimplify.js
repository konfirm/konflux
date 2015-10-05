/*
 *       __    Konflux HTML Simplification (version $DEV$ - $DATE$)
 *      /\_\
 *   /\/ / /   Copyright 2012-2014, Konfirm (Rogier Spieker)
 *   \  / /    Releases under the MIT license
 *    \/_/     More information: http://konfirm.net/konflux
 */

//@depends: array, browser, iterator, style
;(function(konflux) {
	'use strict';

	/*global window, document*/

	var version = '$DEV$ - $DATE$ - $COMMIT$';

	/**
	 *  HTMLSimplify object, designed to rewrite (small) portions of HTML to a configurable format
	 *  @module  htmlsimplify
	 *  @note    available as konflux.htmlsimplify / kx.htmlsimplify
	 */
	function KonfluxHTMLSimplify(config) {
		/*jshint validthis: true*/
		var simplify = this,
			settings;

		/**
		 *  initialize the module
		 *  @name    init
		 *  @type    function
		 *  @access  internal
		 *  @return  void
		 */
		function init() {
			settings = konflux.combine(config || {}, defaults());
		}

		/**
		 *  Obtain the default settings
		 *  @name    defaults
		 *  @type    function
		 *  @access  internal
		 *  @return  object  default settings
		 */
		function defaults() {
			return {
				selector: ['a[href]', 'a[href][target]', 'br', 'code', 'div', 'p', 'q', 'time'],
				style: [
					{property: 'font-weight', value: ['bold', '400+'], replace: 'bold'},
					{property: 'font-style', value: 'italic', replace: 'italic'},
					{property: 'text-decoration', allow: ['a'], value: 'underline', replace: 'underline'},
					{property: 'text-decoration', value: 'line-through', replace: 'strike'}
				],
				replace: {
					bold: 'b',
					italic: 'i',
					underline: 'u',
					strike: 'strike'
				}
			};
		}

		/**
		 *  Match given value to any of the options
		 *  @name    styleMatch
		 *  @type    function
		 *  @access  internal
		 *  @param   string  value
		 *  @param   mixed   option [one of: string value or array string values]
		 *  @return  bool    match
		 *  @note    any option which is not of type array or string will be cast to string
		 */
		function styleMatch(value, option) {
			var result = false,
				match;

			//  if option is an array, we call this function for each value
			if (option instanceof Array) {
				konflux.iterator(option).each(function(item) {
					if (!result) {
						result = styleMatch(value, item);
					}
				});

				return result;
			}

			//  we want to assume a string value for the options, hence we cast it to string
			if (!konflux.isType('string', option)) {
				option += '';
			}

			//  see if we've received a range option (<number><direction>)
			if ((match = option.match(/^([0-9]+)([+-])/))) {
				result = Math[match[2] === '+' ? 'min' : 'max'].call(+value, +match[1]) === +match[1];
			}
			else if (value === option) {
				result = true;
			}

			return result;
		}

		/**
		 *  Determine which style would best represent the source element style and create a DOMNode to represent this style
		 *  @name    unifyStyle
		 *  @type    function
		 *  @access  internal
		 *  @param   DOMNode  source
		 *  @param   DOMNode  scope
		 *  @return  DOMNode  scope
		 */
		function unifyStyle(source, scope) {
			konflux.iterator(settings.style).each(function(object) {
				var value = konflux.style.get(source, object.property),
					differ = value !== konflux.style.get(scope, object.property),
					allow = 'allow' in object && konflux.array.contains(object.allow, source.nodeName.toLowerCase());

				if (differ && styleMatch(value, object.value) && !allow) {
					scope = scope.appendChild(document.createElement(settings.replace[object.replace]));
				}
			});

			return scope;
		}

		/**
		 *  Determine which DOMElement would best represent the source element and return the most appropriate scope
		 *  @name    unifyStyle
		 *  @type    function
		 *  @access  internal
		 *  @param   DOMNode  source
		 *  @param   DOMNode  scope
		 *  @return  DOMNode  scope
		 */
		function unify(source, scope) {
			var match = konflux.browser.feature(['matches', 'matchesSelector'], source) || false,
				attr = /\[([^\]]+)\]/g,
				result;

			//  triage, determine if the source element matches any of the allowed ones
			if (match && match.apply(source, [settings.selector.join(',')])) {
				konflux.iterator(settings.selector).each(function(selector) {
					//  determine which selector matches (could be multiple)
					if (match.apply(source, [selector])) {
						//  if the selector matches a node name, we shift the scope to this node
						scope = scope.appendChild(document.createElement(source.nodeName.toLowerCase()));

						//  if the selector matches one or more attributes, we copy the attributes' full values
						while ((result = attr.exec(selector))) {
							scope.setAttribute(result[1], source.getAttribute(result[1]));
						}
					}

				});
			}

			scope = unifyStyle(source, scope);

			return scope;
		}

		/**
		 *  Traverse the source DOMNode structure and create a unified structure from it
		 *  @name    clean
		 *  @type    function
		 *  @access  internal
		 *  @param   DOMNode  source
		 *  @param   DOMNode  target
		 *  @return  void
		 */
		function clean(source, target) {
			var i;

			for (i = 0; i < source.childNodes.length; ++i) {
				switch (source.childNodes[i].nodeType) {

					//  DOMElement
					case 1:
						clean(
							source.childNodes[i],
							unify(source.childNodes[i], target)
						);
						break;

					//  DOMText, CDATASection
					case 3:
					case 5:
						target.appendChild(document.createTextNode(source.childNodes[i].textContent || source.childNodes[i].innerText));
						break;
				}
			}
		}

		/**
		 *  Create a unified HTML string from given source
		 *  @name    clean
		 *  @type    method
		 *  @access  public
		 *  @param   mixed  source [one of: string HTML or DOMNode source]
		 *  @return  string HTML
		 */
		simplify.clean = function(source) {
			var wrapper = document.createElement('div'),
				cleaned = wrapper.appendChild(document.createElement('div')),
				origin = wrapper.appendChild(document.createElement('div'));

			//  in order to be able to inspect the style characteristics, the element from which we copy needs
			//  to reside in the document(.body), as we don't want to actually see it, we hide it from the view.
			konflux.style.inline(wrapper, {
				display: 'none'
			});
			document.body.appendChild(wrapper);
			origin.innerHTML = typeof source === 'string' ? source : source.innerHTML;

			clean(origin, cleaned);

			//  as we are done cleaning up, we should remove anything we added to the DOM for our own benefits
			wrapper.parentNode.removeChild(wrapper);

			return cleaned.innerHTML;
		};

		init();
	}

	//  Append the module to konflux
	konflux.register('htmlsimplify', KonfluxHTMLSimplify);

})(window.konflux);
