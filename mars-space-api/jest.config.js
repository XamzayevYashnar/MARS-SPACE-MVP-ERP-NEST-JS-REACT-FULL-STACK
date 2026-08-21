/** @type {import('jest').Config} */
module.exports = {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: 'src',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  collectCoverageFrom: [
    '**/application/**/*.ts',
    '**/domain/**/*.ts',
    'common/utils/**/*.ts',
    '!**/*.dto.ts',
    '!**/index.ts',
  ],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
};
