;(function(konflux) {
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
		//@embed ajax/formdata

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
		 *  Request a resource using XHR
		 *  @name    request
		 *  @type    function
		 *  @access  internal
		 *  @param   object config
		 *  @return  object XMLHttpRequest
		 */
		function request(config) {
			var url     = 'url' in config ? config.url : (konflux.url ? konflux.url.path : null),
				type    = 'type' in config ? config.type.toUpperCase() : 'GET',
				data    = 'data' in config ? prepareData(config.data) : '',
				async   = 'async' in config ? config.async : true,
				headers = 'header' in config ? combine(config.header, getHeader(url)) : getHeader(url),
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
		 *  Prepare data to be send
		 *  @name    prepareData
		 *  @type    function
		 *  @access  internal
		 *  @param   mixed  data
		 *  @param   string name
		 *  @param   FormData (or KonfluxFormData) object
		 *  @return  FormData (or KonfluxFormData) object
		 */
		function prepareData(data, name, formData) {
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
					prepareData(data[p], (name || '') + '[' + p + ']', r);
				}
			}
			else if (konflux.isType('object', data)) {
				for (p in data) {
					prepareData(data[p], name ? name + '[' + encodeURIComponent(p) + ']' : encodeURIComponent(p), r);
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
