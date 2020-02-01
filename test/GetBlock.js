

require('dotenv').config()
const _ = require('lodash')
const chai = require('chai')
const expect = chai.expect
const assert = chai.assert

const fs = require('fs')
const exec = require('child_process').exec

console.log(__dirname)

describe('Tests for Parse Blocks', () => {

  let block_553963, block_553991

  before((done) => {

    block_553963 = JSON.parse(fs.readFileSync(__dirname + '/data/blocks/553963.json').toString())
    block_553991 = JSON.parse(fs.readFileSync(__dirname + '/data/blocks/553991.json').toString())

    done()
  })

  it('Should return a JSON struct for block 553991', (done) => {

    const shGetHeight = exec('sh parse_blocks.sh 553991')

    let shGetHeightData = ''

    shGetHeight.stdout.on('data', (data) => {
      shGetHeightData += data
    })

    shGetHeight.stdout.on('close', () => {

      try {
        const result = JSON.parse(shGetHeightData)

        expect(result.length).to.be.equal(1)

        const block = result[0]

        expect(block.hash).to.be.equal(block_553991.hash)

        expect(block).to.have.all.keys(
          'hash',
          'confirmations',
          'size',
          'height',
          'weight',
          'time',
          'median_time',
          'version',
          'version_hex',
          'difficulty',
          'merkle_root',
          'chain_work',
          'chain_work_as_number',
          'next_block_hash',
          'next_block_hash_as_number',
          'prev_block_hash',
          'prev_block_hash_as_number',
          'transactions',
          'transaction_count',
          'nonce',
          'auxpow'
        )

        done()
      } catch (err) {
        done(err)
      }

    })

    shGetHeight.stderr.on('data', (err)=>{

      if (err.match(/readBigUInt64LE/).length) {
        assert.fail('This requires Node > 12')
        done()
        return
      }

      assert.fail('Failed on bash call')
      done(err)
    })

  })

  it('Should return multiple JSON structs for block 553963 and 553991', (done) => {

    const shGetHeight = exec('sh parse_blocks.sh 553963 553991')

    let shGetHeightData = ''

    shGetHeight.stdout.on('data', (data) => {
      shGetHeightData += data
    })

    shGetHeight.stdout.on('close', () => {

      try {
        const result = JSON.parse(shGetHeightData)

        expect(result.length).to.be.equal(2)

        expect(result[0].hash).to.be.equal(block_553963.hash)
        expect(result[1].hash).to.be.equal(block_553991.hash)

        done()
      } catch (err) {
        done(err)
      }

    })

    shGetHeight.stderr.on('data', (err)=>{

      if (err.match(/readBigUInt64LE/).length) {
        assert.fail('This requires Node > 12')
        done()
        return
      }

      assert.fail('Failed on bash call')
      done(err)
    })

  })
})
