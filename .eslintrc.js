module.exports = {
  env: {
    node: true,
    es6: true,
  },
  extends: 'eslint:recommended',
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
    document: true,
    localStorage: true,
    window: true,
    $: true,
    self: true,
    THREE: true,
  },
  "parser": "babel-eslint",  
  parserOptions: {
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  rules: {
    'space-before-function-paren': 0,
    //强制不使用分号结尾
    semi: ['error', 'never'],
    //强制使用单引号
    quotes: ['error', 'single'],
    camelcase: [
      0,
      {
        properties: 'never',
      },
    ],
    // allow async-await
    'generator-star-spacing': 'off',
    // allow debugger during development
    'no-console': 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': 'warn', //把该条提示信息转换成警告信息
  },
}
