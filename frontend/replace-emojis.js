const fs = require('fs');
const path = require('path');

const screensDir = path.join(__dirname, 'src', 'screens');

const emojiMap = {
  '🛒': '<Ionicons name="cart-outline" size={24} color="#000000" />',
  '👤': '<Ionicons name="person-outline" size={24} color="#000000" />',
  '🍔': '<Ionicons name="fast-food-outline" size={24} color="#000000" />',
  '🍕': '<Ionicons name="pizza-outline" size={24} color="#000000" />',
  '🍽️': '<Ionicons name="restaurant-outline" size={24} color="#000000" />',
  '📅': '<Ionicons name="calendar-outline" size={24} color="#000000" />',
  '🧾': '<Ionicons name="receipt-outline" size={24} color="#000000" />',
  '👋': '<Ionicons name="hand-right-outline" size={24} color="#000000" />',
  '⭐': '<Ionicons name="star" size={16} color="#f5c518" />',
  '📍': '<Ionicons name="location-outline" size={16} color="#545454" />',
  '🗑️': '<Ionicons name="trash-outline" size={24} color="#e74c3c" />',
  '✏️': '<Ionicons name="create-outline" size={24} color="#000000" />',
  '📦': '<Ionicons name="cube-outline" size={24} color="#000000" />',
  '🚚': '<Ionicons name="bicycle-outline" size={24} color="#000000" />',
  '⚙️': '<Ionicons name="settings-outline" size={24} color="#000000" />',
  '💰': '<Ionicons name="cash-outline" size={24} color="#000000" />',
  '❌': '<Ionicons name="close-circle-outline" size={24} color="#e74c3c" />',
  '➕': '<Ionicons name="add-outline" size={24} color="#000000" />',
  '➖': '<Ionicons name="remove-outline" size={24} color="#000000" />',
  '⏱️': '<Ionicons name="time-outline" size={16} color="#545454" />',
  '🏍️': '<Ionicons name="bicycle-outline" size={24} color="#000000" />',
  '👨‍🍳': '<Ionicons name="restaurant-outline" size={24} color="#000000" />',
  '📈': '<Ionicons name="trending-up-outline" size={24} color="#000000" />',
};

// Also let's clean up `<Text>🍔</Text>` to just `<Ionicons ... />` where possible to avoid weird text wrappers.
const wrapperMap = {};
for (const [emoji, icon] of Object.entries(emojiMap)) {
  wrapperMap[`<Text style={styles.icon}>${emoji}</Text>`] = icon;
  wrapperMap[`<Text style={styles.headerIcon}>${emoji}</Text>`] = icon;
  wrapperMap[`<Text style={styles.roleBadgeEmoji}>${emoji}</Text>`] = icon;
  wrapperMap[`<Text style={styles.emptyEmoji}>${emoji}</Text>`] = icon;
  wrapperMap[`<Text style={styles.iconEmoji}>${emoji}</Text>`] = icon;
}

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
      let needsImport = false;

      // 1. Try replacing full text wrappers first
      for (const [wrapper, icon] of Object.entries(wrapperMap)) {
        if (content.includes(wrapper)) {
          content = content.split(wrapper).join(icon);
          needsImport = true;
        }
      }

      // 2. Replace remaining bare emojis
      for (const [emoji, icon] of Object.entries(emojiMap)) {
        if (content.includes(emoji)) {
          content = content.split(emoji).join(icon);
          needsImport = true;
        }
      }

      if (needsImport && content !== originalContent) {
        // Add import if not present
        if (!content.includes("import { Ionicons } from '@expo/vector-icons';")) {
          // Find the last import statement
          const importMatches = [...content.matchAll(/^import .* from .*;$/gm)];
          if (importMatches.length > 0) {
            const lastImport = importMatches[importMatches.length - 1];
            const insertPos = lastImport.index + lastImport[0].length;
            content = content.slice(0, insertPos) + "\nimport { Ionicons } from '@expo/vector-icons';" + content.slice(insertPos);
          } else {
             // Fallback to putting it at the top
             content = "import { Ionicons } from '@expo/vector-icons';\n" + content;
          }
        }
        fs.writeFileSync(fullPath, content, 'utf8');
        console.log(`Replaced emojis with icons in: ${fullPath}`);
      }
    }
  }
}

processDirectory(screensDir);
console.log('Mass emoji-to-icon replacement complete!');
