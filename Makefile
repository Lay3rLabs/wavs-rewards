#!/usr/bin/make -f

# Check if user is in docker group to determine if sudo is needed
SUDO := $(shell if groups | grep -q docker; then echo ''; else echo 'sudo'; fi)

# Define common variables
CARGO=cargo
CREDENTIAL?=""
DOCKER_IMAGE?=ghcr.io/lay3rlabs/wavs:0.4.0-rc
MIDDLEWARE_DOCKER_IMAGE?=ghcr.io/lay3rlabs/wavs-middleware:5ebc489
IPFS_ENDPOINT?=http://127.0.0.1:5001
RPC_URL?=`bash ./script/get-rpc.sh`
DEPLOYER_PK=`cat .nodes/deployer`
SERVICE_FILE?=.docker/service.json
SERVICE_SUBMISSION_ADDR?=`jq -r .deployedTo .docker/submit.json`
SERVICE_TRIGGER_ADDR?=`jq -r .deployedTo .docker/trigger.json`
WASI_BUILD_DIR ?= ""
ENV_FILE?=.env
WAVS_CMD ?= $(SUDO) docker run --rm --network host $$(test -f ${ENV_FILE} && echo "--env-file ./${ENV_FILE}") -v $$(pwd):/data ${DOCKER_IMAGE} wavs-cli
WAVS_ENDPOINT?="http://127.0.0.1:8000"
-include ${ENV_FILE}

# wavs-rewards custom
COMPONENT_FILENAME?=rewards.wasm
REWARD_DISTRIBUTOR_ADDRESS?=`jq -r '.reward_distributor' .docker/rewards_deploy.json`
REWARD_TOKEN_ADDRESS?=`jq -r '.reward_token' .docker/rewards_deploy.json`
REWARD_NFT_ADDRESS?=`jq -r '.reward_source_nft' .docker/rewards_deploy.json`
WAVS_SERVICE_MANAGER_ADDRESS?=`jq -r .addresses.WavsServiceManager .nodes/avs_deploy.json`

## deploy-contracts: deploying the contracts | WAVS_SERVICE_MANAGER_ADDRESS, RPC_URL
deploy-contracts:
	@forge script ./script/Deploy.s.sol ${WAVS_SERVICE_MANAGER_ADDRESS} --sig "run(string)" --rpc-url $(RPC_URL) --private-key "${DEPLOYER_PK}" --broadcast

## update-rewards: updating the rewards | REWARD_DISTRIBUTOR_ADDRESS, RPC_URL
update-rewards:
	@forge script ./script/UpdateRewards.s.sol ${REWARD_DISTRIBUTOR_ADDRESS} --sig "run(string)" --rpc-url ${RPC_URL} --broadcast -v 4

## claim-rewards: claiming the rewards | REWARD_DISTRIBUTOR_ADDRESS, REWARD_TOKEN_ADDRESS, RPC_URL
claim-rewards:
	@forge script ./script/ClaimRewards.s.sol ${REWARD_DISTRIBUTOR_ADDRESS} ${REWARD_TOKEN_ADDRESS} --sig "run(string,string)" --rpc-url ${RPC_URL} --broadcast -v 4

# Default target is build
default: build

## build: building the project
build: _build_forge wasi-build

## wasi-build: building WAVS wasi components | WASI_BUILD_DIR
wasi-build:
	@./script/build_components.sh $(WASI_BUILD_DIR)

## wasi-exec: executing the WAVS wasi component(s) | COMPONENT_FILENAME, COIN_MARKET_CAP_ID
wasi-exec: pull-image
	@$(WAVS_CMD) exec --log-level=info --data /data/.docker --home /data \
	--component "/data/compiled/$(COMPONENT_FILENAME)" \
	--input `cast format-bytes32-string $(COIN_MARKET_CAP_ID)`

## clean: cleaning the project files
clean: clean-docker
	@forge clean
	@$(CARGO) clean
	@rm -rf cache
	@rm -rf out
	@rm -rf broadcast

## clean-docker: remove unused docker containers
clean-docker:
	@$(SUDO) docker rm -v $(shell $(SUDO) docker ps -a --filter status=exited -q) > /dev/null 2>&1 || true

## fmt: formatting solidity and rust code
fmt:
	@forge fmt --check
	@$(CARGO) fmt

## test: running tests
test:
	@forge test

## setup: install initial dependencies
setup: check-requirements
	@forge install
	@npm install

## start-all-local: starting anvil and core services (like IPFS for example)
start-all-local: clean-docker setup-env
	@sh ./script/start_all.sh

## get-trigger-from-deploy: getting the trigger address from the script deploy
get-trigger-from-deploy:
	@jq -r '.deployedTo' "./.docker/trigger.json"

## get-submit-from-deploy: getting the submit address from the script deploy
get-submit-from-deploy:
	@jq -r '.deployedTo' "./.docker/submit.json"

## wavs-cli: running wavs-cli in docker
wavs-cli:
	@$(WAVS_CMD) $(filter-out $@,$(MAKECMDGOALS))

## upload-component: uploading the WAVS component | COMPONENT_FILENAME, WAVS_ENDPOINT
upload-component:
	@if [ -z "${COMPONENT_FILENAME}" ]; then \
		echo "Error: COMPONENT_FILENAME is not set. Please set it to your WAVS component filename."; \
		exit 1; \
	fi
	@wget --post-file=./compiled/${COMPONENT_FILENAME} --header="Content-Type: application/wasm" -O - ${WAVS_ENDPOINT}/upload | jq -r .digest

IPFS_GATEWAY?="https://ipfs.io/ipfs"
## deploy-service: deploying the WAVS component service json | SERVICE_URL, CREDENTIAL, WAVS_ENDPOINT
deploy-service:
# this wait is required to ensure the WAVS service has time to service check
	@if [ -z "${SERVICE_URL}" ]; then \
		echo "Error: SERVICE_URL is not set. Set SERVICE_URL to a link / ipfs url."; \
		exit 1; \
	fi
	@if [ -n "${WAVS_ENDPOINT}" ]; then \
		if [ "$$(curl -s -o /dev/null -w "%{http_code}" ${WAVS_ENDPOINT}/app)" != "200" ]; then \
			echo "Error: WAVS_ENDPOINT is not reachable. Please check WAVS is online, or run this again in a few seconds."; \
			exit 1; \
		fi; \
	fi
	@$(WAVS_CMD) deploy-service --service-url ${SERVICE_URL} --log-level=debug --data /data/.docker --home /data $(if $(WAVS_ENDPOINT),--wavs-endpoint $(WAVS_ENDPOINT),) $(if $(IPFS_GATEWAY),--ipfs-gateway $(IPFS_GATEWAY),)

## get-trigger: get the trigger id | SERVICE_TRIGGER_ADDR, RPC_URL
get-trigger:
	@forge script ./script/ShowResult.s.sol ${SERVICE_TRIGGER_ADDR} --sig 'trigger(string)' --rpc-url $(RPC_URL) --broadcast

TRIGGER_ID?=1
## show-result: showing the result | SERVICE_SUBMISSION_ADDR, TRIGGER_ID, RPC_URL
show-result:
	@forge script ./script/ShowResult.s.sol ${SERVICE_SUBMISSION_ADDR} ${TRIGGER_ID} --sig 'data(string,uint64)' --rpc-url $(RPC_URL) --broadcast


PINATA_API_KEY?=""
## upload-to-ipfs: uploading the a service config to IPFS | SERVICE_FILE, [PINATA_API_KEY]
upload-to-ipfs:
	@if [ `sh script/get-deploy-status.sh` = "LOCAL" ]; then \
		curl -X POST "http://127.0.0.1:5001/api/v0/add?pin=true" -H "Content-Type: multipart/form-data" -F file=@${SERVICE_FILE} | jq -r .Hash; \
	else \
		if [ -z "${PINATA_API_KEY}" ]; then \
			echo "Error: PINATA_API_KEY is not set. Please set it to your Pinata API key -- https://app.pinata.cloud/developers/api-keys."; \
			exit 1; \
		fi; \
		curl -X POST --url https://uploads.pinata.cloud/v3/files --header "Authorization: Bearer ${PINATA_API_KEY}" --header 'Content-Type: multipart/form-data' --form file=@${SERVICE_FILE} --form network=public --form name=service-`date +"%b-%d-%Y"`.json | jq -r .data.cid; \
	fi

COMMAND?=""
PAST_BLOCKS?=500
wavs-middleware:
	@docker run --rm --network host --env-file ${ENV_FILE} \
		$(if ${WAVS_SERVICE_MANAGER_ADDRESS},-e WAVS_SERVICE_MANAGER_ADDRESS=${WAVS_SERVICE_MANAGER_ADDRESS}) \
		$(if ${PAST_BLOCKS},-e PAST_BLOCKS=${PAST_BLOCKS}) \
		-v ./.nodes:/root/.nodes ${MIDDLEWARE_DOCKER_IMAGE} ${COMMAND}

## update-submodules: update the git submodules
update-submodules:
	@git submodule update --init --recursive

# Declare phony targets
.PHONY: build clean fmt bindings test

.PHONY: help
help: Makefile
	@echo
	@echo " Choose a command run"
	@echo
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo

# helpers
_build_forge:
	@forge build

.PHONY: setup-env
setup-env:
	@if [ ! -f ${ENV_FILE} ]; then \
		if [ -f .env.example ]; then \
			echo "Creating ${ENV_FILE} file from .env.example..."; \
			cp .env.example ${ENV_FILE}; \
			echo "${ENV_FILE} file created successfully!"; \
		fi; \
	fi

pull-image:
	@if ! docker image inspect ${DOCKER_IMAGE} &>/dev/null; then \
		echo "Image ${DOCKER_IMAGE} not found. Pulling..."; \
		$(SUDO) docker pull ${DOCKER_IMAGE}; \
	fi

# check versions

## check-requirements: verify system requirements are installed
check-requirements: check-node check-jq check-cargo

check-command:
	@command -v $(1) > /dev/null 2>&1 || (echo "Command $(1) not found. Please install $(1), reference the System Requirements section"; exit 1)

.PHONY: check-node
check-node:
	@$(call check-command,node)
	@NODE_VERSION=$$(node --version); \
	MAJOR_VERSION=$$(echo $$NODE_VERSION | sed 's/^v\([0-9]*\)\..*/\1/'); \
	if [ $$MAJOR_VERSION -lt 21 ]; then \
		echo "Error: Node.js version $$NODE_VERSION is less than the required v21."; \
		echo "Please upgrade Node.js to v21 or higher."; \
		exit 1; \
	fi

.PHONY: check-jq
check-jq:
	@$(call check-command,jq)

.PHONY: check-cargo
check-cargo:
	@$(call check-command,cargo)
