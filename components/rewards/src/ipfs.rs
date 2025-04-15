use anyhow::Result;
use serde::Deserialize;
use std::{
    fs::File,
    io::{Read, Write},
};
use wstd::http::{IntoBody, Request};
use wstd::io::AsyncRead;

use cid::Cid;
use multibase::decode;

/// Uploads a file using multipart request to IPFS
async fn upload_to_ipfs(file_path: &str, ipfs_url: &str, api_key: &str) -> Result<Cid> {
    eprintln!("Uploading file to IPFS: {}", file_path);

    let mut file = File::open(file_path)?;
    let mut file_bytes = Vec::new();
    file.read_to_end(&mut file_bytes)?;

    // define multipart request boundary
    let boundary = "----RustBoundary";

    // construct the body
    let body = format!(
        "--{}\r\n\
        Content-Disposition: form-data; name=\"file\"\r\n\
        Content-Type: application/octet-stream\r\n\r\n",
        boundary
    );

    let mut request_body = body.into_bytes();
    request_body.extend_from_slice(&file_bytes);
    request_body.extend_from_slice(format!("\r\n--{}--\r\n", boundary).as_bytes());

    let request = Request::post(ipfs_url)
        .header("Authorization", &format!("Bearer {}", api_key))
        .header("Content-Type", &format!("multipart/form-data; boundary={}", boundary))
        .body(request_body.into_body())?;

    let mut response = wstd::http::Client::new().send(request).await?;

    if response.status().is_success() {
        let mut body_buf = Vec::new();
        response.body_mut().read_to_end(&mut body_buf).await?;

        // Log the raw response for debugging
        let response_str = std::str::from_utf8(&body_buf)
            .map_err(|e| anyhow::anyhow!("Failed to convert response to string: {}", e))?;
        eprintln!("IPFS API Response: {}", response_str);

        // Parse using Lighthouse's response format (capitalized fields)
        #[allow(non_snake_case)]
        #[derive(Debug, Deserialize)]
        struct LighthouseResponse {
            Hash: String,
        }

        let hash = match serde_json::from_slice::<LighthouseResponse>(&body_buf) {
            Ok(resp) => resp.Hash,
            Err(_) => {
                return Err(anyhow::anyhow!(
                    "Could not extract hash from response: {}",
                    response_str
                ));
            }
        };

        // Return the hash directly
        decode_ipfs_cid(&hash).map_err(|e| anyhow::anyhow!("Failed to decode IPFS CID: {}", e))
    } else {
        let mut body_buf = Vec::new();
        response.body_mut().read_to_end(&mut body_buf).await?;
        let error_body = std::str::from_utf8(&body_buf).unwrap_or("unable to read error body");
        Err(anyhow::anyhow!(
            "Failed to upload to IPFS. Status: {:?}, Body: {}",
            response.status(),
            error_body
        ))
    }
}

/// Uploads JSON data directly to IPFS and returns the CID
pub async fn upload_json_to_ipfs(json_data: &str, ipfs_url: &str, api_key: &str) -> Result<Cid> {
    // Create a temporary file to store the JSON data
    let temp_path = "/tmp/ipfs.json";

    eprintln!("Temp path {}", temp_path);

    // Ensure the /tmp directory exists
    std::fs::create_dir_all("/tmp")
        .map_err(|e| anyhow::anyhow!("Failed to create /tmp directory: {}", e))?;

    // Write JSON to temporary file
    let mut file = File::create(temp_path)?;
    file.write_all(json_data.as_bytes())?;

    // Upload the file
    let hash = upload_to_ipfs(temp_path, ipfs_url, api_key).await?;

    // Clean up the temporary file
    delete_file(temp_path)?;

    // Return the IPFS URI
    Ok(hash)
}

/// Delete a file from the filesystem
pub fn delete_file(file_path: &str) -> Result<()> {
    std::fs::remove_file(file_path)?;
    println!("File deleted successfully: {}", file_path);
    Ok(())
}

pub fn decode_ipfs_cid(cid_str: &str) -> Result<Cid, String> {
    // Check if the string is a v0 CID (starts with "Qm" and has length 46).
    if cid_str.starts_with("Qm") && cid_str.len() == 46 {
        // Decode as base58
        let decoded = bs58::decode(cid_str).into_vec().map_err(|e| e.to_string())?;
        // Attempt to construct a Cid from the decoded bytes
        let cid = Cid::try_from(decoded).map_err(|e| e.to_string())?;
        Ok(cid)
    } else {
        // Handle v1 and other CIDs with multibase decoding
        let (_base, decoded) = decode(cid_str).map_err(|e| e.to_string())?;

        // Attempt to construct a Cid from the decoded bytes
        let cid = Cid::try_from(decoded).map_err(|e| e.to_string())?;
        Ok(cid)
    }
}
