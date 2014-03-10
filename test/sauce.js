var statik      = require('node-static')
var Cloud       = require('mocha-cloud')
var SauceTunnel = require('sauce-tunnel')

var cloud = new Cloud('saddle', env('SAUCE_USERNAME'), env('SAUCE_ACCESS_KEY'))
cloud.concurrency(parseInt(process.env.SAUCE_CONCURRENCY) || 2)
cloud.build(process.env.TRAVIS_JOB_ID)

// see https://saucelabs.com/platforms
cloud.browser( 'internet explorer' , '11'   , 'Windows 8.1' )
cloud.browser( 'internet explorer' , '10'   , 'Windows 8'   )
cloud.browser( 'internet explorer' , '9'    , 'Windows 7'   )
cloud.browser( 'internet explorer' , '8'    , 'Windows XP'  )
cloud.browser( 'internet explorer' , '7'    , 'Windows XP'  )
cloud.browser( 'internet explorer' , '6'    , 'Windows XP'  )

cloud.browser( 'chrome'            , 'beta' , 'Windows 8.1' )
cloud.browser( 'chrome'            , '32'   , 'Windows 8.1' )
cloud.browser( 'chrome'            , '31'   , 'Windows 8.1' )

cloud.browser( 'firefox'           , '27'   , 'Linux'       )
cloud.browser( 'firefox'           , '26'   , 'Linux'       )

cloud.browser( 'android'           , '4.3'  , 'Linux'       )
cloud.browser( 'android'           , '4.2'  , 'Linux'       )
cloud.browser( 'android'           , '4.0'  , 'Linux'       )

cloud.browser( 'iphone'            , '6.1'  , 'OS X 10.8'   )
cloud.browser( 'ipad'              , '5.1'  , 'OS X 10.8'   )

cloud.browser( 'safari'            , '7'    , 'OS X 10.9'   )
cloud.browser( 'safari'            , '6'    , 'OS X 10.8'   )
cloud.browser( 'safari'            , '5'    , 'OS X 10.6'   )

// hanging for some reason
// cloud.browser( 'iphone'            , '7'    , 'OS X 10.8'   )
// cloud.browser( 'opera'             , '12'  , 'Windows XP'  )
// cloud.browser( 'opera'             , '12'  , 'Linux'       )

var port   = 8888
var server = serve('.') // relative to caller *not* this file
cloud.url('http://localhost:' + port + '/test/')

console.log('starting Sauce Connect...')
var tunnel = new SauceTunnel( env('SAUCE_USERNAME')
                            , env('SAUCE_ACCESS_KEY')
                            , 'tunnel'
                            , true
                            )
process.on('SIGINT', function () {
  console.error(' received SIGINT, exiting...')
  exit(2, tunnel)
})

tunnel.start(function (status) {
  if (status === false) throw new Error('Failed to start Sauce Connect.')
  console.log('Sauce Connect started.')

  cloud.completed = 0
  cloud.failed    = 0

  console.log('\nmocha-cloud')
  cloud.on('init', function (browser) {
    console.log('[INIT]    %s %s'
               , browser.browserName
               , browser.version
               )
    // console.log(' - %s %s', browser.browserName, browser.version)
  })

  cloud.on('start', function (browser) {
    console.log('[STARTED] %s %s'
               , browser.browserName
               , browser.version
               )
  })

  cloud.on('end', function (browser, res) {
    ++cloud.completed
    if (res.failures === 0) {
      console.log( '[PASSED]  %s %s'
                 , browser.browserName
                 , browser.version
                 )
      console.log( '%d of %d tests passed (%d pending)'
                 , res.passes
                 , res.tests
                 , res.pending
                 )
    } else {
      ++cloud.failed
      console.log( '[FAILED]  %s %s'
                 , browser.browserName
                 , browser.version
                 )
      console.log( '%d of %d tests failed (%d pending)'
                 , res.failures
                 , res.tests
                 , res.pending
                 )
      res.failed.forEach(function (failure) {
        console.warn('  %s', failure.fullTitle)
        if (failure.error.stack) {
          failure.error.stack.split('\n').forEach(function (l) {
            console.warn('    %s', line)
          })
        } else {
          console.warn('  %s', failure.error.message)
        }
      })
    }

    if (cloud.browsers.length === cloud.completed)
      exit(res.failures ? 1 : 0, tunnel)
  })

  server.listen(port, function () {
    cloud.start()
  })
})

function env(v) {
  var val = process.env[v]
  if (!val) throw new Error('$' + v + ' not set')
  return val
}

function serve(dir, opts) {
  var files = new(statik.Server)(dir, opts)
  return require('http').createServer(function (request, response) {
    request.addListener('end', function () {
      files.serve(request, response)
    }).resume()
  })
}

function exit(status, tunnel) {
  console.log('\nstopping Sauce Connect...')

  tunnel.stop(function (){
    console.log('Sauce Connect stopped')
    process.exit(status)
  })

  setTimeout(function () {
    console.log('Sauce Connect could not be stopped.')
    process.exit(status)
  }, 5000)
}

