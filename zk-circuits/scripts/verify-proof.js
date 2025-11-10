/**
 * Verify ZK proof
 */
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function verifyProof(proofPath) {
    console.log("Verifying ZK proof...\n");
    
    const buildDir = path.join(__dirname, "../build");
    const verificationKeyPath = path.join(buildDir, "verification_key.json");
    
    // Check if files exist
    if (!fs.existsSync(verificationKeyPath)) {
        console.error("Verification key not found. Please run setup first:");
        console.error("  npm run setup");
        process.exit(1);
    }
    
    // Load proof
    if (!fs.existsSync(proofPath)) {
        console.error("Proof file not found:", proofPath);
        process.exit(1);
    }
    
    const proofData = JSON.parse(fs.readFileSync(proofPath, "utf8"));
    const { proof, publicSignals } = proofData;
    
    console.log("Proof data:");
    console.log("  Public signals:", publicSignals.length);
    console.log();
    
    try {
        // Load verification key
        const verificationKey = JSON.parse(fs.readFileSync(verificationKeyPath, "utf8"));
        
        // Verify proof
        console.log("Verifying proof...");
        const verified = await snarkjs.groth16.verify(
            verificationKey,
            publicSignals,
            proof
        );
        
        if (verified) {
            console.log("✓ Proof verified successfully!");
            console.log("\nPublic signals:");
            publicSignals.forEach((signal, index) => {
                console.log(`  [${index}]: ${signal}`);
            });
            return true;
        } else {
            console.log("✗ Proof verification failed!");
            return false;
        }
        
    } catch (error) {
        console.error("Error verifying proof:", error);
        throw error;
    }
}

// Main execution
if (require.main === module) {
    const args = process.argv.slice(2);
    const proofPath = args[0] || path.join(__dirname, "../build/proof.json");
    
    verifyProof(proofPath)
        .then((verified) => {
            process.exit(verified ? 0 : 1);
        })
        .catch((error) => {
            console.error("Error:", error);
            process.exit(1);
        });
}

module.exports = { verifyProof };

