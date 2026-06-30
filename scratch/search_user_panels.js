const fs = require('fs');
const path = require('path');

const filepath = path.join(__dirname, '..', 'views', 'settings.ejs');
const content = fs.readFileSync(filepath, 'utf8');
const lines = content.split('\n');

console.log("Searching for showUserDetailsPanel...");
lines.forEach((line, idx) => {
  if (line.includes('showUserDetailsPanel')) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
  }
});
console.log("Searching for showEditUserPanel...");
lines.forEach((line, idx) => {
  if (line.includes('showEditUserPanel')) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
  }
});
