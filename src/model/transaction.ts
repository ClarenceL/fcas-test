export interface Transaction {
  coinbase: boolean
  hash: string
  hash_as_number: string
  id: string
  id_as_number: string
  index: number
  type: string
  type_description: string
  inputs: Array<Input>
  lock_time: number
  outputs: Array<Output>
  size: number
  time: string
  version: number
  payload_version: number
  payload: Payload
  attributes?: {
    usage: number
    data: string
  }
  programs?: [
    {
      code: string
      parameter: string
    }
  ]
}

export interface Payload {}

export interface Input {}

export interface Output {}
