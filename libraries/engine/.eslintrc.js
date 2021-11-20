module.exports = {
	root: true,
	extends: ["@infra/eslint-config-node"],
	parserOptions: {
		tsconfigRootDir: __dirname,
		project: ["./tsconfig.json"],
	},
}
