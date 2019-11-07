module.exports = {
	"parserOptions": {
		"ecmaVersion": 6,
		"sourceType": "module"
	},
	"parser": "babel-eslint",
	"plugins": ["google"],
	"extends": [
        "eslint:recommended",
        "plugin:google/recommended"
    ],
};