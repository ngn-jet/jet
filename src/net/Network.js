import Template from './Template'

/**
 * @namespace JET.NET
 * Extends the NGN.NET library with browser-specific
 * methods and attributes.
 * @extends NGN.NET
 */
export default class JetNetwork extends NGN.NET.Plugin {
  constructor () {
    super(...arguments)

    Object.defineProperties(this, {
      METADATA: NGN.private({
        importedFiles: new Set(),
        CACHE: new Map()
      }),

      Template: NGN.public(Template),

      /**
       * @method prelink
       * A helper method to construct pre-fetch style DOM elements.
       * This also fires an event when the element is added to the DOM.
       * @param {string} url
       * The URL of the operation.
       * @param {string} rel
       * The type of operation. For example: `preconnect`.
       * @param {boolean} [crossorigin]
       * Set to `true` to identify the request as a cross origin request.
       * By default, NGN will compare the URL to the current URL in an
       * attempt to determine if the request is across origins.
       * @private
       */
      prelink: NGN.privateconst(function (url, rel, cor = null) {
        if (!document.head) {
          NGN.WARN('Cannot use a preconnect, predns, etc because there is no HEAD in the HTML document.')
          return
        }

        let prelink = document.createElement('link')
        prelink.rel = rel
        prelink.href = url.trim().toLowerCase().substr(0, 4) !== 'http' ? NGN.NET.normalizeUrl(window.location.origin + window.location.pathname + url) : url

        if (NGN.coalesce(cor, NGN.NET.Utility.isCrossOrigin(url))) {
          prelink.setAttribute('crossorigin', 'true')
        }

        document.head.appendChild(prelink)

        NGN.BUS.emit(`network.${rel}`)
      }),

      /**
       * @method getFileExtension
       * Returns the extension of the file specified within a URI.
       * @param {string} uri
       * The URI of the resource.
       * @returns {string}
       * The extension.
       * @private
       */
      getFileExtension: NGN.private((uri) => {
        try {
          return uri.split('/').pop().split('?')[0].split('.').pop().toLowerCase()
        } catch (e) {
          return null
        }
      })
    })

    // NGN.createAlias(this, 'JSONP', this.jsonp)
  }

  /**
   * @method jsonp
   * Execute a request via JSONP.
   * @param {string} url
   * The URL of the JSONP endpoint.
   * @param {function} callback
   * Handles the response.
   * @param {Error} [callback.error=null]
   * If an error occurred, this will be populated. If no error occurred, this will
   * be null.
   * @param {object|array} callback.response
   * The response.
   */
  jsonp (url, callback) {
    const fn = 'jsonp_callback_' + Math.round(100000 * Math.random())

    window[fn] = (data) => {
      delete window[fn]
      document.body.removeChild(script)
      return callback(null, data)
    }

    let script = document.createElement('script')
    script.src = url + (url.indexOf('?') >= 0 ? '&' : '?') + 'callback=' + fn

    script.addEventListener('error', (e) => {
      delete window[fn]
      return callback(new Error('The JSONP request was blocked. This may be the result of an invalid URL, cross origin restrictions, or the remote server may not be online.'))
    })

    document.body.appendChild(script)
  }

  /**
   * @method cacheContent
   * Cache (in-memory) content by URL.
   * @param {string} url
   * The URL/URI of the remote content.
   * @param {string} content
   * The content retrieved from the URL.
   * @param {number} [cacheTTL]
   * The time-to-live, or the amount of time (milliseconds) before
   * this content is purged from the cache. If this is unspecified,
   * the #TTL value will be used.
   */
  cacheContent (url, content, cacheTTL = null) {
    this.METADATA.CACHE.set(NGN.NET.normalizeUrl(url), content)

    cacheTTL = NGN.coalesce(cacheTTL, -1)

    if (cacheTTL >= 0) {
      setTimeout(() => this.METADATA.CACHE.delete(url), cacheTTL)
    }
  }

  /**
   * @method getCacheItem
   * Retrieve the cached content for a specific URL.
   * @param {string} URL
   * The URL of the remote content that is cached.
   * @return {string}
   * Returns the cached content or `null` if there is no cache content for the URL.
   */
  getCacheItem (url) {
    return this.METADATA.CACHE.get(this.normalizeUrl(url))
  }

  /**
   * Clears/resets the cache.
   */
  clearCache () {
    this.METADATA.CACHE = new Map()
  }

  /**
   * @method import
   * Import a remote HTML fragment.
   * @param {string|array} url
   * The URL of remote HTML snippet. If the URL has a `.js` or `.css`
   * extension, it will automatically be added to the `<head>`.
   * It is also possible to provide an array of string values. Take
   * note that the callback may return a different value based on
   * this input.
   * @param {string|array} callback
   * If a **string** is provided as the URL, this returns the HTMLElement,
   * which can be directly inserted into the DOM. If an **array** is
   * provided as the URL, the callback will return an array of HTMLElements.
   * For example:
   *
   * ```js
   * JET.NET.import([
   *   '/path/a.html',
   *   '/path/b.html',
   *   '/path/a.js'
   *   ], function (elements){
   *     console.dir(elements)
   *   }
   * })
   *```
   * The result `elements` array would look like:
   *
   * ```js
   * [
   *   HTMLElement, // DOM element created for a.html
   *   HTMLElement, // DOM element created for b.html
   *   HTMLElement  // DOM element created for a.js (this will be in the <head>)
   * ]
   * ```
   * The last array element is `null`
   * @param {boolean} [bypassCache=false]
   * When set to `true`, bypass the cache.
   * @param {number} [cacheTTL]
   * Remove the imported content from memory after the cacheTTL (time to live)
   * expires. Set the value to `-1` to never expire, `0` to expire immediately,
   * or any integer greater than `0` to expire at a later point (measured in
   * milliseconds). If this is not specified, the #defaultCacheExpiration value
   * will be used (default `10000`: 10 seconds).
   *
   * This property does not affect JavaScript, CSS, or anything applied to the
   * DOM. This only removes cached content to free up memory. If the cache is
   * cleared and another import is executed, it will make a new HTTP/S request
   * to retrieve a fresh copy of the content from the remote server.
   * @fires html.import
   * Returns the HTMLElement/NodeList as an argument to the event handler.
   */
  'import' (url, callback, bypassCache = false, cacheTTL = null) {
    // Support multiple simultaneous imports
    if (NGN.typeof(url) === 'array') {
      let out = new Array(url.length)
      let importQueue = new NGN.Queue()

      url.forEach((uri, num) => {
        importQueue.addTask(next => {
          this['import'](uri, function (el) {
            out[num] = el
            next()
          }, bypassCache, cacheTTL)
        })
      })

      if (callback) {
        importQueue.on('complete', () => callback(out))
        importQueue.run(true)
      }

      return
    }

    // Handle individual requests
    // If a local reference is provided, complete the path.
    if (url.substr(0, 4) !== 'http') {
      let path = window.location.href.split('/')
      path.pop()
      url = path.join('/') + '/' + url
    }

    url = NGN.NET.normalizeUrl(url)
console.log(url);
    if (this.METADATA.importedFiles.has(url)) {
      let content = document.querySelector(`[jet-import-id="${url}"]`)

      return callback(content === null ? null : content.innerText)
    }

    if (typeof bypassCache === 'number' && cacheTTL === null) {
      cacheTTL = bypassCache
      bypassCache = false
    } else {
      bypassCache = typeof bypassCache === 'boolean' ? bypassCache : false
    }

    if (!bypassCache && this.METADATA.CACHE.has(url)) {
      if (NGN.isFn(callback)) {
        callback(this.METADATA.CACHE.get(url))
      }

      NGN.BUS.emit('html.import', this.METADATA.CACHE.get(url))

      return
    }

    // Support JS/CSS
    let ext = this.getFileExtension(url).toLowerCase()

    if (['js', 'css'].indexOf((ext || '').trim()) >= 0) {
      let script

      switch (ext) {
        case 'js':
          // This adds a line of code NGN.BUS event
          this.GET(url, res => {
            if (res.status !== 200) {
              throw new Error(`Could not find importable content at ${url}. (Received HTTP Status Code ${res.status}.)`)
            }

            let fileBody = res.responseText
            let EventID = `javascript::${NGN.DATA.UTILITY.UUID()}`

            fileBody += `;NGN.BUS.emit('${EventID}')`

            NGN.BUS.once(EventID, () => callback(script))

            script = document.createElement('script')
            script.setAttribute('type', 'text/javascript')
            script.text = fileBody

            this.METADATA.importedFiles.add(url)

            // Identify the imported script in the HTML
            script.setAttribute('jet-import-id', url)

            NGN.coalesce(document.head, document.body).appendChild(script)

            callback(fileBody)
          })

          return

        case 'css':
          script = document.createElement('link')

          script.setAttribute('rel', 'stylesheet')
          script.setAttribute('type', 'text/css')
          script.setAttribute('href', url)

          if (NGN.isFn(callback)) {
            script.onload = function () {
              callback(script)
            }
          }

          break
      }

      this.METADATA.importedFiles.add(url)

      // Identify the imported script in the HTML
      script.setAttribute('jet-import-id', url)

      NGN.coalesce(document.head, document.body).appendChild(script)

      return
    }

    // Retrieve the file content
    this.GET(url, res => {
      if (res.status !== 200) {
        throw new Error(`Could not find importable content at ${url}. (Received HTTP Status Code ${res.status}.)`)
      }

      let doc = res.responseText
      this.cacheContent(url, doc, NGN.coalesce(cacheTTL, this.TTL))

      if (doc.length === 0) {
        NGN.WARN(`${url} import has no content.`)
      }

      if (NGN.isFn(callback)) {
        callback(doc)
      }

      if (NGN.BUS) {
        NGN.BUS.emit('html.import', doc)
      }
    })
  }

  /**
   * @method fetchImport
   * A generic method to fetch code, insert to the DOM,
   * and execute a callback once the operation is complete.
   * @param {string} url
   * The URL of remote HTML snippet.
   * @param {HTMLElement} target
   * The DOM element where the resulting code should be appended.
   * @param {function} callback
   * Returns the HTMLElement, which can be directly inserted into the DOM.
   * @param {HTMLElement} callback.element
   * The new DOM element/NodeList.
   * @private
   */
  fetchRemoteFile (url, target, position, callback) {
    this.import(url, function (content) {
      const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'childList') {
            clearTimeout(timeout)
            observer.disconnect()

            if (NGN.isFn(callback)) {
              callback(mutation.addedNodes[0])
            }
          }
        })
      })

      observer.observe(target, {
        attributes: false,
        childList: true,
        characterData: false,
        subtree: false
      })

      let timeout = setTimeout(() => {
        if (NGN.isFn(callback)) {
          callback(content)
        }
      }, 750)

      target.insertAdjacentHTML(position, content)
    })
  }

  /**
   * @method importTo
   * This helper method uses the #import method to retrieve an HTML
   * fragment and insert it into the specified DOM element. This is
   * the equivalent of using results of the #import to retrieve a
   * snippet, then doing a `target.appendChild(importedElement)`.
   * @param {string} url
   * The URL of remote HTML snippet.
   * @param {HTMLElement} target
   * The DOM element where the resulting code should be appended.
   * @param {function} callback
   * Returns the HTMLElement, which can be directly inserted into the DOM.
   * @param {HTMLElement} callback.element
   * The new DOM element/NodeList.
   */
  importTo (url, target, callback) {
    this.fetchRemoteFile(url, target, 'beforeend', callback)
  }

  /**
   * @method importAfter
   * This helper method uses the #import method to retrieve an HTML
   * fragment and insert it into the DOM after the target element. This is
   * the equivalent of using results of the #import to retrieve a snippet,
   * then doing a `target.insertAdjacentHTML('afterend', importedElement)`.
   * @param {string} url
   * The URL of remote HTML snippet.
   * @param {HTMLElement} target
   * The DOM element where the resulting code should be appended.
   * @param {string} callback
   * Returns the HTMLElement/NodeList, which can be directly inserted into the DOM.
   * @param {HTMLElement} callback.element
   * The new DOM element/NodeList.
   */
  importAfter (url, target, callback) {
    this.fetchRemoteFile(url, target, 'afterend', callback)
  }

  /**
   * @method importBefore
   * This helper method uses the #import method to retrieve an HTML
   * fragment and insert it into the DOM before the target element. This is
   * the equivalent of using results of the #import to retrieve a snippet,
   * then doing a `target.parentNode.insertBefore(importedElement, target)`.
   * @param {string} url
   * The URL of remote HTML snippet.
   * @param {HTMLElement} target
   * The DOM element where the resulting code should be appended.
   * @param {string} callback
   * Returns the HTMLElement/NodeList, which can be directly inserted into the DOM.
   * @param {HTMLElement} callback.element
   * The new DOM element/NodeList.
   */
  importBefore (url, target, callback) {
    this.fetchRemoteFile(url, target, 'beforebegin', callback)
  }

  /**
   * @method template
   * Include a simple variable replacement template and apply
   * values to it. This is always cached client side.
   * @param {string} url
   * URL of the template to retrieve.
   * @param {object} [variables]
   * A key/value objct containing variables to replace in
   * the template.
   * @param {function} callback
   * The callback receives a single argument with the HTMLElement/
   * NodeList generated by the template.
   */
  template (url, data = null, callback) {
    let tpl = NGN.coalesce(this.METADATA.CACHE.get(`JETNGNTPL::${url}`), new Template(url))

    if (NGN.isFn(data)) {
      callback = data
      data = {}
    }

    tpl.generate(data, callback)
  }

  /**
   * @method predns
   * This notifies the browser domains which will be accessed at a later
   * time. This helps the browser resolve DNS inquiries quickly.
   * @param {string} domain
   * The domain to resolve.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.dns-prefetch
   * Fired when a pre-fetched DNS request is issued to the browser.
   */
  predns (domain, cor) {
    this.prelink(window.location.protocol + '//' + domain, 'dns-prefetch', cor)
  }

  /**
   * @method preconnect
   * Tell the browser which remote resources will or may be used in the
   * future by issuing a `Preconnect`. This will resolve DNS (#predns), make the TCP
   * handshake, and negotiate TLS (if necessary). This can be done directly
   * in HTML without JS, but this method allows you to easily preconnect
   * a resource in response to a user interaction or NGN.BUS activity.
   * @param {string} url
   * The URL to preconnect to.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.preconnect
   * Fired when a preconnect is issued to the browser.
   */
  preconnect (url, cor) {
    this.prelink(url, 'preconnect', cor)
  }

  /**
   * @method prefetch
   * Fetch a specific resource and cache it.
   * @param {string} url
   * URL of the resource to download and cache.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.prefetch
   * Fired when a prefetch is issued to the browser.
   */
  prefetch (url, cor) {
    this.prelink(url, 'prefetch', cor)
  }

  /**
   * @method subresource
   * A prioritized version of #prefetch. This should be used
   * if the asset is required for the current page. Think of this
   * as "needed ASAP". Otherwise, use #prefetch.
   * @param {string} url
   * URL of the resource to download and cache.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.prefetch
   * Fired when a prefetch is issued to the browser.
   */
  subresource (url, cor) {
    this.prelink(url, 'subresource', cor)
  }

  /**
   * @method prerender
   * Prerender an entire page. This behaves as though a page is
   * opened in a hidden tab, then displayed when called. This is
   * powerful, but should only be used when there is absolute
   * certainty that the prerendered page will be needed. Otherwise
   * all of the assets are loaded for no reason (i.e. uselessly
   * consuming bandwidth).
   * @param {string} url
   * URL of the page to download and cache.
   * @param {boolean} [crossorigin]
   * Set to `true` to identify the request as a cross origin request.
   * By default, NGN will compare the URL to the current URL in an
   * attempt to determine if the request is across origins.
   * @fires network.prerender
   * Fired when a prerender is issued to the browser.
   */
  prerender (url, cor) {
    this.prelink(url, 'prerender', cor)
  }
}
