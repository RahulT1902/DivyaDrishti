const fs = require('fs');
const path = require('path');

const targetFilePath = path.join(__dirname, '../src/app/api/predictions/analyze/route.ts');
const content = fs.readFileSync(targetFilePath, 'utf8');

const regex = /interface LifeDomainCard {/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`Found "interface LifeDomainCard {" at index ${match.index}`);
  const surrounding = content.substring(match.index - 100, match.index + 200);
  console.log('Surrounding context:\n', surrounding);
  console.log('----------------------------------------------------');
}
