// http://eslint.org/docs/user-guide/configuring
module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true,
        "node": true
    },
    "parserOptions": {
        "ecmaFeatures": {
            "jsx": false
        },
        "sourceType": "module"
    },
    // "eslint.run": "onSave",
    "extends": "eslint:recommended",
    "rules": {
        "no-unused-vars": 1,
        "indent": [
            "error",
            "tab",
            { "SwitchCase": 1 }
        ],
        "linebreak-style": [
            "warn",
            "unix"
        ],
        "quotes": [
            "error",
            "single"
        ],
        "semi": [
            "error",
            "always"
        ],
        "no-console": "off",
    }
};