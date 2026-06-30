const fs = require('fs');
const path = require('path');

const bikeNames = [
  'Pan America',
  'Street Glide',
  'Nightster',
  'Road Glide',
  'Low Rider',
  'Iron 883',
  'Fat Boy',
  'Sportster'
];

function scanDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      scanDir(fullPath);
    } else if (file.endsWith('.ejs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        for (const name of bikeNames) {
          if (line.includes(name) && !line.includes('bikeModel') && !line.includes('inventory') && !line.includes('locals')) {
            console.log(`${path.relative(path.join(__dirname, '..'), fullPath)}:L${idx+1}: ${line.trim()}`);
            break;
          }
        }
      });
    }
  }
}

scanDir(path.join(__dirname, '..', 'views'));
console.log("Scan complete.");
