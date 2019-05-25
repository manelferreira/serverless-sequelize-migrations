module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "mocha": true
    },
    "plugins": ["prettier"],
    "extends": ["airbnb", "prettier"],
    "globals": {
        "Atomics": "readonly",
        "SharedArrayBuffer": "readonly"
    },
    "parserOptions": {
        "ecmaVersion": 2018,
        "sourceType": "module"
    },
    "rules": {
        "prettier/prettier": ["error"]
    }
};