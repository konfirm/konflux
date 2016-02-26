;(function(konflux) {
	//@depend: event, observer, string, url
	'use strict';

	/**
	 *  Handle AJAX requests
	 *  @module  ajax
	 *  @note    available as konflux.ajax / kx.ajax
	 */
	function KonfluxAjax() {
		/*jshint validthis: true*/
		var ajax = this,
			stat = {},
			header = false;

		/*global KonfluxFormData*/
		//@include ajax/formdata

		/**
		 *  Obtain the default headers
		 *  @name    getHeader
		 *  @type    function
		 *  @access  internal
		 *  @param   string url
		 *  @return  object headers
		 */
		function getHeader(url) {
			if (!header) {
				header = {
					'X-Konflux': 'konflux/' + konflux.string.ascii(konflux.version())
				};
			}

			// Since browsers "preflight" requests for cross-site HTTP requests with
			// custom headers we should not try to send them, or request will fail
			// silently
			//
			// For more information, please refer to:
			// https://developer.mozilla.org/en-US/docs/Web/HTTP/Access_control_CORS#Preflighted_requests

			return konflux.url.isLocal(url) ? header : {};
		}

		/**
		 *  Obtain a new XHR object
		 *  @name    getXMLHTTPRequest
		 *  @type    function
		 *  @access  internal
		 *  @return  object XMLHttpRequest
		 */
		function getXMLHTTPRequest() {
			var xhr     = new XMLHttpRequest();
			xhr.__kxref = konflux.unique();

			return xhr;
		}

		/**
		 *  Determine if JSON is to be used as content-type,
		 *  explicitly using config.json = true-ish, or
		 *  implicitly using the content-type: application/json header
		 *  @name    isJSON
		 *  @type    function
		 *  @access  internal
		 *  @param   object  config
		 *  @param   object  headers
		 *  @return  bool    json
		 *  @note    This function will set the content-type header if json is
		 *           requested via the config option
		 */
		function isJSON(config, headers) {
			var name = 'content-type',
				value = 'application/json',
				json = config.json || false,
				match, type, p;

			for (p in headers) {
				if (p.toLowerCase() === name) {
					type = p;
					break;
				}
			}

			match = type && headers[type].toLowerCase().substr(0, value.length) === value;
			if (json && !match) {
				headers[type || name] = value;
			}
			else {
				json = match;
			}

			return json;
		}

		/**
		 *  Handle the XMLHTTPRequest 'load'-event
		 *  @name    xhrComplete
		 *  @access  internal
		 *  @param   XMLHTTPRequest  xhr
		 *  @param   object          config
		 *  @param   string          type
		 *  @return  function handler
		 */
		function xhrComplete(xhr, config, type) {
			return function() {
				var status = Math.floor(this.status * 0.01),
					state = false;
				++stat[type];

				if (status === 2 && 'success' in config) {
					state = 'success';
					config.success.apply(this, process(this));
				}
				else if (status >= 4 && 'error' in config) {
					state = 'error';
					config.error.apply(this, process(this));
				}

				if ('complete' in config) {
					state = !state ? 'complete' : state;
					config.complete.apply(this, [this.status, this.statusText, this]);
				}

				if (state) {
					konflux.observer.notify('konflux.ajax.' + type.toLowerCase() + '.' + state, xhr, config);
				}
			};
		}

		/**
		 *  Process an XHR response
		 *  @name    process
		 *  @type    function
		 *  @access  internal
		 *  @param   object XMLHttpRequest
		 *  @return  array  response ([status, response text, XMLHttpRequest])
		 */
		function process(xhr) {
			var contentType = xhr.getResponseHeader('content-type'),
				result = [
					xhr.status,
					xhr.responseText,
					xhr
				],
				match;

			if (contentType && (match = contentType.match(/([^;]+)/))) {
				contentType = match[1];
			}

			switch (contentType) {
				case 'application/json':
					result[1] = JSON.parse(result[1]);
					break;
			}

			return result;
		}

		/**
		 *  Prepare the data to be transfered
		 *  @name    prepareData
		 *  @type    function
		 *  @access  internal
		 *  @param   mixed  data
		 *  @param   bool   json
		 *  @return  mixed  data  [one of: string JSON encoded or (Konflux)FormData]
		 *  @note    if json is requested and `JSON.stringify` is not a function an Error is thrown
		 *           this allows for polyfills without bloating konflux too much
		 */
		function prepareData(data, json) {
			if (json && typeof JSON.stringify !== 'function') {
				throw new Error('konflux.ajax missing JSON.stringify');
			}

			return json ? JSON.stringify(data) : prepareFormData(data);
		}

		/**
		 *  Prepare form data to be trasfered
		 *  @name    prepareFormData
		 *  @type    function
		 *  @access  internal
		 *  @param   mixed  data
		 *  @param   string name
		 *  @param   FormData (or KonfluxFormData) object
		 *  @return  FormData (or KonfluxFormData) object
		 */
		function prepareFormData(data, name, formData) {
			var r = formData || (typeof FormData !== 'undefined' ? new FormData() : new KonfluxFormData()),
				p;

			if (typeof File !== 'undefined' && data instanceof File) {
				r.append(name, data, data.name);
			}
			else if (typeof Blob !== 'undefined' && data instanceof Blob) {
				r.append(name, data, 'blob');
			}
			else if (data instanceof Array || (FileList !== 'undefined' && data instanceof FileList)) {
				for (p = 0; p < data.length; ++p) {
					prepareFormData(data[p], (name || '') + '[' + p + ']', r);
				}
			}
			else if (konflux.isType('object', data)) {
				for (p in data) {
					prepareFormData(data[p], name ? name + '[' + encodeURIComponent(p) + ']' : encodeURIComponent(p), r);
				}
			}
			else {
				r.append(name, data);
			}

			return r;
		}

		/**
		 *  Obtain a handler function for given request, this handler is triggered by the konflux observer (konflux.ajax.<type>)
		 *  @name    requestType
		 *  @type    function
		 *  @access  internal
		 *  @param   string   type
		 *  @return  function handler
		 */
		function requestType(t) {
			var handler = function(config) {
					switch (konflux.type(config)) {
						case 'object':
							config.type = t;
							break;

						//  we assume an URL
						case 'string':
							config = {
								url: config,
								type: t
							};

							break;

						default:
							config = {
								type: t
							};

							break;
					}

					return request(config);
				};

			stat[t.toUpperCase()] = 0;
			konflux.observer.subscribe('konflux.ajax.' + t.toLowerCase(), function(ob, config) {
				handler(config);
			});

			return handler;
		}

		/**
		 *  Request a resource using XHR
		 *  @name    request
		 *  @type    function
		 *  @access  internal
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		function request(config) {
			var url     = 'url' in config ? config.url : (konflux.url ? konflux.url.path : null),
				headers = konflux.combine(config.header || {}, getHeader(url)),
				json    = isJSON(config, headers),
				type    = 'type' in config ? config.type.toUpperCase() : 'GET',
				data    = 'data' in config ? prepareData(config.data, json) : '',
				async   = 'async' in config ? config.async : true,
				xhr     = getXMLHTTPRequest(),
				p;

			if (!/^(POST|PUT)$/.test(type)) {
				url += 'data' in config && config.data !== '' ? '?' + (typeof config.data === 'string' ? config.data : data) : '';
				data = null;
			}

			xhr.onload = xhrComplete(xhr, config, type);

			if ('progress' in config && konflux.isType('function', config.progress)) {
				konflux.event.add(xhr.upload, 'progress', config.progress);
			}

			if ('error' in config && konflux.isType('function', config.error)) {
				konflux.event.add(xhr, 'error', config.error);
			}

			if ('abort' in config && konflux.isType('function', config.abort)) {
				konflux.event.add(xhr, 'abort', config.abort);
			}

			xhr.open(type, url, async);
			if (headers) {
				for (p in headers) {
					xhr.setRequestHeader(p, headers[p]);
				}
			}

			xhr.send(data);

			return xhr;
		}

		/**
		 *  Perform a request
		 *  @name    request
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.request = request;

		/**
		 *  Perform a GET request
		 *  @name    get
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.get = requestType('GET');

		/**
		 *  Perform a POST request
		 *  @name    post
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.post = requestType('POST');

		/**
		 *  Perform a PUT request
		 *  @name    put
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.put = requestType('PUT');

		/**
		 *  Perform a DELETE request
		 *  @name    del
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.del = requestType('DELETE');

		/**
		 *  Perform a PURGE request (mostly supported by caching servers such as Varnish)
		 *  @name    purge
		 *  @type    method
		 *  @access  public
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		ajax.purge = requestType('PURGE');
	}

	konflux.register('ajax', new KonfluxAjax());

})(konflux);
