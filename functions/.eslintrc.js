module.exports = {
  root: true,
  env: {
    es6: true,
    node: true,
  },
  extends: [
    "eslint:recommended",
    "plugin:import/errors",
    "plugin:import/warnings",
    "plugin:import/typescript",
    "google",
    "plugin:@typescript-eslint/recommended",
  ],
  parser: "@typescript-eslint/parser",
  parserOptions: {
    project: ["tsconfig.json", "tsconfig.dev.json"],
    sourceType: "module",
  },
  ignorePatterns: [
    "/lib/**/*", // Ignore built files.
    "/generated/**/*", // Ignore generated files.
  ],
  plugins: [
    "@typescript-eslint",
    "import",
  ],
  rules: {
    "quotes": ["error", "double"],
    "import/no-unresolved": 0,
    "indent": ["error", 2],
    // Off because this repo is developed on Windows: git checks the
    // sources out with CRLF, so Google's default LF rule flagged every
    // single line of every file (540 in index.ts alone) and `npm run lint`
    // could never pass. That matters beyond tidiness — firebase.json runs
    // lint as a functions predeploy hook, so it blocked deploying at all.
    // Line endings are a checkout artifact, not something to enforce here.
    "linebreak-style": 0,
  },
};
