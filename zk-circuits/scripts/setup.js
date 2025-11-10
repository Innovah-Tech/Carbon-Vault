/**
 * Setup script for generating proving key and verification key
 */
const snarkjs = require("snarkjs");
const fs = require("fs");
const path = require("path");

async function setup() {
    console.log("Setting up ZK circuit...");
    
    const buildDir = path.join(__dirname, "../build");
    const circuitWasm = path.join(buildDir, "CarbonOffsetVerifier.wasm");
    const circuitR1cs = path.join(buildDir, "CarbonOffsetVerifier.r1cs");
    
    // Check if circuit files exist
    if (!fs.existsSync(circuitWasm) || !fs.existsSync(circuitR1cs)) {
        console.error("Circuit files not found. Please compile the circuit first:");
        console.error("  npm run compile");
        process.exit(1);
    }
    
    console.log("Generating proving key and verification key...");
    console.log("This may take a few minutes...");
    
    try {
        // Generate proving key and verification key
        const { pkey, vkey } = await snarkjs.groth16.setup(
            fs.readFileSync(circuitR1cs)
        );
        
        // Save proving key
        const pkeyPath = path.join(buildDir, "proving_key.json");
        fs.writeFileSync(pkeyPath, JSON.stringify(pkey, null, 2));
        console.log("✓ Proving key saved to:", pkeyPath);
        
        // Save verification key
        const vkeyPath = path.join(buildDir, "verification_key.json");
        fs.writeFileSync(vkeyPath, JSON.stringify(vkey, null, 2));
        console.log("✓ Verification key saved to:", vkeyPath);
        
        // Generate verifier contract
        const verifierCode = await snarkjs.groth16.exportSolidityVerifier(vkey);
        const verifierPath = path.join(buildDir, "Verifier.sol");
        fs.writeFileSync(verifierPath, verifierCode);
        console.log("✓ Verifier contract saved to:", verifierPath);
        
        console.log("\nSetup complete!");
        console.log("You can now generate proofs using: npm run generate-proof");
        
    } catch (error) {
        console.error("Error during setup:", error);
        process.exit(1);
    }
}

setup().catch(console.error);

