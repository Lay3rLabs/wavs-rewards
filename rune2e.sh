#!/bin/bash

# run `make start-all` in another terminal

# Deploy
export SERVICE_MANAGER_ADDR=`make get-eigen-service-manager-from-deploy`
forge script ./script/Deploy.s.sol ${SERVICE_MANAGER_ADDR} --sig "run(string)" --rpc-url http://localhost:8545 --broadcast

# Extract the NFT address from the deploy
export WAVS_ENV_REWARD_SOURCE_NFT_ADDRESS=`jq -r '.reward_source_nft' .docker/script_deploy.json`
# Replace line in .env
sed -i '' "s/WAVS_ENV_REWARD_SOURCE_NFT_ADDRESS=.*/WAVS_ENV_REWARD_SOURCE_NFT_ADDRESS=${WAVS_ENV_REWARD_SOURCE_NFT_ADDRESS}/" .env

TRIGGER_EVENT="NewTrigger(bytes)" make deploy-service
export SERVICE_TRIGGER_ADDR=`make get-trigger-from-deploy`
forge script ./script/Trigger.s.sol ${SERVICE_TRIGGER_ADDR} "test" --sig "run(string,string)" --rpc-url http://localhost:8545 --broadcast -v 4

echo "waiting for 2 seconds for the component to execute..."
sleep 2

make show-result
