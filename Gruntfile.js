module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    devserver: {
      options: {
        base: 'www',
        type: 'http',
        port: grunt.option('port') || 4000,
      },
      server: {}
    },
    'gh-pages': {
      options: {
        base: 'www',
        message: 'Auto-generated commit'
      },
      src: ['**']
    }
  });
  grunt.loadNpmTasks('grunt-devserver');
  grunt.loadNpmTasks('grunt-gh-pages');
  grunt.registerTask('start', ['devserver']);
};
