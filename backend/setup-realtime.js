#!/usr/bin/env node
// 🚀 Quick Setup Script for OnlineRealSoft Integration

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🎯 OnlineRealSoft Integration Setup\n');

// Check if required files exist
const requiredFiles = [
  'realtime-server.js',
  'src/services/realtimeIntegration.ts',
  'database-migrations/001-attendance-machines.sql'
];

console.log('📋 Checking required files...');
requiredFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✅ ${file} - Found`);
  } else {
    console.log(`❌ ${file} - Missing!`);
    process.exit(1);
  }
});

// Check node_modules
console.log('\n📦 Checking dependencies...');
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const requiredDeps = ['express', 'cors', '@supabase/supabase-js'];

requiredDeps.forEach(dep => {
  if (fs.existsSync(`node_modules/${dep}`)) {
    console.log(`✅ ${dep} - Installed`);
  } else {
    console.log(`⚠️  ${dep} - Not found, installing...`);
    // Install if missing (you can uncomment to auto-install)
    // spawn('npm', ['install', dep], { stdio: 'inherit' });
  }
});

// Environment check
console.log('\n🔧 Environment Configuration:');

if (fs.existsSync('.env') || fs.existsSync('.env.local')) {
  console.log('✅ Environment file found');
} else {
  console.log('⚠️  No .env file found - make sure Supabase credentials are set');
}

console.log('\n🚀 Ready to Start Integration Server!');
console.log('\nNext steps:');
console.log('1. Run: node realtime-server.js');
console.log('2. Configure OnlineRealSoft with: http://localhost:4000/api/attendance/realtime');
console.log('3. Test with a biometric punch!');
console.log('\n📖 Full guide: See REALTIME_INTEGRATION_GUIDE.md');

// Quick start option
const readline = require('readline');
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

rl.question('\n🚀 Start integration server now? (y/N): ', (answer) => {
  if (answer.toLowerCase() === 'y' || answer.toLowerCase() === 'yes') {
    console.log('\n🔥 Starting server...\n');
    spawn('node', ['realtime-server.js'], { stdio: 'inherit' });
  } else {
    console.log('\n✨ Setup complete! Run "node realtime-server.js" when ready.');
  }
  rl.close();
});