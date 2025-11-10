pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/comparators.circom";
include "../node_modules/circomlib/circuits/sha256/sha256.circom";

/*
 * CarbonOffsetVerifier Circuit
 * 
 * Verifies that a carbon offset:
 * 1. Exists (commitment hash is valid)
 * 2. Meets minimum CO2 criteria (co2_tons >= min_co2_tons)
 * 3. Is within valid date range (timestamp >= min_timestamp && timestamp <= max_timestamp)
 * 4. Has been verified by authorized party (verifier_id matches)
 * 
 * Public inputs:
 * - commitment: Hash commitment of the offset data
 * - min_co2_tons: Minimum CO2 requirement in tons
 * - min_timestamp: Minimum valid timestamp
 * - max_timestamp: Maximum valid timestamp
 * - verifier_id: Authorized verifier identifier
 * 
 * Private inputs:
 * - project_id: Project identifier
 * - co2_tons: Actual CO2 amount in tons
 * - timestamp: Offset timestamp
 * - secret: Secret value used in commitment
 * - verifier_id_private: Private verifier identifier
 */

template CarbonOffsetVerifier() {
    // Public inputs
    signal input commitment;           // Public commitment hash
    signal input min_co2_tons;         // Minimum CO2 requirement
    signal input min_timestamp;        // Minimum valid timestamp
    signal input max_timestamp;        // Maximum valid timestamp
    signal input verifier_id;         // Authorized verifier ID
    
    // Private inputs
    signal input project_id;          // Project identifier (private)
    signal input co2_tons;             // CO2 amount in tons (private)
    signal input timestamp;            // Timestamp (private)
    signal input secret;               // Secret for commitment (private)
    signal input verifier_id_private; // Private verifier ID (private)
    
    // Verify commitment matches
    component hasher = Sha256(4);  // Hash 4 inputs: project_id, co2_tons, timestamp, secret
    
    // Convert inputs to bits for hashing
    component project_id_bits = Num2Bits(256);
    component co2_tons_bits = Num2Bits(64);
    component timestamp_bits = Num2Bits(64);
    component secret_bits = Num2Bits(256);
    
    // Convert project_id to bits
    project_id_bits.in <== project_id;
    
    // Convert co2_tons to bits (assuming max 2^64 - 1)
    co2_tons_bits.in <== co2_tons;
    
    // Convert timestamp to bits
    timestamp_bits.in <== timestamp;
    
    // Convert secret to bits
    secret_bits.in <== secret;
    
    // Prepare hash inputs (concatenate bits)
    for (var i = 0; i < 256; i++) {
        hasher.in[i] <== project_id_bits.out[i];
    }
    for (var i = 0; i < 64; i++) {
        hasher.in[256 + i] <== co2_tons_bits.out[i];
    }
    for (var i = 0; i < 64; i++) {
        hasher.in[256 + 64 + i] <== timestamp_bits.out[i];
    }
    for (var i = 0; i < 256; i++) {
        hasher.in[256 + 64 + 64 + i] <== secret_bits.out[i];
    }
    
    // Verify commitment matches hash
    component commitment_check = IsEqual();
    commitment_check.in[0] <== commitment;
    commitment_check.in[1] <== hasher.out[0];  // Use first 256 bits of hash
    
    // Verify CO2 meets minimum requirement
    component co2_comparator = GreaterThan(64);
    co2_comparator.in[0] <== co2_tons;
    co2_comparator.in[1] <== min_co2_tons;
    
    // Verify timestamp is within range
    component timestamp_min_check = GreaterEqThan(64);
    timestamp_min_check.in[0] <== timestamp;
    timestamp_min_check.in[1] <== min_timestamp;
    
    component timestamp_max_check = LessEqThan(64);
    timestamp_max_check.in[0] <== timestamp;
    timestamp_max_check.in[1] <== max_timestamp;
    
    // Verify verifier ID matches
    component verifier_check = IsEqual();
    verifier_check.in[0] <== verifier_id;
    verifier_check.in[1] <== verifier_id_private;
    
    // All checks must pass
    signal output valid;
    valid <== commitment_check.out * co2_comparator.out * timestamp_min_check.out * timestamp_max_check.out * verifier_check.out;
}

// Main component
component main = CarbonOffsetVerifier();

