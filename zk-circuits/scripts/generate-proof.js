/**
 * Generate ZK proof for carbon offset verification
 */
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");
const { createHash } = require("crypto");

// Helper function to create commitment using Poseidon hash
// For testing, we'll use a simple hash function
// In production, this should match the Poseidon hash used in the circuit
function createCommitment(projectId, co2Tons, timestamp, secret) {
    // Simple hash for testing - in production, use Poseidon hash
    const input = `${projectId}_${co2Tons}_${timestamp}_${secret}`;
    const hash = createHash("sha256").update(input).digest("hex");
    // Take first 64 hex chars (256 bits)
    return BigInt("0x" + hash.substring(0, 64));
}

async function generateProof(inputData) {
    console.log("Generating ZK proof for carbon offset verification...\n");
    
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
    
    // Parse input data
    const projectId = BigInt(inputData.project_id || "0");
    const co2Tons = BigInt(inputData.co2_tons || "0");
    const timestamp = BigInt(inputData.timestamp || Math.floor(Date.now() / 1000));
    const secret = BigInt(inputData.secret || "0");
    const verifierId = BigInt(inputData.verifier_id || "1");
    
    // Create commitment
    const commitment = createCommitment(
        projectId.toString(),
        co2Tons.toString(),
        timestamp.toString(),
        secret.toString()
    );
    
    // Public inputs
    const minCo2Tons = BigInt(inputData.min_co2_tons || "0");
    const minTimestamp = BigInt(inputData.min_timestamp || "0");
    const maxTimestamp = BigInt(inputData.max_timestamp || "9999999999");
    
    console.log("Input data:");
    console.log("  Project ID:", projectId.toString());
    console.log("  CO2 Tons:", co2Tons.toString());
    console.log("  Timestamp:", timestamp.toString());
    console.log("  Commitment:", commitment.toString());
    console.log("  Min CO2 Tons:", minCo2Tons.toString());
    console.log("  Verifier ID:", verifierId.toString());
    console.log();
    
    // Prepare circuit inputs
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
    
    try {
        // Load proving key
        const provingKey = JSON.parse(fs.readFileSync(provingKeyPath, "utf8"));
        
        // Generate proof
        console.log("Generating proof...");
        const { proof, publicSignals } = await snarkjs.groth16.fullProve(
            input,
            circuitWasm,
            provingKey
        );
        
        console.log("✓ Proof generated successfully!\n");
        
        // Save proof
        const proofData = {
            proof,
            publicSignals,
            input: {
                commitment: commitment.toString(),
                min_co2_tons: minCo2Tons.toString(),
                min_timestamp: minTimestamp.toString(),
                max_timestamp: maxTimestamp.toString(),
                verifier_id: verifierId.toString()
            }
        };
        
        const proofPath = path.join(buildDir, "proof.json");
        fs.writeFileSync(proofPath, JSON.stringify(proofData, null, 2));
        console.log("✓ Proof saved to:", proofPath);
        
        return proofData;
        
    } catch (error) {
        console.error("Error generating proof:", error);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    // Check for input file
    const args = process.argv.slice(2);
    let inputData = {};
    
    if (args.length > 0) {
        const inputFile = args[0];
        if (fs.existsSync(inputFile)) {
            inputData = JSON.parse(fs.readFileSync(inputFile, "utf8"));
        } else {
            console.error("Input file not found:", inputFile);
            process.exit(1);
        }
    } else {
        // Use default test data
        inputData = {
            project_id: "1234567890123456789012345678901234567890",
            co2_tons: "100",
            timestamp: Math.floor(Date.now() / 1000).toString(),
            secret: "9876543210987654321098765432109876543210",
            verifier_id: "1",
            min_co2_tons: "50",
            min_timestamp: (Math.floor(Date.now() / 1000) - 86400 * 30).toString(),
            max_timestamp: (Math.floor(Date.now() / 1000) + 86400 * 30).toString()
        };
    }
    
    generateProof(inputData)
        .then(() => {
            console.log("\nProof generation complete!");
        })
        .catch((error) => {
            console.error("Error:", error);
            process.exit(1);
        });
}

module.exports = { generateProof };

