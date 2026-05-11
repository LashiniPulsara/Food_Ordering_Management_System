/**
 * Test Script for NEW Global Category System
 * - Admin creates global categories
 * - Restaurant owner selects from global categories when creating menu items
 */

const BASE = 'http://localhost:5000/api';

let adminToken = '';
let ownerToken = '';
let restaurantId = '';
let categoryId1 = '';
let categoryId2 = '';
let categoryId3 = '';
let menuItemId = '';
let passed = 0;
let failed = 0;
const results = [];

async function request(method, path, body, token) {
  const url = `${BASE}${path}`;
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(url, opts);
  const data = await res.json();
  return { status: res.status, data };
}

function test(name, condition, detail = '') {
  if (condition) { passed++; results.push(`  ✅ PASS: ${name}`); }
  else { failed++; results.push(`  ❌ FAIL: ${name}${detail ? ' — ' + detail : ''}`); }
}

async function run() {
  console.log('==============================================');
  console.log('  Global Category System — Test Suite');
  console.log('==============================================\n');

  // ─── SETUP: Login admin & owner ───
  results.push('\n🔐 Setup: Authentication');

  let r = await request('POST', '/auth/login', { email: 'testadmin@wmtfood.com', password: '123456' });
  adminToken = r.data.token;
  test('Admin Login', r.status === 200 && adminToken, `Status: ${r.status}`);

  r = await request('POST', '/auth/login', { email: 'demoowner@wmtfood.com', password: '123456' });
  ownerToken = r.data.token;
  test('Owner Login', r.status === 200 && ownerToken, `Status: ${r.status}`);

  // Get owner's restaurant
  r = await request('GET', '/restaurants/my/restaurant', null, ownerToken);
  restaurantId = r.data.data?._id;
  test('Get Owner Restaurant', r.status === 200 && restaurantId, `Status: ${r.status}`);

  // ─── 1. ADMIN CREATES GLOBAL CATEGORIES ───
  results.push('\n📁 Admin Creates Global Categories');

  r = await request('POST', '/categories', { categoryName: 'Rice & Curry', description: 'Traditional rice and curry dishes' }, adminToken);
  test('Create Category: Rice & Curry', r.status === 201 && r.data.success, `Status: ${r.status}, Msg: ${r.data.message || ''}`);
  categoryId1 = r.data.data?._id;

  r = await request('POST', '/categories', { categoryName: 'Beverages', description: 'Hot and cold drinks' }, adminToken);
  test('Create Category: Beverages', r.status === 201 && r.data.success, `Status: ${r.status}`);
  categoryId2 = r.data.data?._id;

  r = await request('POST', '/categories', { categoryName: 'Desserts', description: 'Sweet treats and desserts' }, adminToken);
  test('Create Category: Desserts', r.status === 201 && r.data.success, `Status: ${r.status}`);
  categoryId3 = r.data.data?._id;

  // ─── 2. DUPLICATE CATEGORY REJECTED ───
  r = await request('POST', '/categories', { categoryName: 'Rice & Curry', description: 'Duplicate' }, adminToken);
  test('Reject Duplicate Category Name', r.status === 400, `Status: ${r.status}`);

  // ─── 3. OWNER CANNOT CREATE CATEGORIES ───
  r = await request('POST', '/categories', { categoryName: 'Owner Cat', description: 'Should fail' }, ownerToken);
  test('Owner Cannot Create Category', r.status === 401, `Status: ${r.status}`);

  // ─── 4. NON-AUTH CANNOT CREATE CATEGORIES ───
  r = await request('POST', '/categories', { categoryName: 'Anon Cat', description: 'Should fail' });
  test('Unauthenticated Cannot Create Category', r.status === 401, `Status: ${r.status}`);

  // ─── 5. GET ALL CATEGORIES (PUBLIC) ───
  results.push('\n📋 List Global Categories');

  r = await request('GET', '/categories');
  test('Get All Global Categories (Public)', r.status === 200 && r.data.count === 3, `Status: ${r.status}, Count: ${r.data.count}`);
  test('Categories Are Sorted', r.data.data[0].categoryName === 'Beverages', `First: ${r.data.data[0]?.categoryName}`);

  // ─── 6. GET SINGLE CATEGORY ───
  r = await request('GET', `/categories/${categoryId1}`);
  test('Get Single Category', r.status === 200 && r.data.data?.categoryName === 'Rice & Curry', `Status: ${r.status}`);

  // ─── 7. UPDATE CATEGORY (ADMIN ONLY) ───
  results.push('\n✏️ Update & Delete Categories');

  r = await request('PUT', `/categories/${categoryId3}`, { description: 'Updated: Sweet treats, cakes and ice cream' }, adminToken);
  test('Admin Update Category', r.status === 200 && r.data.success, `Status: ${r.status}`);

  // Owner cannot update
  r = await request('PUT', `/categories/${categoryId3}`, { description: 'Should fail' }, ownerToken);
  test('Owner Cannot Update Category', r.status === 401, `Status: ${r.status}`);

  // ─── 8. OWNER CREATES MENU ITEMS WITH GLOBAL CATEGORIES ───
  results.push('\n🍽️ Owner Creates Menu Items Using Global Categories');

  r = await request('POST', '/menu', {
    foodName: 'Chicken Rice', description: 'Fragrant chicken rice', price: 750,
    categoryId: categoryId1, restaurantId, preparationTime: 15, availability: true
  }, ownerToken);
  test('Create Menu Item with Global Category (Rice & Curry)', r.status === 201 && r.data.success, `Status: ${r.status}`);
  menuItemId = r.data.data?._id;

  r = await request('POST', '/menu', {
    foodName: 'Fresh Juice', description: 'Mixed fruit juice', price: 350,
    categoryId: categoryId2, restaurantId, preparationTime: 5, availability: true
  }, ownerToken);
  test('Create Menu Item with Global Category (Beverages)', r.status === 201 && r.data.success, `Status: ${r.status}`);

  r = await request('POST', '/menu', {
    foodName: 'Watalappan', description: 'Sri Lankan coconut custard', price: 250,
    categoryId: categoryId3, restaurantId, preparationTime: 10, availability: true
  }, ownerToken);
  test('Create Menu Item with Global Category (Desserts)', r.status === 201 && r.data.success, `Status: ${r.status}`);

  // ─── 9. VERIFY MENU ITEMS HAVE CATEGORY DATA ───
  results.push('\n🔗 Verify Category References in Menu');

  r = await request('GET', `/menu/restaurant/${restaurantId}`);
  test('Get Menu Items with Populated Categories', r.status === 200 && r.data.count >= 3, `Status: ${r.status}, Count: ${r.data.count}`);

  // Check that categoryId is populated with categoryName
  const firstItem = r.data.data.find(i => i.foodName === 'Chicken Rice');
  test('Menu Item Has Category Name Populated', firstItem?.categoryId?.categoryName === 'Rice & Curry', `Category: ${JSON.stringify(firstItem?.categoryId)}`);

  // ─── 10. FILTER MENU BY CATEGORY ───
  r = await request('GET', `/menu?categoryId=${categoryId1}`);
  test('Filter Menu By Category', r.status === 200 && r.data.count >= 1, `Status: ${r.status}, Count: ${r.data.count}`);

  // ─── 11. DELETE CATEGORY (ADMIN ONLY) ───
  // Create a temp category for deletion test
  r = await request('POST', '/categories', { categoryName: 'Temp Category', description: 'Will be deleted' }, adminToken);
  const tempId = r.data.data?._id;

  r = await request('DELETE', `/categories/${tempId}`, null, adminToken);
  test('Admin Delete Category', r.status === 200 && r.data.success, `Status: ${r.status}`);

  // Owner cannot delete
  r = await request('DELETE', `/categories/${categoryId1}`, null, ownerToken);
  test('Owner Cannot Delete Category', r.status === 401, `Status: ${r.status}`);

  // Verify category count after deletion
  r = await request('GET', '/categories');
  test('Category Count After Delete', r.data.count === 3, `Count: ${r.data.count}`);

  // ─── CLEANUP: Delete test menu items ───
  if (menuItemId) {
    await request('DELETE', `/menu/${menuItemId}`, null, ownerToken);
  }

  // ─── SUMMARY ───
  console.log('\n==============================================');
  console.log('  TEST RESULTS');
  console.log('==============================================');
  results.forEach(l => console.log(l));
  console.log('\n==============================================');
  console.log(`  TOTAL: ${passed + failed} | ✅ PASSED: ${passed} | ❌ FAILED: ${failed}`);
  console.log('==============================================\n');
}

run().catch(e => console.error('Error:', e));
