/*
 ******************************************************************************************
 * Standalone
 ******************************************************************************************
 */
const buf = Buffer.from(process.argv[2], 'hex')

console.log(buf.reverse().toString('hex'))