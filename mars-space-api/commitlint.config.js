/**
 * Conventional Commits, enforced by the commit-msg hook.
 *
 * The scope list mirrors the module layout, so the history reads as a map of
 * the codebase rather than a list of "fix stuff".
 */
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      ['feat', 'fix', 'docs', 'style', 'refactor', 'perf', 'test', 'build', 'ci', 'chore', 'revert'],
    ],
    'scope-enum': [
      1,
      'always',
      [
        'auth',
        'users',
        'categories',
        'courses',
        'teachers',
        'groups',
        'students',
        'leads',
        'posts',
        'testimonials',
        'messages',
        'settings',
        'uploads',
        'statistics',
        'common',
        'core',
        'database',
        'docker',
        'docs',
        'deps',
      ],
    ],
    'subject-case': [2, 'never', ['upper-case', 'pascal-case']],
    'header-max-length': [2, 'always', 100],
  },
};
