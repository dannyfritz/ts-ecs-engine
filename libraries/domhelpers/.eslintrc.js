require('@rushstack/eslint-config/patch/modern-module-resolution');

module.exports = {
  extends: [
	"@rushstack/eslint-config/profile/web-app",
	"@rushstack/eslint-config/mixins/packlets",
	"@rushstack/eslint-config/mixins/tsdoc",
	"@rushstack/eslint-config/mixins/friendly-locals",
  ],
  parserOptions: { tsconfigRootDir: __dirname }
};
