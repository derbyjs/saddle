var gulp  = require('gulp')

gulp.task('default', function () {
  gulp.start('watch')
})

gulp.task('watch', function () {
  gulp.start('test')
  gulp.watch(['**/*.js', 'test/**/*'], function () {
    gulp.start('test')
  })
})

gulp.task('test', function (done) {
  return require('child_process')
    .spawn('npm', ['test'], {stdio: [0, 1, 2]})
    .on('close', function (code, signal) {
      if (signal) console.warn('terminated `npm test` due to %s', signal)
      if (code) gulp.code = code
      done()
    })
})

process.on('exit', function () {
  process.exit(gulp.code)
})

