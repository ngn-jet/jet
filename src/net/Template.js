/**
 * @class JET.NET.Template
 * Represents a remote template retrieved from a remote source.
 * @fires {output:String} generated
 * Fired when the template has been processed (#output is available).
 */
export default class Template extends NGN.EventEmitter {
  /**
   * Create a template.
   * @param {Object|String} [cfg={}]
   * Provide confgiration attributes or a URL.
   */
  constructor (cfg = {}) {
    super()

    if (typeof cfg === 'string') {
      cfg = { url: JET.NET.Utility.normalizeUrl(cfg) }
    }

    Object.defineProperties(this, {
      METADATA: NGN.private({
        /**
         * @cgproperty {string} url
         * The URL of the remote template.
         */
        url: NGN.coalesce(cfg.url),
        source: null,
        output: null,
        cacheTimer: null,

        /**
         * @cfgproperty {number} [TTL=10000]
         * The cache TTL (time-to-live) is used for removing imported templates from memory.
         * In most use cases, templates are rendered no more than a few times within a few
         * seconds. In these cases, there is no need to maintain a copy of the template in
         * memory. The defaultCacheExpiration defaults to `10000` (10,000ms = 10 seconds)
         * before removing template content from memory. Any import operations after this
         * will create a new network request to retrieve a fresh copy of the template.
         *
         * Setting this to `0` (or less) will ignore caching completely. Setting this to `null` will
         * never remove anything from the cache. It is also possible to override this
         * setting for individual imports. See #import for details.
         */
        ttl: NGN.coalesce(cfg.TTL, cfg.ttl, 10000)
      })
    })

    this.on('cache.change.ttl', delta => this.startCacheTTL())
  }

  get URL () {
    return this.METADATA.url
  }

  set URL (value) {
    let URL = JET.NET.Utility.normalizeUrl(value)

    if (URL !== this.METADATA.url) {
      this.METADATA.url = URL
      this.clearCache()
    }
  }

  get url () {
    return this.METADATA.url
  }

  set url (value) {
    this.URL = value
  }

  get TTL () {
    return this.METADATA.ttl
  }

  set TTL (duration) {
    if (isNaN(duration)) {
      throw new Error('Values for defaultCacheExpiration must be a valid integer.')
    }

    let old = this._ttl
    this.METADATA.ttl = duration < 0 ? -1 : duration

    /**
     * @event {change:Object} cache.ttl.change
     * Fired when the TTL changes.
     */
    this.emit('cache.ttl.change', {
      old,
      new: this._ttl
    })

    this.startCacheTTL()
  }

  set source (value) {
    this.METADATA.source = value
    this.startCacheTTL()
  }

  get output () {
    return this.METADATA.output
  }

  set data (data) {
    if (this.source === null) {
      NGN.WARN(`Cannot apply data to empty template found at ${this.METADATA.url}.`)
      return
    }

    // Reset template
    this.METADATA.output = this.METADATA.source

    // Apply data attributes to template
    Object.keys(data).forEach(attribute => {
      let token = new RegExp(`\{{2}${attribute}\}{2}`, 'gm') // eslint-disable-line no-useless-escape

      this.METADATA.output = this.METADATA.output.replace(token, data[attribute])
    })

    // Clear unused template code
    this.METADATA.output = this.METADATA.output.replace(/(\{\{.*\}\})/gm, '')

    this.emit('generated', this.METADATA.output)
  }

  get cached () {
    return this.METADATA.source !== null
  }

  startCacheTTL () {
    clearTimeout(this.METADATA.cacheTimer)

    this.METADATA.cacheTimer = this.TTL < 0 ? null : setTimeout(() => this.clearCache(), this.METADATA.ttl)
  }

  clearCache () {
    this.METADATA.source = null
    this.METADATA.output = null

    clearTimeout(this.METADATA.cacheTimer)
    this.emit('cache.cleared')
  }

  /**
   * Retrieve the template from the remote source.
   * @param {Function} callback
   * The handler to respond with when the template content is available.
   * @param {string} callback.error
   * Returns an error if it occurs.
   * @param {string} callback.content
   * The content of the remote file.
   * @param {boolean} [force=false]
   * Force the request (ignore the cache).
   */
  pull (callback, force = false) {
    if (this.cached && !force) {
      return callback(null, this.METADATA.source)
    }

    if (this.METADATA.url === null) {
      let PullError = new Error(`No template URL specified.`)

      return callback(PullError)
    }

    JET.NET.GET(this.METADATA.url, res => {
      if (res.status !== 200) {
        let PullHttpError = new Error(`Could not retrieve remote template from "${this.METADATA.url}" (HTTP ${res.status}).`)

        return callback(PullHttpError)
      }

      this.METADATA.source = res.responseText
      this.startCacheTTL()

      callback(null, this.METADATA.source)
    })
  }

  /**
   * Generates the output of a remote template. This is
   * the same as pulling a remote template (#pull), then
   * supplying #data.
   * @param  {Object} data
   * The data object to apply to the template.
   * @param {Function} callback
   * The handler to respond with when the template content is available.
   * @param {string} callback.error
   * Returns an error if it occurs.
   * @param {string|array} callback.content
   * The content of the remote file.
   * @param {boolean} [force=false]
   * Force the request (ignore the cache).
   */
  generate (data, callback, force = false) {
    this.pull((err, content) => {
      if (err) {
        return callback(err)
      }

      this.source = content
      this.data = data

      callback(null, this.output)
    }, force)
  }
}
