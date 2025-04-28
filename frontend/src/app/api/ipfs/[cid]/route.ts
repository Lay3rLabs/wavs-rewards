import { NextRequest, NextResponse } from 'next/server';

/**
 * API handler to proxy requests to IPFS gateways
 * This helps avoid CORS issues when fetching IPFS content directly from browsers
 * 
 * @param request The incoming request
 * @param params Route parameters containing the CID
 * @returns A proxied response from the IPFS gateway
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { cid: string } }
) {
  const { cid } = params;
  
  // Set default gateway from env or use fallback
  const gateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY_URL;
  if (!gateway) {
    return NextResponse.json(
      { error: 'IPFS gateway URL is not set' },
      { status: 500 }
    );
  }
  
  try {
    // Make sure CID is valid
    if (!cid || cid.length < 10) {
      return NextResponse.json(
        { error: 'Invalid CID' },
        { status: 400 }
      );
    }

    // Construct the IPFS URL
    const ipfsUrl = `${gateway}${cid}`;
    
    console.log(`Proxying IPFS request for CID: ${cid} to ${ipfsUrl}`);
    
    // Fetch data from IPFS gateway
    const response = await fetch(ipfsUrl, {
      headers: {
        // Pass origin headers appropriate for gateway
        'User-Agent': 'Mozilla/5.0 Next.js IPFS Proxy',
      },
    });

    // Check if the response is ok
    if (!response.ok) {
      console.error(`Error fetching from IPFS: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        { error: `IPFS gateway returned ${response.status}` },
        { status: response.status }
      );
    }

    // Get content type from response
    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    
    // Get the response body as array buffer
    const data = await response.arrayBuffer();
    
    // Create and return response with proper headers
    return new NextResponse(data, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable', // Long cache for immutable IPFS content
        'Access-Control-Allow-Origin': '*', // Allow cross-origin requests
      },
    });
  } catch (error) {
    console.error('Error proxying IPFS content:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from IPFS gateway' },
      { status: 500 }
    );
  }
}