module.exports = {
	root: true,
	extends: ["@infra/eslint-config-web"],
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ["./tsconfig.json"],
	},
}
