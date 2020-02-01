var elastos_1 = require('./model/elastos');
if (process.argv.length < 3) {
    console.info('This script expects a JSON string as its only input arg');
    process.exit(-1);
}
/*
***********************************************************************************************
* Check to ensure ENV vars are set
***********************************************************************************************
 */
if (!process.env.ELASTOS_RPC || !process.env.ELASTOS_RPC_PORT) {
    console.info('This script requires ENV vars ELASTOS_RPC and ELASTOS_RPC_PORT');
    process.exit(-1);
}
(async);
function () {
    var finalBlocks = [], blockData = JSON.parse(process.argv[2]);
    for (var i = 0, numBlocks = blockData.length; i < numBlocks; i++) {
        finalBlocks.push(await, new elastos_1["default"](blockData[i]).output());
    }
    console.log(JSON.stringify(finalBlocks, function (key, value) { return (typeof value === 'bigint'
        ? value.toString()
        : value // return everything else unchanged
    ); }, 2));
}
();
