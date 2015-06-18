module.exports = function (grunt) {
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		jshint: {
			all: ['Gruntfile.js', 'lib/**/*.js', 'test/**/*.js']
		},

		mochaTest: {
			test: {
				options: {
					reporter: 'spec',
					require: 'coverage/blanket'
				},
				src: ['test/**/*.js']
			},
			coverage: {
				options: {
					reporter: 'spec',
				},
				src: ['test/**/*.js']
			}
		},

		jsdoc: {
			dist: {
				src: ['lib/**/*.js', 'test/**/*.js'],
				options: {
					destination: 'doc'
				}
			}
		}
	});

	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-mocha-test');
	grunt.loadNpmTasks('grunt-jsdoc');

	// Default task(s).
	grunt.registerTask('default', ['jshint', 'mochaTest']);

};