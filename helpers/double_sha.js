/*
 ******************************************************************************************
 * Standalone Double SHA
 ******************************************************************************************
 */

const crypto = require('crypto')

sha256 = (buf) => {
  return crypto.createHash('sha256').update(buf).digest()
}

sha256sha256 = (buf) => {
  return sha256(sha256(buf))
}

const buf = Buffer.from(process.argv[2], 'hex')

// reverse if extra arg (for endian)
console.log(
  process.argv.length >= 4
    ? sha256sha256(buf).reverse().toString('hex')
    : sha256sha256(buf).toString('hex')
)
