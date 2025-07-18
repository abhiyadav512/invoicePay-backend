module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat', // new feature
        'fix', // bug fix
        'docs', // documentation only
        'style', // formatting, no code change
        'refactor', // code change, no new feature or bug fix
        'test', // adding or updating tests
        'chore', // tool changes, build process, etc.
        'ci', // CI/CD pipeline changes
        'build', // changes to build system
        'perf' // performance improvement
      ]
    ],
    'subject-case': [2, 'always', ['sentence-case']]
  }
};
