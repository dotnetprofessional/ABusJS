module.exports = function (w) {
    return {
        files: [
            'package.json',
            'src/**/*.ts',
            'features/**/*.+(ts|json|txt)',
            '!features/**/*.Spec.ts'
        ],
        tests: [
            'features/**/*.Spec.ts'
        ],
        env: {
            type: 'node',
            runner: 'node'
        },
        testFramework: 'mocha',
        setup: function (wallaby) {
            // wallaby.testFramework is jasmine/QUnit/mocha object
            wallaby.testFramework.ui('livedoc-mocha');
            // you can access 'window' object in a browser environment,
            // 'global' object or require(...) something in node environment
        },
        debug: false
    };
};