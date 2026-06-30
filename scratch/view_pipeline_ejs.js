const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '..', 'views', 'pipeline.ejs');
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, idx) => {
  if (line.includes('bikeModel') || line.includes('select') || line.includes('color') || line.includes('Color')) {
    console.log(`L${idx+1}: ${line.trim()}`);
  }
});
