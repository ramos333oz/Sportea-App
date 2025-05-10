/**
 * This script outputs the correct URLs to configure in Supabase for emulator testing
 * Run with: node scripts/emulator-setup.js
 */

const os = require('os');
const PORT = '8083';

// Get all network interfaces
const networkInterfaces = os.networkInterfaces();
const addresses = [];

// Find all IP addresses
Object.keys(networkInterfaces).forEach(interfaceName => {
  networkInterfaces[interfaceName].forEach(iface => {
    // Skip non-IPv4 and internal addresses
    if (iface.family === 'IPv4' && !iface.internal) {
      addresses.push(iface.address);
    }
  });
});

// Clear console and print header
console.clear();
console.log('\n===============================================');
console.log('  SUPABASE CONFIGURATION URLS FOR EMULATORS');
console.log('===============================================\n');

console.log('Add these URLs to your Supabase project in the');
console.log('Authentication → URL Configuration section:\n');

console.log('SITE URL:');
console.log('---------');
console.log('Set ONE of these as your Site URL:');
console.log(`• exp://10.0.2.2:${PORT}   (Android Emulator)`);
console.log(`• exp://localhost:${PORT}  (iOS Simulator)`);

console.log('\nREDIRECT URLS:');
console.log('-------------');
console.log('Add ALL of these to your Redirect URLs:');
console.log(`• sportea://`);
console.log(`• exp://10.0.2.2:${PORT}`);
console.log(`• exp://127.0.0.1:${PORT}`);
console.log(`• exp://localhost:${PORT}`);

// Add detected IPs to the list
if (addresses.length > 0) {
  console.log('\nPHYSICAL DEVICE:');
  console.log('---------------');
  console.log('If testing on a physical device, also add:');
  addresses.forEach(address => {
    console.log(`• exp://${address}:${PORT}`);
  });
}

console.log('\n===============================================\n'); 