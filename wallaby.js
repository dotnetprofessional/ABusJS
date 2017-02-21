module.exports = function (w) {

    return {
        files: [
            'app/**/*.ts'
        ],

        tests: [
            'Tests/**/*.ts'
        ],

        env: {
            type: 'node',
            runner: 'node'
        },

        // or any other supported testing framework:
        // https://wallabyjs.com/docs/integration/overview.html#supported-testing-frameworks
        testFramework: 'jest',

        debug: true
    };
};
