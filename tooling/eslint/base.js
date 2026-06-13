/** @type {import('eslint').Linter.Config} */
module.exports = {
  env: { es2022: true, node: true },
  parser: "@typescript-eslint/parser",
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  plugins: ["@typescript-eslint"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"],
  rules: {
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    "@typescript-eslint/no-explicit-any": "off",
  },
  overrides: [
    {
      files: ["apps/coreknot/**/*.{js,jsx}"],
      env: { browser: true },
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
  ],
};
