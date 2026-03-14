/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ...require("../jest.config.js"),
  moduleNameMapper: {
    "^superjson$": "<rootDir>/src/test/superjson.mock.ts",
  },
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }],
  },
};
