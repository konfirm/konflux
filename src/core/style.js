;(function(konflux) {
	//@depend: array, browser, event, string, url
	'use strict';

	/**
	 *  Style(sheet) manipulation
	 *  @module  style
	 *  @note    available as konflux.style / kx.style
	 */
	function KonfluxStyle() {
		/*jshint validthis: true*/
		var style = this;

		/**
		 *  Obtain the script property notation for given property
		 *  @name    scriptProperty
		 *  @type    function
		 *  @access  internal
		 *  @param   string property
		 *  @return  string script property
		 *  @note    'background-color' => 'backgroundColor'
		 */
		function scriptProperty(property) {
			var n = 0;

			if (property === 'float') {
				return 'cssFloat';
			}

			while ((n = property.indexOf('-', n)) >= 0) {
				property = property.substr(0, n) + property.charAt(++n).toUpperCase() + property.substring(n + 1);
			}

			return property;
		}

		/**
		 *  Obtain the CSS property notation for given property
		 *  @name    cssProperty
		 *  @type    function
		 *  @access  internal
		 *  @param   string property
		 *  @return  string CSS property
		 *  @note    'backgroundColor' => 'background-color'
		 */
		function cssProperty(property) {
			if (property === 'cssFloat') {
				property = 'float';
			}

			return property.replace(/([A-Z])/g, '-$1').toLowerCase();
		}

		/**
		 *  Determine whether or not the property is supported and try a vendor prefix, otherwise return false
		 *  @name    hasProperty
		 *  @type    function
		 *  @access  internal
		 *  @param   string  property
		 *  @param   DOMNode target [optional, default undefined - document.body]
		 *  @return  mixed  (one of: string (script)property, or false)
		 */
		function hasProperty(property, target) {
			property = scriptProperty(property);
			target   = target || document.body;

			if (property in target.style) {
				return property;
			}

			property = konflux.browser.prefix() + konflux.string.ucFirst(property);
			if (property in target.style) {
				return property;
			}

			return false;
		}

		/**
		 *  Obtain all local stylesheets, where local is determined on a match of the domain
		 *  @name    getLocalStylesheets
		 *  @type    function
		 *  @access  internal
		 *  @return  array stylesheets
		 */
		function getLocalStylesheets() {
			var all = document.styleSheets,
				list = [],
				i;

			for (i = 0; i < all.length; ++i) {
				if (konflux.url.isLocal(all[i].href)) {
					list.push(all[i]);
				}
			}

			return list;
		}

		/**
		 *  Obtain specific stylesheets
		 *  @name    getStylesheet
		 *  @type    function
		 *  @access  internal
		 *  @param   string name [optional, default 'all' - all stylesheets. Possible values 'first', 'last', 'all' or string filename]
		 *  @param   bool   includeOffset [optional, default false - local stylesheets only]
		 *  @return  array stylesheets
		 */
		function getStylesheet(name, includeOffsite) {
			var list = includeOffsite ? document.styleSheets : getLocalStylesheets(),
				match = [],
				i;

			switch (name) {
				//  get the first stylesheet from the list of selected stylesheets
				case 'first':
					if (list.length > 0) {
						match = [list[0]];
					}

					break;

				//  get the last stylesheet from the list of selected stylesheets
				case 'last':
					if (list.length > 0) {
						match = [list[list.length - 1]];
					}

					break;

				default:

					//  if no name was provided, return the entire list of (editable) stylesheets
					if (name === 'all') {
						match = list;
					}
					else if (!name) {
						match = false;
					}

					//  search for the stylesheet(s) whose href matches the given name
					else if (list.length > 0) {
						for (i = 0; i < list.length; ++i) {
							if (list[i].href && list[i].href.substr(-name.length) === name) {
								match.push(list[i]);
							}
							else if (list[i].title && list[i].title === name) {
								match.push(list[i]);
							}
						}
					}

					break;
			}

			return match;
		}

		/**
		 *  Obtain a stylesheet by its url or title
		 *  @name    findStylesheet
		 *  @type    function
		 *  @access  internal
		 *  @param   string url
		 *  @param   string name
		 *  @return  StyleSheet (bool false if not found)
		 */
		function findStylesheet(url, name) {
			var match = getStylesheet(url, true);
			if (name && match.length === 0) {
				match = getStylesheet(name, true);
			}

			return match.length > 0 ? match[0] : false;
		}

		/**
		 *  Create a new stylesheet
		 *  @name    createStylesheet
		 *  @type    function
		 *  @access  internal
		 *  @param   string url
		 *  @param   bool   before (effectively true for being the first stylesheet, anything else for last)
		 *  @param   string name
		 *  @return  style node
		 */
		function createStylesheet(url, before, name) {
			var element = findStylesheet(url, name),
				head = document.head || document.getElementsByTagName('head')[0];

			if (!element) {
				element = document.createElement(url ? 'link' : 'style');
				element.setAttribute('type', 'text/css');
				element.setAttribute('title', name || 'konflux.style.' + konflux.unique());

				if (/link/i.test(element.nodeName)) {
					element.setAttribute('rel', 'stylesheet');
					element.setAttribute('href', url);
				}

				if (before && document.head.firstChild) {
					head.insertBefore(element, head.firstChild);
				}
				else {
					head.appendChild(element);
				}
			}

			return element;
		}

		/**
		 *  Parse the style declarations' cssText into key/value pairs
		 *  @name    getStyleProperties
		 *  @type    function
		 *  @access  internal
		 *  @param   CSS Rule
		 *  @return  Object key value pairs
		 */
		function getStyleProperties(declaration) {
			var list = declaration.split(/\s*;\s*/),
				rules = {},
				i, part;

			for (i = 0; i < list.length; ++i) {
				part = list[i].split(/\s*:\s*/);

				if (part[0] !== '') {
					rules[scriptProperty(part.shift())] = normalizeValue(part.join(':'));
				}
			}

			return rules;
		}

		/**
		 *  Normalize given selector string
		 *  @name    normalizeSelector
		 *  @type    function
		 *  @access  internal
		 *  @param   string selector
		 *  @return  string normalized selector
		 */
		function normalizeSelector(selector) {
			return selector.split(/\s+/).join(' ').toLowerCase();
		}

		/**
		 *  Normalize given CSS value
		 *  @name    normalizeValue
		 *  @type    function
		 *  @access  internal
		 *  @param   string value
		 *  @return  string normalized value
		 */
		function normalizeValue(value) {
			var pattern = {
					//  minimize whitespace
					' ': /\s+/g,

					//  unify quotes
					'"': /["']/g,

					//  unify whitespace around separators
					',': /\s*,\s*/g,

					//  remove leading 0 from decimals
					'.': /\b0+\./g,

					//  remove units from 0 value
					0: /0(?:px|em|%|pt)\b/g
				},
				p;

			for (p in pattern) {
				value = value.replace(pattern[p], p);
			}

			//  most browsers will recalculate hex color notation to rgb, so we do the same
			pattern = value.match(/#([0-9a-f]+)/);
			if (pattern && pattern.length > 0) {
				pattern = pattern[1];
				if (pattern.length % 3 !== 0) {
					pattern = konflux.string.pad(pattern, 6, '0');
				}
				else if (pattern.length === 3) {
					pattern = pattern[0] + pattern[0] + pattern[1] + pattern[1] + pattern[2] + pattern[2];
				}

				value = 'rgb(' + [
					parseInt(pattern[0] + pattern[1], 16),
					parseInt(pattern[2] + pattern[3], 16),
					parseInt(pattern[4] + pattern[5], 16)
				].join(',') + ')';
			}

			return value;
		}

		/**
		 *  Add one or more css classes to given element
		 *  @name    addClass
		 *  @type    method
		 *  @access  public
		 *  @param   DOMelement element
		 *  @param   string classes (separated by any combination of whitespace and/or comma
		 *  @return  string classes
		 */
		style.addClass = function(element, classes) {
			var current = konflux.string.trim(element.className).split(/\s+/);

			element.className = current.concat(konflux.array.diff(classes.split(/[,\s]+/), current)).join(' ');

			return element.className;
		};

		/**
		 *  Remove one or more css classes from given element
		 *  @name    removeClass
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement element
		 *  @param   string classes (separated by any combination of whitespace and/or comma
		 *  @return  string classes
		 */
		style.removeClass = function(element, classes) {
			var delta = konflux.string.trim(element.className).split(/\s+/),
				classList = konflux.string.trim(classes).split(/[,\s]+/),
				i, p;

			for (i = 0; i < classList.length; ++i) {
				p = konflux.array.contains(delta, classList[i]);

				if (p !== false) {
					delta.splice(p, 1);
				}
			}

			element.className = delta.join(' ');

			return element.className;
		};

		/**
		 *  Toggle one or more css classes on given element
		 *  @name    toggleClass
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement element
		 *  @param   string classes (separated by any combination of whitespace and/or comma
		 *  @return  string classes
		 */
		style.toggleClass = function(element, classes) {
			var current = konflux.string.trim(element.className).split(/\s+/),
				classList = konflux.string.trim(classes).split(/[,\s]+/),
				i, p;

			for (i = 0; i < classList.length; ++i) {
				p = konflux.array.contains(current, classList[i]);
				if (p !== false) {
					current.splice(p, 1);
				}
				else {
					current.push(classList[i]);
				}
			}

			element.className = current.join(' ');

			return element.className;
		};

		/**
		 *  Apply style rules to target DOMElement
		 *  @name    inline
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement target
		 *  @param   object style rules
		 *  @return  KonfluxStyle reference
		 */
		style.inline = function(target, rules) {
			var p, q;

			for (p in rules) {
				q = hasProperty(p);

				if (q) {
					target.style[q] = rules[p];
				}
			}

			return style;
		};

		/**
		 *  Obtain a CSS selector for given element
		 *  @name    selector
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement target
		 *  @param   bool       skipNode [optional, default false - include node name]
		 *  @return  string selector
		 */
		style.selector = function(target, skipNode) {
			var node = target.nodeName.toLowerCase(),
				id = target.hasAttribute('id') ? '#' + target.getAttribute('id') : null,
				classes = target.hasAttribute('class') ? '.' + konflux.string.trim(target.getAttribute('class')).split(/\s+/).join('.') : null,
				select = '';

			if (arguments.length === 1 || id || classes) {
				select = (skipNode ? '' : node) + (id || classes || '');
			}

			return konflux.string.trim((!id && target.parentNode && target !== document.body ? style.selector(target.parentNode, true) + ' ' : '') + select);
		};

		/**
		 *  Obtain a stylesheet by its name or by a mnemonic (first, last, all)
		 *  @name    sheet
		 *  @type    method
		 *  @access  public
		 *  @param   string target [optional, default 'all' - all stylesheets. Possible values 'first', 'last', 'all' or string filename]
		 *  @param   bool   editable [optional, default true - only editable stylesheets]
		 *  @return  array  stylesheets
		 */
		style.sheet = function(target, editable) {
			var list = getStylesheet(konflux.isType('string', target) ? target : null, editable === false ? true : false),
				i;

			if (konflux.isType('undefined', target.nodeName)) {
				for (i = 0; i < list.length; ++i) {
					if (list[i].ownerNode === target) {
						return [list[i]];
					}
				}
			}

			return list;
		};

		/**
		 *  Create a new stylesheet, either as first or last
		 *  @name    create
		 *  @type    method
		 *  @access  public
		 *  @param   bool  before all other stylesheets
		 *  @return  styleSheet
		 */
		style.create = function(name, before) {
			var element = createStylesheet(false, before, name);

			return element.sheet || false;
		};

		/**
		 *  Load an external stylesheet, either as first or last
		 *  @name    load
		 *  @type    method
		 *  @access  public
		 *  @param   string   url the url of the stylesheet to load
		 *  @param   function callback
		 *  @param   bool     before all other style sheets
		 *  @return  style node (<link...> element)
		 */
		style.load = function(url, callback, before) {
			var style = createStylesheet(url, before);

			//  if style is a StyleSheet object, it has the ownerNode property containing the actual DOMElement in which it resides
			if (konflux.isType('undefined', style.ownerNode)) {
				style = style.ownerNode;

				//  it is safe to assume here that the stylesheet was loaded, hence we need to apply the callback (with a slight delay, so the order of returning and execution of the callback is the same for both load scenario's)
				if (callback) {
					setTimeout(function() {
						callback.apply(style, [style]);
					}, 1);
				}
			}
			else if (callback) {
				konflux.event.add(style, 'load', function(e) {
					callback.apply(style, [e]);
				});
			}

			return style;
		};

		/**
		 *  Determine whether or not the given style (node) is editable
		 *  @name    isEditable
		 *  @type    method
		 *  @access  public
		 *  @param   Stylesheet object or DOMelement style/link
		 *  @return  bool  editable
		 */
		style.isEditable = function(stylesheet) {
			var list = getLocalStylesheets(),
				node = konflux.isType('undefined', stylesheet.ownerNode) ? stylesheet.ownerNode : stylesheet,
				i;

			for (i = 0; i < list.length; ++i) {
				if (list[i].ownerNode === node) {
					return true;
				}
			}

			return false;
		};

		/**
		 *  Create and add a new style rule
		 *  @name    add
		 *  @type    method
		 *  @access  public
		 *  @param   string selector
		 *  @param   mixed  rules (one of; object {property: value} or string 'property: value')
		 *  @param   mixed  sheet (either a sheet object or named reference, like 'first', 'last' or file name)
		 *  @param   bool   skipNode [optional, default false - include node name]
		 *  @return  int    index at which the rule was added
		 */
		style.add = function(selector, rules, sheet, skipNode) {
			var rule = '',
				find, p, pr;

			//  in case the selector is not a string but a DOMElement, we go out and create a selector from it
			if (konflux.isType('object', selector) && 'nodeType' in selector) {
				selector = style.selector(selector, skipNode) || style.selector(selector);
			}

			//  make the rules into an object
			if (konflux.isType('string', rules)) {
				rules = getStyleProperties(rules);
			}

			//  if rules isn't an object, we exit right here
			if (!konflux.isType('object', rules)) {
				return false;
			}

			//  if no sheet was provided, or a string reference to a sheet was provided, resolve it
			if (!sheet || konflux.isType('string', sheet)) {
				sheet = getStylesheet(sheet || 'last');
			}

			//  in case we now have a list of stylesheets, we either want one (if there's just one) or we add the style to all
			if (sheet instanceof Array) {
				if (sheet.length === 1) {
					sheet = sheet[0];
				}
				else if (sheet.length <= 0) {
					sheet = createStylesheet().sheet;
				}
				else {
					rule = true;
					for (p = 0; p < sheet.length; ++p) {
						rule = rule && style.add(selector, rules, sheet[p]);
					}

					return rule;
				}
			}

			//  populate the find buffer, so we can determine which style rules we actually need
			find = style.find(selector, sheet);
			for (p in rules) {
				if (!(p in find) || normalizeValue(find[p]) !== normalizeValue(rules[p])) {
					pr = hasProperty(p);
					if (pr) {
						rule += (rule !== '' ? ';' : '') + cssProperty(pr) + ':' + rules[p];
					}
				}
			}

			//  finally, add the rules to the stylesheet
			if (sheet.addRule) {
				return sheet.addRule(selector, rule);
			}
			else if (sheet.insertRule) {
				return sheet.insertRule(selector + '{' + rule + '}', sheet.cssRules.length);
			}

			return false;
		};

		/**
		 *  Find all style rules for given selector (in optionally given sheet)
		 *  @name    find
		 *  @type    method
		 *  @access  public
		 *  @param   string selector
		 *  @param   mixed  sheet [optional, either a sheet object or named reference, like 'first', 'last' or file name]
		 *  @return  object style rules
		 */
		style.find = function(selector, sheet) {
			var match = {},
				rules, i, j;

			if (selector) {
				selector = normalizeSelector(selector);
			}

			if (!sheet) {
				sheet = getStylesheet();
			}
			else if (!(sheet instanceof Array)) {
				sheet = [sheet];
			}

			for (i = 0; i < sheet.length; ++i) {
				rules = konflux.type(sheet[i].cssRules) ? sheet[i].cssRules : sheet[i].rules;
				if (rules && rules.length) {
					for (j = 0; j < rules.length; ++j) {
						if ('selectorText' in rules[j] && (!selector || normalizeSelector(rules[j].selectorText) === selector)) {
							match = konflux.combine(match, getStyleProperties(rules[j].style.cssText));
						}
					}
				}
			}

			return match;
		};

		/**
		 *  Get the given style property from element
		 *  @name    get
		 *  @type    method
		 *  @access  public
		 *  @param   DOMElement element
		 *  @param   string     property
		 *  @param   string     pseudo tag [optional, default undefined - no pseudo tag]
		 *  @return  string     value
		 */
		style.get = function(element, property, pseudo) {
			var value;

			property = hasProperty(property);
			if (property) {
				if (element.currentStyle) {
					value = element.currentStyle(scriptProperty(property));
				}
				else if (window.getComputedStyle) {
					value = document.defaultView.getComputedStyle(element, pseudo || null).getPropertyValue(cssProperty(property));
				}
			}

			return value;
		};

		/**
		 *  Determine whether or not the property is supported and try a vendor prefix, otherwise return false
		 *  @name    property
		 *  @type    method
		 *  @access  public
		 *  @param   string  property
		 *  @param   DOMNode target [optional, default undefined - document.body]
		 *  @return  mixed  (one of: string (script)property, or false)
		 */
		style.property = hasProperty;

		/**
		 *  Calculate the specificity of a selector
		 *  @name    specificity
		 *  @type    method
		 *  @access  public
		 *  @param   string selector
		 *  @return  string specificity ('0.0.0.0')
		 */
		style.specificity = function(selector) {
			var result = [0, 0, 0, 0],
				match = konflux.string.trim(selector.replace(/([#\.\:\[]+)/g, ' $1')).split(/[^a-z0-9\.\[\]'":\*\.#=_-]+/),
				i;

			for (i = 0; i < match.length; ++i) {
				++result[/^#/.test(match[i]) ? 1 : (/^(?:\.|\[|:[^:])/.test(match[i]) ? 2 : 3)];
			}

			return result.join('.');
		};
	}

	konflux.register('style', new KonfluxStyle());

})(konflux);
