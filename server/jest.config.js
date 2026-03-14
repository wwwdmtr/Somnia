/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  ...require("../jest.config.js"),
  transform: {
    "^.+\\.tsx?$": ["ts-jest", { tsconfig: "<rootDir>/tsconfig.test.json" }],
  },
};
