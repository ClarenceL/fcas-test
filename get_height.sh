
# requires jq: "sudo apt-get install jq"
curl -s -H 'Content-Type: application/json' -H 'Accept:application/json' --data '{"method":"getblockcount"}' http://$ELASTOS_RPC:$ELASTOS_RPC_PORT | jq -M 'del(.error, .id, .jsonrpc) | {height: .result}'
