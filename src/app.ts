

import * as fs from "fs"

import ElastosBlock from './model/elastos'

if (process.argv.length < 3) {
  console.info('This script expects a JSON string as its only input arg')
  process.exit(-1)
}

/*
***********************************************************************************************
* Check to ensure ENV vars are set
***********************************************************************************************
 */
if (!process.env.ELASTOS_RPC || !process.env.ELASTOS_RPC_PORT) {
  console.info('This script requires ENV vars ELASTOS_RPC and ELASTOS_RPC_PORT')
  process.exit(-1)
}

(async function() {
  let finalBlocks = [], blockData = JSON.parse(process.argv[2])

  for (let i = 0, numBlocks = blockData.length; i < numBlocks; i++) {
    finalBlocks.push(await new ElastosBlock(blockData[i]).output())
  }

  console.log(JSON.stringify(finalBlocks, (key, value) => (
    typeof value === 'bigint'
      ? value.toString()
      : value // return everything else unchanged
  ), 2))
})()

