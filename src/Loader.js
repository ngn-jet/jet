/**
 * @method JET.load
 * Load JavaScript files asynchronously/synchronously. Synchronous files are loaded
 * first in a sequential (one-after-another) manner. Then asynchronous files are
 * loaded in parallel at the same time. Once **all** files are loaded, the
 * callback is triggered (if supplied).
 *
 * A callback is not explicitly required since this method will also trigger
 * events on the NGN.BUS.
 *
 * ## Example Using Callback
 * ```js
 * JET.load({
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
 *   console.log(loadedFiles) // Outputs ['./path/to/file1.js', './path/to/file2.js', './path/to/file3.js', './path/to/file4.js', './path/to/file5.js', './path/to/file6.js']
 * })
 * ```
 * In this example, the series of actions is:
 * 1. GET ./path/to/file1.js, then:
 * 1. GET ./path/to/file2.js, then:
 * 1. GET ./path/to/file3.js, then:
 * 1. GET ./path/to/file4.js & GET ./path/to/file5.js & GET ./path/to/file6.js at the same time, then:
 * 1. Do Something
 *
 * ## Example Using Events
 * This does the same series of actions and provides the same functionality
 * as the callback example, except it uses the NGN.BUS to identify the end
 * of the load sequence.
 * ```js
 * JET.load({
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
 * })
 *
 * NGN.BUS.once('load.complete', function (loadedFiles) {
 *   // Do Something
 *   console.log(loadedFiles) // ['array', 'of', 'files']
 * })
 * ```
 * The advantage of using the NGN.BUS method is the listener can exist in
 * a different file from the loader.
 *
 * ## Alternative Syntax
 *
 * It is also possible to pass an array of remote files or any number of arguments.
 * These files are loaded asynchronously (all at the same time/in parallel).
 *
 * For example:
 * ```js
 * JET.load([
 *   './path/to/file4.js',
 *   './path/to/file5.js',
 *   './path/to/file6.js'
 * ], function (files) {
 *    console.log(files)
 * })
 * ```
 *
 * or
 *
 * ```js
 * NGN.BUS.once('load.complete', function (files) {
 *    console.log(files)
 * })
 *
 * JET.load('./path/to/file4.js', './path/to/file5.js', './path/to/file6.js')
 * ```
 *
 * ---
 * This loader guarantees that JavaScript is loaded before executing any
 * callback functions or triggering any events. This is accomplished by
 * injecting a private event (`NGN.BUS.emit(<generated>)`) into the code,
 * which is triggered once the JavaScript engine has processed the file.
 * @param {object} cfg
 * @param {function} callback
 * Called when the load process is complete.
 * @param {Array} callback.files
 * Contains all of the files that were loaded.
 * @fires {filename:String, content:String} load.sync
 * Triggered when a file is loaded synchronously. Event handlers will received
 * the name of the file and content as arguments.
 * @fires {filename:String, content:String} load.async
 * Triggered when a file is loaded asynchronously. Event handlers will received
 * the name of the file and content as arguments.
 * @fires {files:Array} load.complete
 * Triggered when **all** files have been loaded and the queue is completely drained.
 */
class JetLoader {
  constructor (cfg = {}, callback) {
    switch (NGN.typeof(cfg)) {
      case 'function':
        throw new Error('Cannot execute JET.load (no files to load).')

      case 'array':
        cfg = { async: cfg }
        break

      case 'string':
        let args = []

        NGN.slice(arguments).forEach((arg, i) => {
          if (typeof arg === 'string') {
            args.push(arg)
          } else if (!NGN.isFn(arg)) {
            NGN.WARN(`Unexpected argument passed to JET.load at index ${i}: "${arg}".`)
          }
        })

        cfg = { async: args }

        break

      case 'object':
        break

      default:
        throw new Error('Unrecognized or invalid JET.load configuration. (Failed to parse)')
    }

    Object.defineProperties(this, {
      /**
       * @cfg {Array|String} sync
       * The files that will be loaded one-by-one. They are loaded in the order
       * they are specified.
       */
      async: NGN.private(NGN.coalesce(cfg.async, [])),

      /**
       * @cfg {Array|String} async
       * The files that will be loaded asynchronously. They are all loaded at
       * the same time. Even though this is asynchronous, if a callback is
       * provided to the Loader, it will not be run until all of the files
       * are loaded. The point of this method is to reduce time-to-load (parallel
       * downloads).
       */
      sync: NGN.private(NGN.coalesce(cfg.sync, [])),

      PRIVATE: NGN.privateconst({
        createQueue: (source, eventName, callback) => {
          let queue = new NGN.Queue()
          let imported = []

          // Queue the remote files for download
          if (source.length > 0) {
            source.forEach((file, index) => queue.add(next => {
              // Prevent duplication
              if (source.indexOf(file) === index && file !== undefined) {
                // Warn of non-JS imports
                if (file.length <= 3 || file.substr(file.length - 3).toLowerCase() !== '.js') {
                  NGN.WARN(`Possible load issue: ${file} does not appear to be a standard JavaScript file (no .js extension found).`)
                }

                // Import the file
                JET.NET.import(file, content => {
                  imported.push({ file, content })

                  NGN.BUS.emit(eventName, file, content)

                  next()
                })
              }
            }))
          }

          queue.on('complete', () => {
            if (NGN.isFn(callback)) {
              callback(imported)
            }
          })

          return queue
        }
      })
    })

    console.log(this.async);
    console.log(this.sync);
  }

  run (callback) {
    // Run the loader
    this.loadSync(syncFiles => {
console.log('A');
      this.load(asyncFiles => {
console.log('B');
        let imported = syncFiles.concat(asyncFiles)
console.log('ASYNC', imported)
        NGN.BUS.emit('load.complete', imported)

        if (NGN.isFn(callback)) {
console.log('RETURN');
          callback(imported)
        }
      })
    })
  }

  /**
   * Load #async files in parallel (all at the same time).
   * @param  {Function} [callback]
   * Executed after the files are loaded.
   * @param {Array} callback.files
   * Contains an array of key/value objects:
   *
   * ```js
   * [{
   *   file: './path/to/file.js',
   *   content: '...'
   * }]
   * @private
   */
  load (callback) {
console.log('PRE LOAD');
    if (this.async.length > 0) {

      let queue = this.PRIVATE.createQueue(this.async, 'load.async', callback)
      queue.run()
    } else {
console.log('LOAD?');
      if (NGN.isFn(callback)) {
        callback([])
      }
    }
  }

  /**
   * Load #sync files sequentially (one after another).
   * @param  {Function} [callback]
   * Executed after the files are loaded.
   * @param {Array} callback.files
   * Contains an array of key/value objects:
   *
   * ```js
   * [{
   *   file: './path/to/file.js',
   *   content: '...'
   * }]
   * @private
   */
  loadSync (callback) {
    if (this.sync.length > 0) {
      let queue = this.PRIVATE.createQueue(this.sync, 'load.sync', callback)
      queue.run(true)
    } else {
      if (NGN.isFn(callback)) {
        callback([])
      }
    }
  }
}

export default function Loader () {
  console.log('PRE');
  const loader = new JetLoader(...arguments)
  loader.run(arguments[arguments.length - 1])
  console.log('POST');
}
