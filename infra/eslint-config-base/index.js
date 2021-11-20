module.exports = {
	parser: "@typescript-eslint/parser",
	plugins: ["@typescript-eslint", "jest"],
	extends: [
		"eslint:recommended",
		"plugin:@typescript-eslint/recommended",
		"plugin:@typescript-eslint/recommended-requiring-type-checking",
		"plugin:eslint-comments/recommended",
		"plugin:import/recommended",
		"plugin:import/typescript",
		"plugin:jest/recommended",
		"plugin:jest/style",
		"prettier",
	],
	rules: {
		"eslint-comments/require-description": "error",
		"import/no-unresolved": "error",
	},
	ignorePatterns: ["node_modules", "dist", ".eslintrc.js"],
	overrides: [
		{
			files: ["**.ts", "**.tsx"],
		},
	],
	settings: {
		"import/parsers": {
			"@typescript-eslint/parser": [".ts", ".tsx"],
		},
		"import/resolver": {
			typescript: {
				alwaysTryTypes: true,
			},
		},
	},
};
