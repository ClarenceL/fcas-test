# Parse an array of blocks and write parsed json to stdout.
#
#
#      Example:
#      > bash parse_blocks.sh 100 101 102 103 104
#      > [{"hash": "0x067fdc5b9615e604ff9cee0025687e868ce6feee45e2d1f5be75d7e617c57a06", "timestamp": 1546763415, ...}, ...]
#
#
# Put command to run here:
# example:
# your-command "$@"
#

export $(grep -v '^#' .env | xargs)

# requires jq: "sudo apt-get install jq"

BLOCKS=()

# iterate through args, each arg is a block number
for BLOCK_NUM in $@
do
    # getblock only accepts blockhashes not height, so retrieve the blockhash for the height
    BLOCK_HASH=$(curl -s -H 'Content-Type: application/json' -H 'Accept:application/json' --data "{\"method\":\"getblockhash\", \"params\":{\"height\":$BLOCK_NUM}}" http://$ELASTOS_RPC:$ELASTOS_RPC_PORT | jq -c '.result')

    BLOCK_DATA=$(curl -s -H 'Content-Type: application/json' -H 'Accept:application/json' --data "{\"method\":\"getblock\", \"params\":{\"blockhash\":$BLOCK_HASH,\"verbosity\":2}}" http://$ELASTOS_RPC:$ELASTOS_RPC_PORT | jq -c '.result')

    BLOCKS+=("$BLOCK_DATA")
done

# debug length
# echo "${#BLOCKS[@]}"

# join array on ,
ALL_BLOCKS=$(printf ",%s" "${BLOCKS[@]}")
ALL_BLOCKS=${ALL_BLOCKS:1}

# we are wrapping the objects with [ ] and piping to jq
BLOCK_JSON=$(echo "[$ALL_BLOCKS]" | jq -c '.')

./node_modules/typescript/bin/tsc

~/.nvm/versions/node/v12.14.1/bin/node ./dist/app.js "$BLOCK_JSON"
