const fs = require('fs');
const path = require('path');

function searchRefs(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      searchRefs(fullPath);
    } else if (file.endsWith('.js') || file.endsWith('.ejs')) {
      const content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('bikeModel') || content.includes('bike-model')) {
        console.log(`${path.relative(path.join(__dirname, '..'), fullPath)}`);
      }
    }
  }
}

console.log("--- Searching in controllers/ ---");
searchRefs(path.join(__dirname, '..', 'controllers'));
console.log("\n--- Searching in views/ ---");
searchRefs(path.join(__dirname, '..', 'views'));
