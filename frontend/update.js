const fs = require('fs');
const file = 'c:/Users/sanus/Desktop/WMTFOOD new/WMTFOOD/frontend/src/screens/owner/OwnerDashboardScreen.js';
let content = fs.readFileSync(file, 'utf8');

const regex = /<Text style=\{styles\.qaTitle\}>View Orders<\/Text>\s*<\/TouchableOpacity>\s*<\/View>/m;

const newText = `<Text style={styles.qaTitle}>View Orders</Text>
          </TouchableOpacity>

          <TouchableOpacity 
             style={[styles.quickActionCard, { backgroundColor: '#e67e22', width: '100%', marginTop: 15 }]}
             onPress={() => navigation.navigate('AdminCategories')}
             activeOpacity={0.8}
          >
            <View style={styles.qaIconCircle}>
              <Text style={styles.qaIcon}><Ionicons name="grid-outline" size={24} color="#000000" /></Text>
            </View>
            <Text style={styles.qaTitle}>Manage Categories</Text>
          </TouchableOpacity>
        </View>`;

content = content.replace(regex, newText);
fs.writeFileSync(file, content);
console.log('done');
