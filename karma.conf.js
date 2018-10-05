var getFiles = function () {
  var testFiles = '*-**/*-*.js'

  if (process.argv.indexOf('--test') >= 0) {
    switch (process.argv[process.argv.indexOf('--test') + 1]) {
      case 'none':
        testFiles = ''
        break
    }
  }

  return [
    'lib/ngn.js',
    'lib/jet.js',
    testFiles,
    { pattern: 'remote-data/template.html', included: true },
    { pattern: 'remote-data/git.svg', included: true },
    { pattern: 'remote-data/js/load-a.js', included: true },
    { pattern: 'remote-data/js/load-b.js', included: true },
    { pattern: 'remote-data/js/load-c.js', included: true },
    { pattern: 'remote-data/js/load-d.js', included: true },
    { pattern: 'remote-data/js/load-e.js', included: true }
  ]
}

module.exports = config => {
  config.set({
    basePath: './test/',

    plugins: [
      require('karma-browserify'),
      require('tape'),
      require('karma-tap'),
      require('karma-tap-pretty-reporter'),
      // require('karma-spec-reporter'),
      require('karma-chrome-launcher'),
      require('karma-source-map-support'),
      // require('karma-firefox-launcher'),
      // require('karma-safari-launcher'),
      // require('karma-ie-launcher'),
      // require('karma-ie-launcher'),
      // require('karma-edge-launcher'),
      // require('karma-phantomjs-launcher'),
      // require('karma-sauce-launcher'),
      require('karma-html2js-preprocessor')
    ],

    // frameworks to use
    // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
    frameworks: ['browserify', 'source-map-support', 'tap'],

    preprocessors: {
      '**/*-*.js': ['browserify'],
      '**/*.js.map': ['browserify'],
      // 'test.html': ['html2js']
      // 'template.html': ['html2js']
    },

    reporters: ['tap-pretty'],

    // web server port
    port: 9876,

    // enable / disable colors in the output (reporters and logs)
    colors: true,

    // level of logging
    // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
    // logLevel: config.LOG_ERROR,
    logLevel: config.LOG_DEBUG,

    // enable / disable watching file and executing tests whenever any file changes
    autoWatch: false,

    // start these browsers
    // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
    browsers: ['Chrome'],

    // Continuous Integration mode
    // if true, Karma captures browsers, runs the tests and exits
    singleRun: true,

    // Concurrency level
    // how many browser should be started simultanous
    concurrency: 3,

    tapReporter: {
      // outputFile: './unit.tap',
      prettify: require('tap-spec'),
      separator: '----------------------------------------'
    },

    // browserConsoleLogOptions: {
    //   level: 'error',
    //   format: '%b %T: %m',
    //   terminal: false
    // },

    browserify: {
      debug: true
    },

    files: getFiles()
  })
}
