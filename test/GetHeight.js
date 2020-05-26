require('dotenv').config()
const chai = require('chai')
const expect = chai.expect
const assert = chai.assert

const exec = require('child_process').exec

describe('Tests for GetHeight', () => {
  it('Should return a JSON struct with only a height field', (done) => {
    const shGetHeight = exec('sh get_height.sh')

    shGetHeight.stdout.on('data', (data) => {
      try {
        const result = JSON.parse(data)

        expect(result.height).to.be.a('number')

        done()
      } catch (err) {
        done(err)
      }
    })
    shGetHeight.stderr.on('data', (err) => {
      assert.fail('Failed on bash call')
      done(err)
    })
  })
})
