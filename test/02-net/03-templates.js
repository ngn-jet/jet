var test = require('tape')
var TestURL = './remote-data/template.html'

test('Template Building: Variable Replacement', function (t) {
  var TestHTML = '<div id="test">{{data}}</div>'
  var Tpl = new JET.NET.Template(TestURL)

  t.ok(Tpl.URL === JET.NET.Utility.normalizeUrl(TestURL), 'URL attribute recognized.')

  Tpl.source = TestHTML
  t.ok(Tpl.METADATA.source === TestHTML, 'Forcibly set source.')
  t.ok(Tpl.cached, 'Content is cached.')

  Tpl.data = {
    data: 'it worked'
  }

  t.ok(Tpl.output === '<div id="test">it worked</div>', 'Replaced data with proper values.')

  Tpl.data = {
    other: 'none'
  }
  t.ok(Tpl.output === '<div id="test"></div>', 'Ignored unused variables.')

  Tpl.clearCache()
  t.ok(!Tpl.cached && Tpl.METADATA.source === null, 'Clearing the cache removes unnecessary content.')

  Tpl.TTL = 300
  Tpl.source = TestHTML

  Tpl.once('cache.cleared', () => {
    t.pass('TTL autoexpires according to configured time.')
    t.end()
  })
})

test('Pull Remote Template', function (t) {
  var Tpl = new JET.NET.Template('/base/' + TestURL)

  Tpl.generate({
    data: 'it worked'
  }, function (err, content) {
    if (err) {
      t.fail(`Remote request failed with error: ${err.message}`)
    } else {
      t.ok(content.indexOf('<b id="placeholder">it worked</b>') >= 0, 'Fully generated content is returned.')
    }

    t.end()
  })
})
