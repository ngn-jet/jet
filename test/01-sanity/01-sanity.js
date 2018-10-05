var test = require('tape')

test('Sanity Check', function (t) {
  t.ok(typeof JET === 'object', 'The JET namespace is globally recognized.')
  t.ok(typeof JET.NET === 'object', 'The JET.NET namespace is globally recognized.')

  t.ok(typeof JET.load === 'function', 'JET.load is accessible.')

  t.end()
})
