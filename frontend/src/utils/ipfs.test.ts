import { describe, it, expect } from 'vitest';
import { bytes32DigestToCid, getCidForBytes32, normalizeCid } from './ipfs';

describe('IPFS Utilities', () => {
  // Test bytes32 value from a real contract
  const testBytes32 = '0x45fd9f3cd43d6b51c59e6ad67e6cdd235259af281dd75691831cd27af8a376e5';
  const expectedCid = 'bafkreicf7wptzvb5nni4lhtk2z7gzxjdkjm26ka525ljday42j5pri3w4u';
  
  it('should convert bytes32 to proper CID in v1 format', async () => {
    const cid = await bytes32DigestToCid(testBytes32);
    console.log(`Converted ${testBytes32} to CID: ${cid}`);
    
    expect(cid).toEqual(expectedCid);
  });
  
  it('should cache converted CIDs for quick reuse', async () => {
    const result = getCidForBytes32(testBytes32);
    
    // First call might not have cache hit
    console.log(`Initial cache state for ${testBytes32}: ${result.cid ? 'HIT' : 'MISS'}`);
    
    // Wait for the promise to resolve
    const cid = await result.promise;
    console.log(`Resolved CID: ${cid}`);
    
    // Second call should hit cache
    const secondResult = getCidForBytes32(testBytes32);
    console.log(`Second cache state: ${secondResult.cid ? 'HIT' : 'MISS'}`);
    
    // The cached CID should be available immediately
    expect(secondResult.cid).toBeTruthy();
    expect(secondResult.cid).toEqual(cid);
  });
  
  it('should normalize different CID formats', () => {
    // Test with a CIDv1 format
    expect(normalizeCid(expectedCid)).toEqual(expectedCid);
    
    // Test with IPFS URL format
    const ipfsUrl = 'https://ipfs.io/ipfs/' + expectedCid;
    const normalized = normalizeCid(ipfsUrl);
    console.log(`Normalized IPFS URL: ${normalized}`);
    expect(normalized).toMatch(/^baf/);
    
    // Test with ipfs:// protocol
    const ipfsProtocol = 'ipfs://' + expectedCid;
    expect(normalizeCid(ipfsProtocol)).toEqual(expectedCid);
  });
});