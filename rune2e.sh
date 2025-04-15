#!/bin/bash

# run `make start-all` in another terminal

export SERVICE_MANAGER_ADDR=`make get-eigen-service-manager-from-deploy`
forge script ./script/Deploy.s.sol ${SERVICE_MANAGER_ADDR} --sig "run(string)" --rpc-url http://localhost:8545 --broadcast
TRIGGER_EVENT="NewTrigger(bytes)" make deploy-service
export SERVICE_TRIGGER_ADDR=`make get-trigger-from-deploy`
forge script ./script/Trigger.s.sol ${SERVICE_TRIGGER_ADDR} "test" --sig "run(string,string)" --rpc-url http://localhost:8545 --broadcast -v 4

echo "waiting for 2 seconds for the component to execute..."
sleep 2

make show-result
