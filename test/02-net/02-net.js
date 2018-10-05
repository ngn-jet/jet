var test = require('tape')
var Queue = require('shortbus')
var testURL = './base/remote-data/git.svg'

test('Network Imports', function (t) {
  var tasks = new Queue()
  var remoteContent = null // eslint-disable-line no-unused-vars

  tasks.add('Import Remote Content', function (next) {
    JET.NET.import(testURL, function (content) {
      remoteContent = content

      t.ok(content !== null && content !== undefined && !(content instanceof Error), 'Content successfully retrieved via fetch.')
      t.ok(JET.NET.getCacheItem(testURL) === content, 'Imported content is cached.')

      JET.NET.clearCache()

      next()
    })
  })

  tasks.add('Import HTML into DOM Element', function (next) {
    document.body.insertAdjacentHTML('beforeend', '<div id="placeholder"></div>')

    JET.NET.importTo(testURL, document.getElementById('placeholder'), function (element) {
      t.ok(element.nodeName === '#comment', 'Imported remote content into a DOM element.')
      t.ok(document.querySelector('#placeholder > svg') !== null, 'The element is inserted into the DOM.')

      document.body.removeChild(document.getElementById('placeholder'))

      next()
    })
  })

  tasks.add('Import HTML after DOM Element', function (next) {
    document.body.insertAdjacentHTML('beforeend', '<div id="placeholder"></div>')

    JET.NET.importAfter(testURL, document.getElementById('placeholder'), function (element) {
      t.ok(document.querySelector('#placeholder + svg') !== null, 'The element is inserted afer the specified DOM element.')

      document.body.removeChild(document.getElementById('placeholder'))

      next()
    })
  })

  tasks.add('Import HTML before DOM Element', function (next) {
    document.body.insertAdjacentHTML('beforeend', '<div id="placeholder"></div>')

    JET.NET.importAfter(testURL, document.getElementById('placeholder'), function (element) {
      t.ok(document.querySelector('svg + #placeholder') !== null, 'The element is inserted before the specified DOM element.')

      document.body.removeChild(document.getElementById('placeholder'))

      next()
    })
  })

  tasks.add('PreDNS', function (next) {
    NGN.BUS.once('network.dns-prefetch', function () {
      t.ok(document.querySelector('[rel="dns-prefetch"]') !== null, 'Pre-DNS meta object added to DOM.')
      next()
    })

    JET.NET.predns('keycdn.com', true)
  })

  tasks.add('PreConnect', function (next) {
    NGN.BUS.once('network.preconnect', function () {
      t.ok(document.querySelector('[rel="preconnect"]') !== null, 'Pre-Connect meta object added to DOM.')
      next()
    })

    JET.NET.preconnect(testURL, true)
  })

  tasks.add('PreFetch', function (next) {
    NGN.BUS.once('network.prefetch', function () {
      t.ok(document.querySelector('[rel="prefetch"]') !== null, 'Pre-Fetch meta object added to DOM.')
      next()
    })

    JET.NET.prefetch(testURL, true)
  })

  tasks.add('Subresource', function (next) {
    NGN.BUS.once('network.subresource', function () {
      t.ok(document.querySelector('[rel="subresource"]') !== null, 'Subresource meta object added to DOM.')
      next()
    })

    JET.NET.subresource(testURL, true)
  })

  tasks.add('PreRender', function (next) {
    NGN.BUS.once('network.prerender', function () {
      t.ok(document.querySelector('[rel="prerender"]') !== null, 'Pre-Render meta object added to DOM.')
      next()
    })

    JET.NET.prerender(testURL, true)
  })

  tasks.on('complete', function () {
    t.end()
  })

  tasks.run(true)
})
