"use strict";
module.exports = {
  roots: ["<rootDir>/src"],
  testMatch: ["**/*.test.ts"],
  clearMocks: true,
  restoreMocks: true,
  transform: {
    "\\.ts$": "ts-jest",
  },
};
