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
    }
  });
  grunt.loadNpmTasks('grunt-devserver');
  grunt.registerTask('start', ['devserver']);
};
