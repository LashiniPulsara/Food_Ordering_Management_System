const fs = require('fs');
const os = require('os');
const path = require('path');

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    const lowerName = name.toLowerCase();
    const isVirtual = lowerName.includes('vethernet') ||
                      lowerName.includes('wsl') ||
                      lowerName.includes('virtual') ||
                      lowerName.includes('vmware') ||
                      lowerName.includes('hyper-v') ||
                      lowerName.includes('bridge') ||
                      lowerName.includes('tunnel') ||
                      lowerName.includes('loopback') ||
                      lowerName.includes('isatap') ||
                      lowerName.includes('teredo') ||
                      lowerName.includes('hamachi');

    if (isVirtual) {
      continue;
    }

    for (const iface of interfaces[name]) {
      if (iface.family !== 'IPv4' || iface.internal) {
        continue;
      }

      const addr = iface.address;
      if (addr.startsWith('169.') || addr.startsWith('127.')) {
        continue;
      }
      if (addr.startsWith('192.168.56.') || addr.startsWith('192.168.137.') || addr.startsWith('10.0.0.')) {
        continue;
      }

      if (lowerName.includes('wi-fi') || lowerName.includes('wifi') || lowerName.includes('wlan') || lowerName.includes('ethernet')) {
        return addr;
      }

      candidates.push(addr);
    }
  }

  if (candidates.length > 0) {
    return candidates[0];
  }

  return 'localhost';
}

const ip = getLocalIp();
const envPath = path.join(__dirname, '..', '.env');
const apiUrl = `http://${ip}:5000`;

let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

const regex = /^#?\s*EXPO_PUBLIC_API_BASE_URL=.*$/m;
if (regex.test(envContent)) {
  envContent = envContent.replace(regex, `EXPO_PUBLIC_API_BASE_URL=${apiUrl}`);
} else {
  envContent += `\nEXPO_PUBLIC_API_BASE_URL=${apiUrl}\n`;
}

fs.writeFileSync(envPath, envContent.trim() + '\n');
console.log(`\n✔ Successfully updated .env with API Base URL: ${apiUrl}\n`);
