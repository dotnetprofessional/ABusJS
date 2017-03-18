module.exports = function (w) {
    return {
        files: [
            'package.json',
            'app/**/*.ts',
            'Tests/**/*.+(ts|json|txt)',
            '!Tests/**/*.Spec.ts'
        ],
        tests: [
            'Tests/**/*.Spec.ts'
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