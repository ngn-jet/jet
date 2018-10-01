/**
 * @class JET.Loader
 * Load files a/synchronously and fire an event/callback when everything
 * is ready. Synchronous files are loaded first in a one-by-one manner.
 * Then asynchronous files are loaded in parallel at the same time. Once
 * **all** files are loaded, the callback or event is triggered.
 *
 * **Example Using Callback**
 * ```js
 * JET.Loader({
 *   sync: [
 *     './path/to/file1.js',
 *     './path/to/file2.js',
 *     './path/to/file3.js',
 *   ],
 *   async: [
 *     './path/to/file4.js',
 *     './path/to/file5.js',
 *     './path/to/file6.js',
 *   ],
 * }, function (loadedFiles) {
 *   // Do Something
 *   console.log(loadedFiles) // ['array', 'of', 'files']
 * })
 * ```
 * In this example, the series of actions is as follows:
 * 1. GET ./path/to/file1.js, then:
 * 1. GET ./path/to/file2.js, then:
 * 1. GET ./path/to/file3.js, then:
 * 1. GET ./path/to/file4.js & GET ./path/to/file5.js & GET ./path/to/file6.js, then:
 * 1. Do Something
 *
 * **Example Using Callback**
 * This does the same series of actions and provides the same functionality
 * as the callback example, except it uses the NGN.BUS to identify the end
 * of the load sequence.
 * ```js
 * NGNX.Loader({
 *   sync: [
 *     './path/to/file1.js',
 *     './path/to/file2.js',
 *     './path/to/file3.js',
 *   ],
 *   async: [
 *     './path/to/file4.js',
 *     './path/to/file5.js',
 *     './path/to/file6.js',
 *   ],
 * }, 'myfiles.loaded')
 *
 * NGN.BUS.once('myfiles.loaded', function (loadedFiles) {
 *   // Do Something
 *   console.log(loadedFiles) // ['array', 'of', 'files']
 * })
 * ```
 * The advantage of using the NGN.BUS method is the listener can exist in
 * a different file from the loader.
 * @param {object} cfg
 * @param {Function|string} callbackOrEvent
 * If a function is passed in, it will be run once all files are loaded. If
 * a event name is passed in, it will be triggered on the NGN.BUS once all
 * files are loaded. The callback receives a single array argument containing
 * all of the files loaded. This same argument is sent as a payload to the
 * event bus.
 * @fires load.sync
 * Triggered when a file is loaded synchronously. Event handlers will received
 * the name of the file as an argument.
 */
exporrt default class Loader extends NGN.EventEmitter {
  constructor (cfg = {}, callback) {
    super()

    Object.defineProperties(this, {
      /**
       * @cfg {Array|String} sync
       * The files that will be loaded one-by-one. They are loaded in the order
       * they are specified.
       */
      async: NGN.forceArray(NGN.public(cfg.async || [])),

      /**
       * @cfg {Array|String} async
       * The files that will be loaded asynchronously. They are all loaded at
       * the same time. Even though this is asynchronous, if a callback is
       * provided to the Loader, it will not be run until all of the files
       * are loaded. The point of this method is to reduce time-to-load (parallel
       * downloads).
       */
      sync: NGN.forceArray(NGN.public(cfg.sync || []))
    })
  }

  loadSync () {
    
  }
}
