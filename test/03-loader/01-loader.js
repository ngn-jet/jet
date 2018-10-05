var test = require('tape')

test('JET.load Synchronous Only', function (t) {
  var imports = [
    './base/remote-data/js/load-a.js',
    './base/remote-data/js/load-b.js',
    './base/remote-data/js/load-c.js',
    './base/remote-data/js/load-d.js',
    './base/remote-data/js/load-e.js'
  ]

  NGN.BUS.threshold('load.complete', 5, function () {
    t.pass('Events triggered for each synchronous load.')
    t.end()
  })

  JET.load({
    sync: imports
  }, function (files) {
    t.pass('Callback executed.')

    for (var i = 0; i < imports.length; i++) {
      t.ok(files[i].file.indexOf(imports[i]) > 0 && files[0].content !== null, 'Recognized ' + imports[i])
    }
  })
})
