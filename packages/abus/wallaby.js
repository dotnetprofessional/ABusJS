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
        testFramework: 'jest',
        setup: function (wallaby) {
            wallaby.testFramework.configure(require('./package.json').jest);
        },
        debug: false
    };
};