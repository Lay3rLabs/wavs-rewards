# [WAVS](https://docs.wavs.xyz) Rewards Demo

This project implements a reward distribution system that computes rewards based on NFT holdings, creates a Merkle tree, uploads it to IPFS, and allows users to claim rewards via a frontend interface. There is also a frontend to interact with the demo.

## System Requirements

<details>
<summary>Core (Docker, Compose, Make, JQ, Node v21+)</summary>

### Docker

- **MacOS**: `brew install --cask docker`
- **Linux**: `sudo apt -y install docker.io`
- **Windows WSL**: [docker desktop wsl](https://docs.docker.com/desktop/wsl/#turn-on-docker-desktop-wsl-2) & `sudo chmod 666 /var/run/docker.sock`
- [Docker Documentation](https://docs.docker.com/get-started/get-docker/)

### Docker Compose

- **MacOS**: Already installed with Docker installer
- **Linux + Windows WSL**: `sudo apt-get install docker-compose-v2`
- [Compose Documentation](https://docs.docker.com/compose/)

### Make

- **MacOS**: `brew install make`
- **Linux + Windows WSL**: `sudo apt -y install make`
- [Make Documentation](https://www.gnu.org/software/make/manual/make.html)

### JQ

- **MacOS**: `brew install jq`
- **Linux + Windows WSL**: `sudo apt -y install jq`
- [JQ Documentation](https://jqlang.org/download/)

### Node.js

- **Required Version**: v21+
- [Installation via NVM](https://github.com/nvm-sh/nvm?tab=readme-ov-file#installing-and-updating)
</details>

<details>

<summary>Rust v1.84+</summary>

### Rust Installation

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

rustup toolchain install stable
rustup target add wasm32-wasip2
```

### Upgrade Rust

```bash
# Remove old targets if present
rustup target remove wasm32-wasi || true
rustup target remove wasm32-wasip1 || true

# Update and add required target
rustup update stable
rustup target add wasm32-wasip2
```

</details>

<details>
<summary>Cargo Components</summary>

### Install Cargo Components

```bash
# Install required cargo components
# https://github.com/bytecodealliance/cargo-component#installation
cargo install cargo-binstall
cargo binstall cargo-component warg-cli wkg --locked --no-confirm --force

# Configure default registry
wkg config --default-registry wa.dev
```

</details>

## Project Overview

This project demonstrates a complete web3 reward distribution system with the following components:

1. **Solidity Smart Contracts**:

   - `RewardDistributor.sol`: Main contract for distributing rewards based on Merkle proofs
   - `RewardERC20.sol`: ERC20 token used for rewards
   - `RewardSourceERC721.sol`: NFT contract that determines reward eligibility

2. **AVS Component (Rust)**:

   - Computes rewards based on NFT ownership
   - Builds a Merkle tree of account→reward mappings
   - Uploads the Merkle tree data to IPFS
   - Returns the Merkle root and IPFS hash to the contract

3. **Frontend**:
   - Displays pending rewards
   - Allows users to claim rewards by submitting Merkle proofs
   - Shows claim history and total received rewards
   - Breaks down rewards by source
   - Allows to mint NFTs and trigger the AVS service to update the merkle root in the reward distributor contract

## Installation and Setup

### Solidity

Install the required packages to build the Solidity contracts. This project supports both [submodules](./.gitmodules) and [npm packages](./package.json).

```bash
# Install packages (npm & submodules)
make setup

# Build the contracts
forge build

# Run the solidity tests
forge test
```

### Build WASI components

Now build the WASI rust components into the `compiled` output directory.

> [!WARNING]
> If you get: `error: no registry configured for namespace "wavs"`
>
> run, `wkg config --default-registry wa.dev`

> [!WARNING]
> If you get: `failed to find the 'wasm32-wasip1' target and 'rustup' is not available`
>
> `brew uninstall rust` & install it from <https://rustup.rs>

```bash
make wasi-build # or `make build` to include solidity compilation.
```

## WAVS

> [!NOTE]
> If you are running on a Mac with an ARM chip, you will need to do the following:
>
> - Set up Rosetta: `softwareupdate --install-rosetta`
> - Enable Rosetta (Docker Desktop: Settings -> General -> enable "Use Rosetta for x86_64/amd64 emulation on Apple Silicon")
>
> Configure one of the following networking:
>
> - Docker Desktop: Settings -> Resources -> Network -> 'Enable Host Networking'
> - `brew install chipmk/tap/docker-mac-net-connect && sudo brew services start chipmk/tap/docker-mac-net-connect`

### Start Environment

Start an ethereum node (anvil), the WAVS service, and deploy [eigenlayer](https://www.eigenlayer.xyz/) contracts to the local network.

```bash
cp .env.example .env

# Start the backend
#
# This must remain running in your terminal. Use another terminal to run other commands.
# You can stop the services with `ctrl+c`. Some MacOS terminals require pressing it twice.
make start-all
```

Set `WAVS_ENV_PINATA_API_KEY` and `IPFS_GATEWAY_URL` in your `.env` file.

### Run the demo

```bash
# Deploy contracts
make deploy-contracts

# Deploy the service
make deploy-service

# Trigger the service
make trigger-service

# Wait for the component to execute
echo "waiting 3 seconds for the component to execute..."
sleep 3

# Claim the rewards
make claim
```

## Frontend

A frontend application is included for interacting with the reward distribution system.

### Features

- Connect your Ethereum wallet
- View pending rewards based on NFT holdings
- Claim rewards by submitting your Merkle proof
- View claim history and total rewards received
- See a breakdown of reward sources
- Use admin panel to mint NFTs and trigger the AVS service to update the merkle root in the reward distributor contract

### Running the Frontend

The frontend must be started after the backend is running and the contracts are deployed, since the contracts need to be available to the frontend via environment variables.

```bash
# In a terminal, start the backend
make start-all

# In another terminal, deploy the necessary contracts and service and do a test run.
make deploy-contracts
make deploy-service
make trigger-service
sleep 3
make claim

# Then install frontend dependencies
cd frontend
npm install

# And start the server
npm run dev

# Frontend will be available at http://localhost:3000
```

To test the reward system, follow these steps:

1. In the admin panel:

   - Tap the faucet to get local tokens to pay for gas
   - Mint NFTs to your wallet
   - Trigger AVS to run to recompute the merkle root, upload it to IPFS, and update the contract.

2. Go to the home page:
   - See pending rewards based on your NFT holdings
   - Hit claim and see it in the history
   - See a breakdown of reward sources
   - Debug raw merkle tree data

## Claude Code

To spin up a sandboxed instance of [Claude Code](https://docs.anthropic.com/en/docs/agents-and-tools/claude-code/overview) in a Docker container that only has access to this project's files, run the following command:

```bash
npm run claude-code
# or with no restrictions (--dangerously-skip-permissions)
npm run claude-code:unrestricted
```

You must have [Docker](https://www.docker.com/) installed.
