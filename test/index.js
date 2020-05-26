const requireDirectory = require('require-directory')

describe('Chainwalks Elastos Mainchain tests', () => {
  requireDirectory(module, './', { exclude: /(index\.js)|(\.json)/ })
})
