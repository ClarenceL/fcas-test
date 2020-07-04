import BigNumber from 'bignumber.js'
import fetch from 'node-fetch'
import { AuxPoW } from './auxpow'
import { Transaction } from './transaction'

const typeDesc = {
  '00': 'CoinBase',
  '01': 'RegisterAsset',
  '02': 'TransferAsset',
  '03': 'Record',
  '04': 'Deploy',
  '05': 'SideChainPow',
  '06': 'RechargeToSideChain',
  '07': 'WithdrawFromSideChain',
  '08': 'TransferCrossChainAsset',
  '09': 'RegisterProducer',
  '0A': 'CancelProducer',
  '0B': 'UpdateProducer',
  '0C': 'ReturnDepositCoin',
  '0D': 'ActivateProducer',
  '0E': 'IllegalProposalEvidence',
  '0F': 'IllegalVoteEvidence',
  '10': 'IllegalBlockEvidence',
  '11': 'IllegalSidechainEvidence',
  '12': 'InactiveArbitrators',
  '13': 'UpdateVersion',
  '21': 'RegisterCR',
  '22': 'UnregisterCR',
  '23': 'UpdateCR',
  '24': 'ReturnCRDepositCoin',
  '25': 'CRCProposal',
  '26': 'CRCProposalReview',
  '27': 'CRCProposalTracking',
  '28': 'CRCAppropriation',
  '29': 'CRCProposalWithdraw',
}

export interface Block {
  bits: number
  chain_work: string
  chain_work_as_number: number
  confirmations: number
  difficulty: number
  hash: string
  hash_as_number: string
  height: number
  weight: number
  merkle_root: string
  next_block_hash: string
  next_block_hash_as_number: string
  nonce: number
  prev_block_hash: string
  prev_block_hash_as_number: string
  size: number
  time: string
  median_time: string
  transaction_count: number
  transactions: Array<Transaction>
  version: number
  version_hex: string
  auxpow: object
}

/**
 * Not really a model only, it also knows how to fetch the
 * transaction inputs for an output, this is initated misleadingly in the
 * output function
 */
export default class ElastosBlock implements Block {
  // raw fields - not outputted
  tx: Array<any>
  time_ms: number
  median_time_ms: number
  auxpow_raw: string

  // fields from Block
  bits: number
  chain_work: string
  chain_work_as_number: number
  confirmations: number
  difficulty: number
  hash: string
  hash_as_number: string
  height: number
  weight: number
  merkle_root: string
  next_block_hash: string
  next_block_hash_as_number: string
  nonce: number
  prev_block_hash: string
  prev_block_hash_as_number: string
  size: number
  time: string
  median_time: string
  transaction_count: number
  transactions: Array<Transaction>
  version: number
  version_hex: string
  auxpow: object
  miner_info: string

  /**
   * Only direct assignments from block to the private variables here
   * @param block
   */
  constructor(block) {
    this.hash = block.hash
    this.confirmations = block.confirmations
    this.size = block.size
    this.height = block.height
    this.weight = block.weight
    this.version = block.version
    this.version_hex = block.versionhex
    this.merkle_root = block.merkleroot
    this.chain_work = block.chainwork
    this.difficulty = block.difficulty
    this.nonce = block.nonce
    this.next_block_hash = block.nextblockhash
    this.prev_block_hash = block.previousblockhash
    this.miner_info = block.minerinfo

    // raw fields
    this.tx = block.tx
    this.time_ms = block.time * 1000
    this.median_time_ms = block.mediantime * 1000
    this.auxpow_raw = block.auxpow

    this.init()
  }

  init() {
    this.hash_as_number = new BigNumber(this.hash, 16).toFixed()
    this.time = new Date(this.time_ms).toISOString()
    this.median_time = new Date(this.median_time_ms).toISOString()
    this.transaction_count = this.tx.length
    this.chain_work_as_number = parseInt(this.chain_work, 16)
    this.next_block_hash_as_number = new BigNumber(
      this.next_block_hash,
      16
    ).toFixed()
    this.prev_block_hash_as_number = new BigNumber(
      this.prev_block_hash,
      16
    ).toFixed()

    // process auxpow
    this.auxpow = new AuxPoW(this.auxpow_raw).output()

    this.transactions = []
  }

  static async getInputOutput(vin) {
    return fetch(
      `http://${process.env.ELASTOS_RPC}:${process.env.ELASTOS_RPC_PORT}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          method: 'getrawtransaction',
          params: {
            txid: vin.txid,
            verbose: true,
          },
        }),
      }
    )
      .then((res) => {
        return res.json()
      })
      .then((tx) => {
        // this is the output that is the input to this transaction,
        // however the previous output may have multiple outputs, therefore
        // we want to match the vout with the output's "n" value
        if (tx.error) {
          return null
        }

        let matchingOutput
        for (let vout of tx.result.vout) {
          if (vin.vout === vout.n) {
            matchingOutput = {
              address: vout.address,
              value: vout.value,
              value_denomination: 'ELA',
              index: vout.n,
              asset_id: vout.assetid,
              type: vout.type,
              output_lock: vout.outputlock,
              payload: vout.payload,
            }
            break
          }
        }

        return matchingOutput
      })
  }

  /**
   * This is async because each transaction "input" needs to fetch the previous output
   *
   * NOTE: Do not process too many transactions in parallel and/or use Promise.all, we had EMFILE issues previously
   *
   * TODO: could use a bit of cleanup
   */
  async output(): Promise<Block> {
    // process transactions
    for (
      let transactionIndex = 0;
      transactionIndex < this.tx.length;
      transactionIndex++
    ) {
      const t = this.tx[transactionIndex]

      const type =
        t.type.toString(16).length < 2
          ? '0' + t.type.toString(16)
          : t.type.toString(16)

      const typeDescription = typeDesc[type]

      const inputs = []

      // this needs to call out to the RPC port to get the outputs that led to each input
      for (let inputIndex = 0; inputIndex < t.vin.length; inputIndex++) {
        const vin = t.vin[inputIndex]
        inputs.push({
          txid: vin.txid,
          txid_as_number: new BigNumber(vin.txid, 16).toFixed(),
          output_index: vin.vout,
          prev_output: await ElastosBlock.getInputOutput(vin),
          sequence: vin.sequence,
        })
      }

      const transaction: Transaction = {
        coinbase: t.type === 0,
        hash: t.hash,
        hash_as_number: new BigNumber(t.hash, 16).toFixed(),
        id: t.txid,
        id_as_number: new BigNumber(t.txid, 16).toFixed(),
        index: transactionIndex,
        type: type,
        type_description: typeDescription,
        size: t.size,
        version: t.version,
        payload_version: t.payloadversion,
        payload: t.payload,
        lock_time: t.locktime,
        time: new Date(this.time).toISOString(),

        // this needs to call out to the RPC port to get the outputs that led to each input
        inputs: inputs,

        outputs: t.vout.map((vout) => ({
          address: vout.address,
          value: vout.value,
          value_denomination: 'ELA',
          index: vout.n,
          asset_id: vout.assetid,
          type: vout.type,
          output_lock: vout.outputlock,
          payload: vout.payload,
        })),
      }

      if (t.attributes && t.attributes.length) {
        transaction.attributes = t.attributes
      }

      if (t.programs && t.programs.length) {
        transaction.programs = t.programs
      }

      this.transactions.push(transaction)
    }

    return {
      hash: this.hash,
      confirmations: this.confirmations,
      size: this.size,
      height: this.height,
      weight: this.weight,
      time: this.time,
      median_time: this.median_time,
      version: this.version,
      version_hex: this.version_hex,
      bits: this.bits,
      difficulty: this.difficulty,
      merkle_root: this.merkle_root,
      chain_work: this.chain_work,
      chain_work_as_number: this.chain_work_as_number,
      next_block_hash: this.next_block_hash,
      next_block_hash_as_number: this.next_block_hash_as_number,
      prev_block_hash: this.prev_block_hash,
      prev_block_hash_as_number: this.prev_block_hash_as_number,

      transactions: this.transactions,
      transaction_count: this.transaction_count,

      nonce: this.nonce,
      auxpow: this.auxpow,
    } as Block
  }
}
