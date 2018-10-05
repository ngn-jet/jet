var test = require('tape')

test('JET.load Synchronous Only', function (t) {
  var imports = [
    './base/remote-data/js/load-a.js',
    './base/remote-data/js/load-b.js',
    './base/remote-data/js/load-c.js',
    './base/remote-data/js/load-d.js',
    './base/remote-data/js/load-e.js'
  ]

  NGN.BUS.threshold('load.sync', 5, () => {
    t.pass('load.sync called for each file.')
  })

  NGN.BUS.on('load.complete', () => {
    t.pass('Events triggered for each synchronous load.')
    t.end()
  })

  JET.load({
    sync: imports
  }, function (files) {
    t.pass('Callback executed.')
    t.ok(files.length === 5, 'Correct number of files loaded.')
  })
})
