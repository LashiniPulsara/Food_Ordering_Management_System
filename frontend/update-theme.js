const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');

// Define exact replacements
const replacements = [
  // Primary green to black
  { regex: /#6bb036/gi, replacement: '#000000' },
  { regex: /#4CAF50/gi, replacement: '#000000' },
  { regex: /#e74c3c/gi, replacement: '#000000' }, // Any red loaders or links
  // Light green backgrounds to light gray
  { regex: /#e8f5e9/gi, replacement: '#f6f6f6' },
  // Light orange backgrounds to light gray
  { regex: /#FFF3E0/gi, replacement: '#f6f6f6' },
  // Off-white yellowish to pure white
  { regex: /#FFFAF5/gi, replacement: '#ffffff' },
  { regex: /#F8F9FA/gi, replacement: '#ffffff' },
  { regex: /#F5F6FA/gi, replacement: '#f6f6f6' },
  // Orange borders to minimal gray
  { regex: /#FFD6A0/gi, replacement: '#e0e0e0' },
  // Green borders to minimal gray
  { regex: /#A5D6A7/gi, replacement: '#e0e0e0' },
  // Text colors
  { regex: /color: '#333'/gi, replacement: "color: '#000000'" },
  { regex: /color: '#555'/gi, replacement: "color: '#545454'" },
  { regex: /color: '#777'/gi, replacement: "color: '#545454'" },
  { regex: /color: '#666'/gi, replacement: "color: '#545454'" },
  { regex: /color: '#7f8c8d'/gi, replacement: "color: '#545454'" },
  { regex: /color: '#2c3e50'/gi, replacement: "color: '#000000'" },
  { regex: /color: '#2C3A47'/gi, replacement: "color: '#000000'" },
  { regex: /color: '#1A1A1A'/gi, replacement: "color: '#000000'" },
  { regex: /#1A1A1A/gi, replacement: '#000000' },
  // Borders
  { regex: /borderColor: '#ddd'/gi, replacement: "borderColor: '#eeeeee'" },
  { regex: /borderColor: '#ccc'/gi, replacement: "borderColor: '#eeeeee'" },
];

function processDirectory(directory) {
  const files = fs.readdirSync(directory);

  for (const file of files) {
    const fullPath = path.join(directory, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.js')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let originalContent = content;

      for (const rule of replacements) {
        content = content.replace(rule.regex, rule.replacement);
      }
      
      // Specifically target buttons and cards
      content = content.replace(/elevation: [1-9],/g, 'elevation: 0,'); // Remove android shadow for flat look
      content = content.replace(/shadowOpacity: 0\.[1-9]+/g, 'shadowOpacity: 0.05'); // Subtle shadow
      content = content.replace(/borderRadius: 20/g, 'borderRadius: 12'); // More square-ish modern corners
      content = content.replace(/borderRadius: 15/g, 'borderRadius: 12');
      content = content.replace(/borderRadius: 10/g, 'borderRadius: 8');

      // Update font weights
      content = content.replace(/fontWeight: 'bold'/g, "fontWeight: '600'");
      content = content.replace(/fontWeight: '800'/g, "fontWeight: '700'");
      
      // Make title fonts a bit starker
      content = content.replace(/fontSize: 28/g, "fontSize: 32");

      if (content !== originalContent) {
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Updated theme in: ${fullPath}`);
      }
    }
  }
}

processDirectory(screensDir);
console.log('Mass UI update complete!');
