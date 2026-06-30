const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '..', 'views', 'settings.ejs');
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);
lines.forEach((line, idx) => {
  if (line.includes('id="panel-') || line.includes("id='panel-") || line.includes('settings-panel')) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
  }
});
