const fs = require('fs');
const path = require('path');

function find(dir) {
  try {
    for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
      const p = path.join(dir, f.name);
      if (f.name === 'libquery_engine-rhel-openssl-3.0.x.so.node') {
        return p;
      }
      if (f.isDirectory() && (f.name.includes('prisma') || f.name.includes('node_modules') || f.name.includes('.pnpm') || f.name === 'client')) {
        const res = find(p);
        if (res) return res;
      }
    }
  } catch (e) {}
  return null;
}

const rootNodeModules = path.resolve(__dirname, '../../../node_modules');
console.log('Postbuild: Searching for Prisma query engine (rhel-openssl-3.0.x)...');
const engineSource = find(rootNodeModules);

if (engineSource) {
  console.log('Postbuild: Found query engine at:', engineSource);
  const targets = [
    path.join(__dirname, '../.next/server/app/api/v1/[...slug]'),
    path.join(__dirname, '../.next/server/app/api/v1'),
    path.join(__dirname, '../.next/server/app/.prisma/client'),
    path.join(__dirname, '../.next/server'),
  ];

  for (const targetDir of targets) {
    fs.mkdirSync(targetDir, { recursive: true });
    const dest = path.join(targetDir, 'libquery_engine-rhel-openssl-3.0.x.so.node');
    fs.copyFileSync(engineSource, dest);
    console.log('Postbuild: Copied query engine to:', dest);
  }

  // Update NFT JSON
  const nftPath = path.join(__dirname, '../.next/server/app/api/v1/[...slug]/route.js.nft.json');
  if (fs.existsSync(nftPath)) {
    try {
      const nftData = JSON.parse(fs.readFileSync(nftPath, 'utf8'));
      if (!nftData.files) nftData.files = [];
      const relativeAdditions = [
        './libquery_engine-rhel-openssl-3.0.x.so.node',
        '../libquery_engine-rhel-openssl-3.0.x.so.node',
        '../../.prisma/client/libquery_engine-rhel-openssl-3.0.x.so.node',
        '../../../libquery_engine-rhel-openssl-3.0.x.so.node',
      ];
      for (const rel of relativeAdditions) {
        if (!nftData.files.includes(rel)) {
          nftData.files.push(rel);
        }
      }
      fs.writeFileSync(nftPath, JSON.stringify(nftData, null, 2));
      console.log('Postbuild: Updated NFT JSON trace for route.js');
    } catch (e) {
      console.error('Postbuild: Failed to update NFT JSON:', e.message);
    }
  }
} else {
  console.warn('Postbuild: Warning - libquery_engine-rhel-openssl-3.0.x.so.node not found!');
}
