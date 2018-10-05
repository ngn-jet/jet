var test = require('tape')

test('Sanity Checks', function (t) {
  t.ok(
    typeof JET.NET.GET === 'function' &&
    typeof JET.NET.POST === 'function' &&
    typeof JET.NET.PUT === 'function' &&
    typeof JET.NET.DELETE === 'function' &&
    typeof JET.NET.JSON === 'function', 'Properly inherits base methods from JET.NET')

  t.ok(typeof JET.NET.jsonp === 'function', 'Identfies JET extension functions.')
  t.ok(typeof JET.NET.Template === 'function', 'Remote templates class recognized.')

  t.ok(typeof JET.NET.prelink === 'function', 'JET.NET.prelink is a valid method.')
  t.ok(typeof JET.NET.import === 'function', 'JET.NET.import is a valid method.')
  t.ok(typeof JET.NET.importTo === 'function', 'JET.NET.importTo is a valid method.')
  t.ok(typeof JET.NET.importBefore === 'function', 'JET.NET.importBefore is a valid method.')
  t.ok(typeof JET.NET.importAfter === 'function', 'JET.NET.importAfter is a valid method.')
  t.ok(typeof JET.NET.fetchRemoteFile === 'function', 'JET.NET.fetchRemoteFile is a valid method.')
  t.ok(typeof JET.NET.template === 'function', 'JET.NET.template is a valid method.')
  t.ok(typeof JET.NET.getFileExtension === 'function', 'JET.NET.getFileExtension is a valid method.')
  t.ok(typeof JET.NET.predns === 'function', 'JET.NET.predns is a valid method.')
  t.ok(typeof JET.NET.preconnect === 'function', 'JET.NET.preconnect is a valid method.')
  t.ok(typeof JET.NET.prefetch === 'function', 'JET.NET.prefetch is a valid method.')
  t.ok(typeof JET.NET.prerender === 'function', 'JET.NET.prerender is a valid method.')
  t.ok(typeof JET.NET.subresource === 'function', 'JET.NET.subresource is a valid method.')

  t.end()
})
