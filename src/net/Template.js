/**
 * @class JET.NET.Template
 * Represents a remote template retrieved from a remote source.
 * @fires {output:String} generated
 * Fired when the template has been processed (#output is available).
 */
export default class Template extends NGN.EventEmitter {
  constructor (cfg = {}) {
    super()

    Object.defineProperties(this, {
      METADATA: NGN.private({
        url: null,
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

    this.startCacheTTL()
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

  set data (data) {
    if (this.source === null) {
      NGN.WARN(`Cannot apply data to empty template found at ${this.METADATA.url}.`)
      return
    }

    // Reset template
    this.output = this.source

    // Apply data attributes to template
    Object.keys(data).forEach(attribute => {
      let token = new RegExp(`\{{2}${key}\}{2}`, 'gm')

      this.output = this.output.replace(token, data[attribute])
    })

    // Clear unused template code
    this.output = this.output.replace(/(\{\{.*\}\})/gm, '')

    this.emit('generated', this.output)
  }

  startCacheTTL () {
    clearTimeout(this.METADATA.cacheTimer)

    this.METADATA.cacheTimer = this.TTL < 0 ? null : setTimeout(() => this.clearCache(), this.METADATA.ttl)
  }

  clearCache () {
    this.source = ''
    this.output = ''

    clearTimeout(this.METADATA.cacheTimer)
    this.emit('cache.cleared')
  }
}
