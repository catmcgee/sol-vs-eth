const fs = require('fs');
const path = require('path');

const EXAMPLES_DIR = path.join(__dirname, '..', 'examples');
const PUBLIC_DIR = path.join(__dirname, '..', 'frontend', 'public');
const EXAMPLES_PUBLIC_DIR = path.join(PUBLIC_DIR, 'examples');

function log(message) {
  console.log(`[build-examples] ${message}`);
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    log(`Created directory: ${dir}`);
  }
}

function findSolidityFile(ethDir) {
  const srcDir = path.join(ethDir, 'src');
  if (!fs.existsSync(srcDir)) return null;
  
  const files = fs.readdirSync(srcDir);
  const solFile = files.find(f => f.endsWith('.sol'));
  return solFile ? path.join(srcDir, solFile) : null;
}

function findRustFile(solDir) {
  const libPath = path.join(solDir, 'programs', 'sol', 'src', 'lib.rs');
  return fs.existsSync(libPath) ? libPath : null;
}

function validateExample(exampleName, exampleDir) {
  const errors = [];
  
  const infoPath = path.join(exampleDir, 'info.json');
  if (!fs.existsSync(infoPath)) {
    errors.push('Missing info.json');
  } else {
    try {
      const info = JSON.parse(fs.readFileSync(infoPath, 'utf8'));
      if (!info.summaries || !info.mappings) {
        errors.push('info.json missing required fields (summaries, mappings)');
      }
    } catch (e) {
      errors.push(`Invalid info.json: ${e.message}`);
    }
  }
  
  const ethDir = path.join(exampleDir, 'eth');
  if (!fs.existsSync(ethDir)) {
    errors.push('Missing eth/ directory');
  } else {
    const solFile = findSolidityFile(ethDir);
    if (!solFile) {
      errors.push('No .sol file found in eth/src/');
    }
  }
  
  const solDir = path.join(exampleDir, 'sol');
  if (!fs.existsSync(solDir)) {
    errors.push('Missing sol/ directory');
  } else {
    const rustFile = findRustFile(solDir);
    if (!rustFile) {
      errors.push('No lib.rs file found in sol/programs/sol/src/');
    }
  }
  
  return errors;
}

async function testExample(exampleName, exampleDir) {
  log(`Testing example: ${exampleName}`);
  
  const ethDir = path.join(exampleDir, 'eth');
  if (fs.existsSync(path.join(ethDir, 'foundry.toml'))) {
    try {
      const { execSync } = require('child_process');
      execSync('forge build', { cwd: ethDir, stdio: 'pipe' });
      log(`✓ Ethereum compilation successful for ${exampleName}`);
    } catch (e) {
      log(`⚠ Ethereum compilation failed for ${exampleName}: ${e.message}`);
    }
  }
  
  const solDir = path.join(exampleDir, 'sol');
  if (fs.existsSync(path.join(solDir, 'Anchor.toml'))) {
    try {
      const { execSync } = require('child_process');
      execSync('anchor build', { cwd: solDir, stdio: 'pipe' });
      log(`✓ Solana compilation successful for ${exampleName}`);
    } catch (e) {
      log(`⚠ Solana compilation failed for ${exampleName}: ${e.message}`);
    }
  }
}

function processExample(exampleName, exampleDir) {
  log(`Processing example: ${exampleName}`);
  
  const errors = validateExample(exampleName, exampleDir);
  if (errors.length > 0) {
    log(`❌ Validation failed for ${exampleName}:`);
    errors.forEach(error => log(`  - ${error}`));
    return null;
  }
  
  const examplePublicDir = path.join(EXAMPLES_PUBLIC_DIR, exampleName);
  ensureDir(examplePublicDir);
  
  const infoSrc = path.join(exampleDir, 'info.json');
  const infoDst = path.join(examplePublicDir, 'info.json');
  fs.copyFileSync(infoSrc, infoDst);
  
  const solFile = findSolidityFile(path.join(exampleDir, 'eth'));
  if (solFile) {
    const solFileName = path.basename(solFile);
    const solDst = path.join(examplePublicDir, solFileName);
    fs.copyFileSync(solFile, solDst);
    log(`  ✓ Copied ${solFileName}`);
  }
  
  const rustFile = findRustFile(path.join(exampleDir, 'sol'));
  if (rustFile) {
    const rustDst = path.join(examplePublicDir, 'lib.rs');
    fs.copyFileSync(rustFile, rustDst);
    log(`  ✓ Copied lib.rs`);
  }
  
  const info = JSON.parse(fs.readFileSync(infoSrc, 'utf8'));
  const solFileName = path.basename(solFile);
  
  return {
    name: exampleName,
    title: exampleName.charAt(0).toUpperCase() + exampleName.slice(1),
    solFile: solFileName,
    rustFile: 'lib.rs',
    ethSummary: info.summaries[solFileName] || 'Ethereum smart contract',
    solSummary: info.summaries['lib.rs'] || 'Solana program',
    order: Number.isFinite(info.order) ? info.order : Number.MAX_SAFE_INTEGER
  };
}

async function main() {
  log('Starting build process...');
  
  ensureDir(EXAMPLES_PUBLIC_DIR);
  
  if (!fs.existsSync(EXAMPLES_DIR)) {
    log(`❌ Examples directory not found: ${EXAMPLES_DIR}`);
    process.exit(1);
  }
  
  const examples = fs.readdirSync(EXAMPLES_DIR)
    .filter(name => {
      const exampleDir = path.join(EXAMPLES_DIR, name);
      return fs.statSync(exampleDir).isDirectory();
    });
  
  log(`Found ${examples.length} examples: ${examples.join(', ')}`);
  
  const processedExamples = [];
  for (const exampleName of examples) {
    const exampleDir = path.join(EXAMPLES_DIR, exampleName);
    
    if (process.argv.includes('--test')) {
      await testExample(exampleName, exampleDir);
    }
    
    const result = processExample(exampleName, exampleDir);
    if (result) {
      processedExamples.push(result);
      log(`✓ Successfully processed ${exampleName}`);
    }
  }
  
  processedExamples.sort((a, b) => {
      const ao = a.order ?? Number.MAX_SAFE_INTEGER;
      const bo = b.order ?? Number.MAX_SAFE_INTEGER;
      if (ao !== bo) return ao - bo;
      return a.name.localeCompare(b.name);
    });
  
    const manifest = {
      examples: processedExamples,
    }
  
  const manifestPath = path.join(EXAMPLES_PUBLIC_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  log(`✓ Created manifest with ${processedExamples.length} examples`);
  
  log('Build completed successfully!');
}

if (require.main === module) {
  main().catch(error => {
    console.error('Build failed:', error);
    process.exit(1);
  });
} 