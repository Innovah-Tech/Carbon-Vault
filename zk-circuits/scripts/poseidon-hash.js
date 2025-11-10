/**
 * Helper script to calculate Poseidon hash for commitment
 * This matches the hash used in the Circom circuit
 */
const { buildPoseidon } = require("circomlibjs");

async function poseidonHash(inputs) {
    const poseidon = await buildPoseidon();
    const hash = poseidon(inputs);
    return poseidon.F.toString(hash);
}

// Export for use in other scripts
module.exports = { poseidonHash };

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);
    if (args.length < 4) {
        console.log("Usage: node poseidon-hash.js <project_id> <co2_tons> <timestamp> <secret>");
        process.exit(1);
    }
    
    const inputs = args.map(arg => BigInt(arg));
    poseidonHash(inputs)
        .then(hash => {
            console.log("Poseidon hash:", hash);
        })
        .catch(console.error);
}

