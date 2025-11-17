const hre = require("hardhat");
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const deployedAddresses = require("../deployed-addresses.json");
const { mintCVT } = require("./mint-cvt");

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
const DEFAULT_PIPELINE_FILE = path.join(__dirname, "..", "data-pipeline", "data", "carbon_data.json");

function parseArgs() {
  const args = process.argv.slice(2);
  const config = {
    file: DEFAULT_PIPELINE_FILE,
    limit: 3,
    minCo2: 0,
    runPipeline: false,
    dryRun: false,
    recipient: null,
    validator: ZERO_ADDRESS,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    switch (arg) {
      case "--file":
        config.file = args[++i];
        break;
      case "--limit":
        config.limit = parseInt(args[++i], 10);
        break;
      case "--min-co2":
        config.minCo2 = parseFloat(args[++i]);
        break;
      case "--run-pipeline":
        config.runPipeline = true;
        break;
      case "--dry-run":
        config.dryRun = true;
        break;
      case "--recipient":
        config.recipient = args[++i];
        break;
      case "--validator":
        config.validator = args[++i];
        break;
      case "--help":
      case "-h":
        config.help = true;
        break;
      default:
        console.warn(`⚠️  Unknown option: ${arg}`);
        break;
    }
  }

  return config;
}

function showHelp() {
  console.log(`
╔════════════════════════════════════════════════════════════════╗
║    Pipeline → Proof → Mint Automation (Mantle Sepolia)        ║
╚════════════════════════════════════════════════════════════════╝

Usage:
  npx hardhat run scripts/mint-from-pipeline.js --network mantleSepolia [options]

Options:
  --run-pipeline        Run data-pipeline/run_pipeline.py before minting
  --file <path>         Custom pipeline JSON (default: data-pipeline/data/carbon_data.json)
  --limit <number>      Maximum records to mint (default: 3)
  --min-co2 <tons>      Ignore records below this CO₂ tonnage (default: 0)
  --recipient <addr>    Override recipient (default: signer)
  --validator <addr>    Validator address (default: zero address)
  --dry-run             Preview actions without sending transactions
  --help, -h            Show this help message
`);
}

function runPipeline() {
  console.log("\n🌀 Running data pipeline...");
  const result = spawnSync("python3", ["data-pipeline/run_pipeline.py"], {
    cwd: path.join(__dirname, ".."),
    stdio: "inherit",
  });

  if (result.status !== 0) {
    throw new Error("Data pipeline execution failed");
  }
}

function loadPipelineRecords(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Pipeline file not found: ${filePath}`);
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const parsed = JSON.parse(raw);
  return Array.isArray(parsed?.data) ? parsed.data : [];
}

function normalizeRecord(record, index) {
  const co2 = Number(record?.co2_tons || record?.co2 || 0);
  const projectId =
    record?.project_id ||
    record?.project ||
    record?.source?.toString()?.toUpperCase() ||
    `PIPELINE-${(record?.location?.city || "PROJECT").toString().replace(/\s+/g, "-")}-${index + 1}`;

  const timestamp =
    record?.timestamp && !Number.isNaN(Date.parse(record.timestamp))
      ? Math.floor(new Date(record.timestamp).getTime() / 1000)
      : undefined;

  return {
    projectId,
    co2,
    timestamp,
  };
}

async function main() {
  const config = parseArgs();

  if (config.help) {
    showHelp();
    return;
  }

  if (config.runPipeline) {
    runPipeline();
  }

  const filePath = path.resolve(config.file);
  const records = loadPipelineRecords(filePath)
    .map((record, idx) => ({ original: record, meta: normalizeRecord(record, idx) }))
    .filter(({ meta }) => meta.co2 >= config.minCo2);

  if (records.length === 0) {
    console.log("\n⚠️  No pipeline records available for minting. Run the pipeline or adjust filters.");
    return;
  }

  const [signer] = await hre.ethers.getSigners();
  const CVTMinting = await hre.ethers.getContractFactory("CVTMinting");
  const cvtContract = CVTMinting.attach(deployedAddresses.contracts.CVTMinting);

  const code = await hre.ethers.provider.getCode(deployedAddresses.contracts.CVTMinting);
  if (code === "0x") {
    throw new Error("CVTMinting contract not found. Check deployed-addresses.json");
  }

  console.log("\n📦 Pipeline data loaded:");
  console.log(`  File: ${filePath}`);
  console.log(`  Records found: ${records.length}`);
  console.log(`  Limit: ${config.limit}`);
  console.log(`  Min CO₂ filter: ${config.minCo2} tons`);
  console.log(`  Dry run: ${config.dryRun ? "yes" : "no"}`);
  console.log(`  Recipient: ${config.recipient || signer.address}`);

  let minted = 0;
  const limit = Math.max(0, config.limit || records.length);
  const slice = records.slice(0, limit);

  for (let i = 0; i < slice.length; i++) {
    const { original, meta } = slice[i];
    const amountStr = meta.co2.toString();
    const mintConfig = {
      amount: amountStr,
      recipient: config.recipient || signer.address,
      projectId: meta.projectId,
      co2Tons: amountStr,
      validator: config.validator || ZERO_ADDRESS,
      timestamp: meta.timestamp,
    };

    console.log("\n" + "=".repeat(60));
    console.log(`🔄 Mint ${i + 1}/${slice.length}`);
    console.log("=".repeat(60));
    console.log(`Project: ${meta.projectId}`);
    console.log(`CO₂ Tons: ${meta.co2}`);
    console.log(`Timestamp: ${meta.timestamp ? new Date(meta.timestamp * 1000).toISOString() : "auto"}`);

    if (config.dryRun) {
      console.log("Dry run enabled – skipping on-chain mint.");
      continue;
    }

    const success = await mintCVT(cvtContract, mintConfig, signer);
    if (success) {
      minted += 1;
    } else {
      console.log("⚠️  Mint failed for this record. Continuing.");
    }

    if (i < slice.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("📊 Pipeline Mint Summary");
  console.log("=".repeat(60));
  console.log(`Records considered: ${slice.length}`);
  console.log(`Successful mints: ${minted}`);
  console.log(`Skipped (dry-run or failures): ${slice.length - minted}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("\n❌ Automation failed:");
    console.error(error);
    process.exit(1);
  });

