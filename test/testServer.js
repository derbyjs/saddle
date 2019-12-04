var browserify = require('browserify');
var express = require('express');

var expressApp = express();
expressApp.use(express.static(__dirname + '/public'));
expressApp.use(express.static(__dirname + '/../node_modules/mocha'));

expressApp.get('/test.js', function(req, res, next) {
  var bundle = browserify({debug: true});
  bundle.add(__dirname + '/test.mocha.js');
  bundle.bundle(function(err, code) {
    if (err) return next(err);
    res.type('js');
    res.send(code);
  });
});

var port = process.env.PORT || 5555;
var server = expressApp.listen(port, function(err) {
  console.log('%d listening. Go to: http://localhost:%d/', process.pid, port);
});
