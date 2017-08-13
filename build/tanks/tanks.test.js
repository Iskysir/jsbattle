module.exports = function (gulp, config, plugins) {
    return function () {
      return gulp.src(config.tanks.test, { read: false })
        .pipe(plugins.mocha({
          reporter: 'spec',
          globals: {
            should: require('should')
          }
        }));
    };
};