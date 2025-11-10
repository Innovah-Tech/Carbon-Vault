/**
 * Test circuit with sample data
 */
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");

// Helper function to calculate SHA256 hash
function sha256(input) {
    return createHash("sha256").update(input).digest("hex");
}

// Helper function to convert hex to BigInt
function hexToBigInt(hex) {
    return BigInt("0x" + hex);
}

// Helper function to create commitment
function createCommitment(projectId, co2Tons, timestamp, secret) {
    const input = `${projectId}_${co2Tons}_${timestamp}_${secret}`;
    const hash = sha256(input);
    // Take first 256 bits (64 hex chars)
    return hexToBigInt(hash.substring(0, 64));
}

async function testCircuit() {
    console.log("Testing CarbonOffsetVerifier circuit...\n");
    
    const buildDir = path.join(__dirname, "../build");
    const circuitWasm = path.join(buildDir, "CarbonOffsetVerifier.wasm");
    const provingKeyPath = path.join(buildDir, "proving_key.json");
    
    // Check if files exist
    if (!fs.existsSync(circuitWasm)) {
        console.error("Circuit WASM not found. Please compile first:");
        console.error("  npm run compile");
        process.exit(1);
    }
    
    if (!fs.existsSync(provingKeyPath)) {
        console.error("Proving key not found. Please run setup first:");
        console.error("  npm run setup");
        process.exit(1);
    }
    
    // Sample test data
    console.log("Using sample test data:");
    const projectId = BigInt("1234567890123456789012345678901234567890");
    const co2Tons = BigInt("100"); // 100 tons CO2
    const timestamp = BigInt(Math.floor(Date.now() / 1000)); // Current timestamp
    const secret = BigInt("9876543210987654321098765432109876543210");
    const verifierId = BigInt("1"); // Authorized verifier ID
    
    // Create commitment
    const commitment = createCommitment(
        projectId.toString(),
        co2Tons.toString(),
        timestamp.toString(),
        secret.toString()
    );
    
    // Public inputs
    const minCo2Tons = BigInt("50"); // Minimum 50 tons
    const minTimestamp = BigInt(timestamp - 86400 * 30); // 30 days ago
    const maxTimestamp = BigInt(timestamp + 86400 * 30); // 30 days from now
    
    console.log("  Project ID:", projectId.toString());
    console.log("  CO2 Tons:", co2Tons.toString());
    console.log("  Timestamp:", timestamp.toString());
    console.log("  Commitment:", commitment.toString());
    console.log("  Min CO2 Tons:", minCo2Tons.toString());
    console.log("  Verifier ID:", verifierId.toString());
    console.log();
    
    // Prepare inputs
    const input = {
        // Public inputs
        commitment: commitment.toString(),
        min_co2_tons: minCo2Tons.toString(),
        min_timestamp: minTimestamp.toString(),
        max_timestamp: maxTimestamp.toString(),
        verifier_id: verifierId.toString(),
        
        // Private inputs
        project_id: projectId.toString(),
        co2_tons: co2Tons.toString(),
        timestamp: timestamp.toString(),
        secret: secret.toString(),
        verifier_id_private: verifierId.toString()
    };
    
    console.log("Generating proof...");
    
    try {
        // Load proving key
        const provingKey = JSON.parse(fs.readFileSync(provingKeyPath, "utf8"));
        
        // Generate proof
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            circuitWasm,
            provingKey
        );
        
        console.log("✓ Proof generated successfully!\n");
        console.log("Public signals:", publicSignals);
        console.log();
        
        // Verify proof
        console.log("Verifying proof...");
        const verificationKeyPath = path.join(buildDir, "verification_key.json");
        const verificationKey = JSON.parse(fs.readFileSync(verificationKeyPath, "utf8"));
        
        const verified = await snarkjs.groth16.verify(
            verificationKey,
            publicSignals,
            proof
        );
        
        if (verified) {
            console.log("✓ Proof verified successfully!");
        } else {
            console.log("✗ Proof verification failed!");
            process.exit(1);
        }
        
        // Save proof and public signals for later use
        const proofPath = path.join(buildDir, "test_proof.json");
        fs.writeFileSync(proofPath, JSON.stringify({
            proof,
            publicSignals
        }, null, 2));
        console.log("✓ Proof saved to:", proofPath);
        
    } catch (error) {
        console.error("Error generating proof:", error);
        process.exit(1);
    }
}

testCircuit().catch(console.error);

