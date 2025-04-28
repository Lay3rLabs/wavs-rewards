import { parseAbi } from "viem";

export const REWARDS_DISTRIBUTOR_ABI = parseAbi([
  // IWavsTrigger methods
  "function addTrigger(address rewardTokenAddr, address rewardSourceNftAddr) external",
  "function getTrigger(uint64 triggerId) external view returns (uint64 triggerId, address creator, bytes data)",
  "function triggerIdsByCreator(address _creator) external view returns (uint64[] _triggerIds)",

  // ISimpleSubmit methods
  "function isValidTriggerId(uint64 _triggerId) external view returns (bool _isValid)",
  "function getSignature(uint64 _triggerId) external view returns (bytes _signature)",
  "function getData(uint64 _triggerId) external view returns (bytes _data)",

  // UniversalRewardsDistributor methods
  "function root() external view returns (bytes32)",
  "function ipfsHash() external view returns (bytes32)",
  "function claim(address account, address reward, uint256 claimable, bytes32[] calldata proof) external returns (uint256 amount)",
  "function claimed(address account, address token) external view returns (uint256)",

  // Events
  "event WavsTriggerCreated(uint64, address, address)",
  "event Claimed(address indexed account, address indexed reward, uint256 amount)"
]);

export const ERC20_ABI = parseAbi([
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)",
  "function totalSupply() external view returns (uint256)",
  "function balanceOf(address owner) external view returns (uint256)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "function mint(address to, uint256 amount) external",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
]);

export const ERC721_ABI = parseAbi([
  "function balanceOf(address owner) external view returns (uint256)",
  "function ownerOf(uint256 tokenId) external view returns (address)",
  "function name() external view returns (string)",
  "function symbol() external view returns (string)",
  "function tokenURI(uint256 tokenId) external view returns (string)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) external view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes calldata data) external",
  "function mint(address to, uint256 tokenId) external"
]);

export const UNIVERSAL_REWARDS_DISTRIBUTOR_ABI = parseAbi([
  "function claimed(address account, address token) external view returns (uint256)",
  "function root() external view returns (bytes32)",
  "function ipfsHash() external view returns (bytes32)",
  "function claim(address account, address reward, uint256 claimable, bytes32[] calldata proof) external returns (uint256 amount)",
  "event Claimed(address indexed account, address indexed reward, uint256 amount)"
]);
