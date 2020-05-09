// eslint 检查配置
module.exports = {
    "env": {
        "browser": true,
        "commonjs": true,
        "es6": true
    },
    "extends": ["eslint:recommended"],
    "globals": {
        "wx": "readonly"
    },
    "parser": "babel-eslint",
    "rules": {
        "no-console": ["error", { "allow": ["warn", "error"] }]
    }
};