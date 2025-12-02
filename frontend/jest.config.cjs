/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.js"],
  moduleFileExtensions: ["js", "jsx"],
  transform: {
    "^.+\\.(js|jsx)$": "babel-jest",
  },
  moduleNameMapper: {
    // CSS modules → mocked so imports don't break
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",

    // Images and other static assets → use our file mock
    "\\.(gif|ttf|eot|svg|png|jpe?g|webp)$":
      "<rootDir>/src/__mocks__/fileMock.js",
  },
};
