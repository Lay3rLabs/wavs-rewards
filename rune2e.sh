#!/bin/bash

export SERVICE_MANAGER_ADDR=`make get-eigen-service-manager-from-deploy`
forge script ./script/Deploy.s.sol ${SERVICE_MANAGER_ADDR} --sig "run(string)" --rpc-url http://localhost:8545 --broadcast
TRIGGER_EVENT="NewTrigger(bytes)" make deploy-service
export SERVICE_TRIGGER_ADDR=`make get-trigger-from-deploy`
forge script ./script/Trigger.s.sol ${SERVICE_TRIGGER_ADDR} "test" --sig "run(string,string)" --rpc-url http://localhost:8545 --broadcast -v 4
make show-result
