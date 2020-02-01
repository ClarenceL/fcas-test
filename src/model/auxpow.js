var crypto = require('crypto');
var AuxPoW = (function () {
    /**
     * We build the data by reading a buffer, so we're just setting
     * up some basic structs here
     *
     * @param auxPowHexStr
     */
    function AuxPoW(auxPowHexStr) {
        this.parent_coinbase_tx = {
            txin: [],
            txout: []
        };
        as;
        any;
        this.aux_merkle_branch = {
            merkle_branch: []
        };
        as;
        any;
        this.parent_coinbase_merkle = [];
        this.parent_block_header = {};
        as;
        any;
        this.auxPowHexStr = auxPowHexStr;
        this.buf = Buffer.from(this.auxPowHexStr, 'hex');
        this.bufPtr = 0;
        this.init();
    }
    AuxPoW.prototype.init = function () {
        this.processBuffer();
    };
    AuxPoW.prototype.sha256 = function (buf) {
        return crypto.createHash('sha256').update(buf).digest();
    };
    AuxPoW.prototype.sha256sha256 = function (buf) {
        return this.sha256(this.sha256(buf));
    };
    /**
     * The auxpow data struct employes variable length data,
     * therefore we dynamically parse it with a buffer
     */
    AuxPoW.prototype.processBuffer = function () {
        this.parent_coinbase_tx.version = this.readBufUintLE(32);
        this.parent_coinbase_tx.txin_count = this.readVarUint();
        for (var i = 0; i < this.parent_coinbase_tx.txin_count; i++) {
            var txinObj = {};
            txinObj.prev_out_point_hash = this.readBufHex(256);
            txinObj.prev_out_point_index = this.readBufUintLE(32);
            txinObj.sig_script_len = this.readVarUint();
            txinObj.sig_script = this.readBufHex(txinObj.sig_script_len * 8, false);
            txinObj.sequence = this.readBufUintLE(32);
            this.parent_coinbase_tx.txin.push(txinObj);
        }
        this.parent_coinbase_tx.txout_count = this.readVarUint();
        for (var i = 0; i < this.parent_coinbase_tx.txout_count; i++) {
            var txoutObj = {};
            txoutObj.value = this.readBufUintLE(64);
            txoutObj.pk_script_len = this.readVarUint();
            txoutObj.pk_script = this.readBufHex(txoutObj.pk_script_len * 8, false);
            this.parent_coinbase_tx.txout.push(txoutObj);
        }
        this.parent_coinbase_tx.lock_time = this.readBufUintLE(32);
        // parent_hash is located here but we overwrite this later with
        // actual hashed bitcoin header, we can't trust this
        // because some pools return this BigEndian and others LittleEndian
        this.parent_hash = this.readBufHex(256);
        this.parent_coinbase_merkle_count = this.readVarUint();
        for (var i = 0; i < this.parent_coinbase_merkle_count; i++) {
            this.parent_coinbase_merkle.push(this.readBufHex(256));
        }
        this.parent_coinbase_merkle_bitmask = this.readBufUintLE(32);
        this.aux_merkle_branch.branch_count = this.readVarUint();
        for (var i = 0; i < this.aux_merkle_branch.branch_count; i++) {
            this.aux_merkle_branch.merkle_branch.push(this.readBufHex(256));
        }
        this.parent_coinbase_merkle_bitmask = this.readBufUintLE(32);
        // save the start of the BTC Header
        var btcHeaderStartPtr = this.bufPtr;
        this.parent_block_header.version = this.readBufUintLE(32);
        this.parent_block_header.prev_block_hash = this.readBufHex(256);
        this.parent_block_header.merkle_root = this.readBufHex(256);
        this.parent_block_header.time = new Date(this.readBufUintLE(32) * 1000).toISOString();
        this.parent_block_header.bits = this.readBufUintLE(32);
        this.parent_block_header.nonce = this.readBufUintLE(32);
        this.parent_hash = this.getBlockHash(btcHeaderStartPtr);
    };
    AuxPoW.prototype.getBlockHash = function (btcHeaderStartPtr) {
        var newBuf = Buffer.alloc(80);
        this.buf.copy(newBuf, 0, btcHeaderStartPtr, btcHeaderStartPtr + 80);
        // DEBUG this is the entire BTC block header
        // console.log(newBuf.toString('hex'))
        return this.sha256sha256(newBuf).reverse().toString('hex');
    };
    /*
    ************************************************************************
    * Helpers for reading the buffer so I don't need to manage the pointer
    ************************************************************************
     */
    AuxPoW.prototype.readVarUint = function () {
        var discriminant = this.readBufUintLE(8);
        switch (discriminant) {
            case 0xff:
                // read in 64 bits = 16 hex chars
                return this.readBufUintLE(64);
            case 0xfe:
                // read in 32 bits
                return this.readBufUintLE(32);
            case 0xfd:
                // read in 16 bits
                return this.readBufUintLE(16);
            default:
                return discriminant;
        }
    };
    AuxPoW.prototype.readBufUintLE = function (numBits) {
        var returnVal;
        switch (numBits) {
            case 64:
                returnVal = this.buf.readBigUInt64LE(this.bufPtr);
                this.bufPtr += 8;
                break;
            case 32:
                returnVal = this.buf.readUInt32LE(this.bufPtr);
                this.bufPtr += 4;
                break;
            case 16:
                returnVal = this.buf.readUInt16LE(this.bufPtr);
                this.bufPtr += 2;
                break;
            case 8:
                returnVal = this.buf.readUInt8(this.bufPtr);
                this.bufPtr += 1;
                break;
        }
        return returnVal;
    };
    AuxPoW.prototype.readBufHex = function (numBits, littleEndian) {
        if (littleEndian === void 0) { littleEndian = true; }
        var newBuf = Buffer.alloc(numBits / 8);
        this.buf.copy(newBuf, 0, this.bufPtr, this.bufPtr + numBits / 8);
        this.bufPtr += numBits / 8;
        if (littleEndian) {
            newBuf.reverse();
        }
        return newBuf.toString('hex');
    };
    AuxPoW.prototype.output = function () {
        return {
            parent_coinbase_tx: {
                version: this.parent_coinbase_tx.version,
                txin_count: this.parent_coinbase_tx.txin_count,
                txin: this.parent_coinbase_tx.txin,
                txout_count: this.parent_coinbase_tx.txout_count,
                txout: this.parent_coinbase_tx.txout,
                lock_time: this.parent_coinbase_tx.lock_time
            },
            parent_hash: this.parent_hash,
            parent_coinbase_merkle_count: this.parent_coinbase_merkle_count,
            parent_coinbase_merkle: this.parent_coinbase_merkle,
            aux_merkle_branch: {
                branch_count: this.aux_merkle_branch.branch_count,
                merkle_branch: this.aux_merkle_branch.merkle_branch,
                bitmask: this.aux_merkle_branch.bitmask
            },
            parent_block_header: {
                version: this.parent_block_header.version,
                prev_block_hash: this.parent_block_header.prev_block_hash,
                merkle_root: this.parent_block_header.merkle_root,
                time: this.parent_block_header.time,
                bits: this.parent_block_header.bits,
                nonce: this.parent_block_header.nonce
            }
        };
    };
    return AuxPoW;
})();
exports.AuxPoW = AuxPoW;
// test
/*
if (process.argv.length >= 3) {
  console.log(JSON.stringify(new AuxPoW('01000000010000000000000000000000000000000000000000000000000000000000000000ffffffff5503e159091c4d696e656420627920416e74506f6f6c313333ef00f10120ab8d32cffabe6d6db7ae5e7465b297f448b6c5484686aa49608562c40371c55a81486a6192839b4c0400000000000000fc530000721b1900ffffffff032969b54b000000001976a91411dbe48cc6b617f9c6adaf4d9ed5f625b1c7cb5988ac0000000000000000266a24aa21a9ed49757045b0b063e6ef52c7ae032cb15c7dfef68cdfefd552958eccad53d75d720000000000000000266a24b9e11b6da333dc93c98cca9dd98ae1aa9dc5bfeadc091e71f7e6d0d26c280990f7ab143a0000000053188ed5202110af72f94a205900815f5b98232608a34f0000000000000000000cde2e345893d202a17f7131fcac6966aa984d960d7b735876cefd52b3724d0f41daa654b5018120933a152ee923adaedb350408f37dd5cc6b992e287db40a511b6fb378b4d62f9e1efb81a9427e3a4d7ba13de0935577f086a7970c73be52512fce15e9025b6096bb65bd8967760d1aa70f688930c0d7af20f78258d3909a83bedd335cff3d543f816e5a423ea23893f4f54717b6e95f0dc1466ee6080ca2b8c711751d714bbb1731c1ff9ae1daa438f87c4008feca72edf8a0492da2e9056fe0e55fb23b4c7286f2b19861aea5312ad48bd007856c268542421f61ab224e89782d1036afca4d68c6b8b59488272294e0010e6e3d3d679d4d618302d55046025c5835b75f9aff9e846a2e450983e2fe3147e3f3f4095ca1a8ecfd8ce89ef39b6f7575dcfa72af5071c510e5a70c0e313c4ebeee198d3a30da9a8d66e75fc2493ea04390da48c65ff1201c996906cf5d72f7a586dbd06323d8f3c210ab6a5e4967444ff6fa947a916f43409887ac3f88751bfa1e6b8744a2eb25f762bf9928263600000000029c9503fc92733604b93471f87147ccc87aae598f1ea3d71c9db40b8e8a96f84ac2c25db0c08244d3eba88658a8fdfa01ecf1a5d52c5e787bcd95af626e02bfc20200000000e0ff7fa1b2116f917932c2750a130a7f0d87aad07b4a7dece2000000000000000000009e94b5bc5f56eb1d0efeb99cc9214a2277668f13a6df5869307e8bb754a229d01e181e5ef265141791358a14').output(), (key, value) =>
    typeof value === 'bigint'
      ? value.toString()
      : value // return everything else unchanged
  , 2))
}
*/
