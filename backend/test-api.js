/**
 * Comprehensive API Test Script for WMTFOOD Backend
 * Tests ALL endpoints across all 8 modules
 */

const BASE = 'http://localhost:5000/api';

// Stored IDs and tokens for chained tests
let customerToken = '';
let ownerToken = '';
let adminToken = '';
let customerId = '';
let ownerId = '';
let restaurantId = '';
let categoryId = '';
let menuItemId = '';
let orderId = '';
let paymentId = '';
let deliveryId = '';
let reservationId = '';

let passed = 0;
let failed = 0;
const results = [];

async function request(method, path, body, token) {
  const url = `${BASE}${path}`;
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' },
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(url, opts);
  const data = await res.json();
  return { status: res.status, data };
}

function test(name, condition, detail = '') {
  if (condition) {
    passed++;
    results.push(`  ✅ PASS: ${name}`);
  } else {
    failed++;
    results.push(`  ❌ FAIL: ${name}${detail ? ' — ' + detail : ''}`);
  }
}

async function runTests() {
  console.log('============================================');
  console.log('  WMTFOOD API — Comprehensive Test Suite');
  console.log('============================================\n');

  // ========== 1. AUTH MODULE ==========
  console.log('📦 MODULE 1: Authentication');
  results.push('\n📦 MODULE 1: Authentication');

  // 1.1 Register Customer
  let r = await request('POST', '/auth/register', {
    name: 'Test Customer',
    email: `customer_${Date.now()}@test.com`,
    password: '123456',
    phone: '0771234567',
    role: 'customer'
  });
  test('Register Customer', r.status === 201 && r.data.token, `Status: ${r.status}`);
  if (r.data.token) { customerToken = r.data.token; customerId = r.data._id; }

  // 1.2 Register Restaurant Owner
  r = await request('POST', '/auth/register', {
    name: 'Test Owner',
    email: `owner_${Date.now()}@test.com`,
    password: '123456',
    phone: '0777654321',
    role: 'restaurantOwner'
  });
  test('Register Restaurant Owner', r.status === 201 && r.data.token, `Status: ${r.status}`);
  if (r.data.token) { ownerToken = r.data.token; ownerId = r.data._id; }

  // 1.3 Register duplicate user
  r = await request('POST', '/auth/register', {
    name: 'Test Customer',
    email: `customer_duplicate@test.com`,
    password: '123456',
    phone: '0771234567',
  });
  // First time should succeed
  if (r.status === 201) {
    r = await request('POST', '/auth/register', {
      name: 'Test Customer',
      email: `customer_duplicate@test.com`,
      password: '123456',
      phone: '0771234567',
    });
  }
  test('Reject Duplicate Registration', r.status === 400, `Status: ${r.status}`);

  // 1.4 Login Customer
  // Need to register a known user first
  const loginEmail = `logintest_${Date.now()}@test.com`;
  await request('POST', '/auth/register', {
    name: 'Login Test', email: loginEmail, password: 'password123', phone: '0770000000',
  });
  r = await request('POST', '/auth/login', { email: loginEmail, password: 'password123' });
  test('Login User', r.status === 200 && r.data.token, `Status: ${r.status}`);

  // 1.5 Login with wrong password
  r = await request('POST', '/auth/login', { email: loginEmail, password: 'wrongpass' });
  test('Reject Wrong Password', r.status === 401, `Status: ${r.status}`);

  // 1.6 Get Profile
  r = await request('GET', '/auth/profile', null, customerToken);
  test('Get User Profile', r.status === 200 && r.data.name === 'Test Customer', `Status: ${r.status}`);

  // 1.7 Get Profile without token
  r = await request('GET', '/auth/profile', null);
  test('Reject Unauthenticated Profile', r.status === 401, `Status: ${r.status}`);

  // ========== 2. RESTAURANT MODULE ==========
  console.log('📦 MODULE 2: Restaurant Management');
  results.push('\n📦 MODULE 2: Restaurant Management');

  // 2.1 Create Restaurant
  r = await request('POST', '/restaurants', {
    restaurantName: 'Test Restaurant',
    email: 'testrest@test.com',
    phone: '0112223344',
    address: '123 Test Street, Colombo',
    cuisineType: 'Sri Lankan',
    openingHours: '8:00 AM - 10:00 PM'
  }, ownerToken);
  test('Create Restaurant', r.status === 201 && r.data.success, `Status: ${r.status}, Msg: ${r.data.message || ''}`);
  if (r.data.data) restaurantId = r.data.data._id;

  // 2.2 Get All Restaurants (public)
  r = await request('GET', '/restaurants');
  test('Get All Restaurants (Public)', r.status === 200 && r.data.success, `Status: ${r.status}`);

  // 2.3 Get Single Restaurant
  if (restaurantId) {
    r = await request('GET', `/restaurants/${restaurantId}`);
    test('Get Single Restaurant', r.status === 200 && r.data.success, `Status: ${r.status}`);
  } else {
    test('Get Single Restaurant', false, 'No restaurant ID available');
  }

  // 2.4 Get My Restaurant (owner)
  r = await request('GET', '/restaurants/my/restaurant', null, ownerToken);
  test('Get My Restaurant (Owner)', r.status === 200 && r.data.success, `Status: ${r.status}`);

  // 2.5 Update Restaurant
  if (restaurantId) {
    r = await request('PUT', `/restaurants/${restaurantId}`, {
      cuisineType: 'Sri Lankan & Indian',
      status: 'approved'  // Owner cannot change status, only admin
    }, ownerToken);
    test('Update Restaurant', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 2.6 Customer cannot create restaurant
  r = await request('POST', '/restaurants', {
    restaurantName: 'Invalid Restaurant',
    email: 'invalid@test.com',
    phone: '011111111',
    address: 'Nowhere',
    cuisineType: 'None',
    openingHours: '9-5'
  }, customerToken);
  test('Customer Cannot Create Restaurant', r.status === 401, `Status: ${r.status}`);

  // ========== 3. CATEGORY MODULE ==========
  console.log('📦 MODULE 3: Category Management');
  results.push('\n📦 MODULE 3: Category Management');

  // We need to approve the restaurant first for some operations. 
  // Since we don't have admin token yet, let's work with the pending restaurant 
  // (the owner is still the owner, and admin checks are on status)
  // Actually the controller checks: if (req.user.role !== 'admin' && restaurant.status !== 'approved')
  // So we need admin to approve first. Let's try to login as admin or create one.

  // Try to login with a known admin account (if seeded)
  // If SEED_ADMIN_ON_STARTUP is not 'true' in .env, admin won't exist
  // Let's directly register an admin via the API (role is accepted in register)
  // Actually, the register accepts any role. Let's register an admin:
  r = await request('POST', '/auth/register', {
    name: 'Test Admin',
    email: `admin_${Date.now()}@test.com`,
    password: '123456',
    phone: '0770000001',
    role: 'admin'
  });
  if (r.data.token) adminToken = r.data.token;
  test('Register Admin User', r.status === 201 && r.data.role === 'admin', `Status: ${r.status}`);

  // Approve the restaurant via admin
  if (restaurantId && adminToken) {
    r = await request('PUT', `/restaurants/${restaurantId}`, {
      status: 'approved',
      approvalNote: 'Approved by test admin'
    }, adminToken);
    test('Admin Approve Restaurant', r.status === 200 && r.data.data?.status === 'approved', `Status: ${r.status}, status: ${r.data.data?.status}`);
  }

  // 3.1 Add Category
  if (restaurantId) {
    r = await request('POST', '/categories', {
      categoryName: 'Rice & Curry',
      description: 'Traditional Sri Lankan rice and curry dishes',
      restaurantId: restaurantId
    }, ownerToken);
    test('Add Category', r.status === 201 && r.data.success, `Status: ${r.status}, Msg: ${r.data.message || ''}`);
    if (r.data.data) categoryId = r.data.data._id;
  }

  // 3.2 Get Categories for Restaurant
  if (restaurantId) {
    r = await request('GET', `/categories/restaurant/${restaurantId}`);
    test('Get Categories for Restaurant', r.status === 200 && r.data.success && r.data.count >= 1, `Status: ${r.status}, Count: ${r.data.count}`);
  }

  // 3.3 Get Single Category
  if (categoryId) {
    r = await request('GET', `/categories/${categoryId}`);
    test('Get Single Category', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 3.4 Update Category
  if (categoryId) {
    r = await request('PUT', `/categories/${categoryId}`, {
      description: 'Updated: Traditional Sri Lankan rice and curry dishes with more variety'
    }, ownerToken);
    test('Update Category', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // ========== 4. MENU MODULE ==========
  console.log('📦 MODULE 4: Menu Management');
  results.push('\n📦 MODULE 4: Menu Management');

  // 4.1 Add Menu Item
  if (restaurantId && categoryId) {
    r = await request('POST', '/menu', {
      foodName: 'Chicken Fried Rice',
      description: 'Delicious chicken fried rice with special spices',
      price: 850,
      categoryId: categoryId,
      restaurantId: restaurantId,
      availability: true,
      preparationTime: 20
    }, ownerToken);
    test('Add Menu Item', r.status === 201 && r.data.success, `Status: ${r.status}, Msg: ${r.data.message || ''}`);
    if (r.data.data) menuItemId = r.data.data._id;
  }

  // 4.2 Add second menu item
  let menuItemId2 = '';
  if (restaurantId && categoryId) {
    r = await request('POST', '/menu', {
      foodName: 'Vegetable Kottu',
      description: 'Chopped roti mixed with vegetables and spices',
      price: 650,
      categoryId: categoryId,
      restaurantId: restaurantId,
      availability: true,
      preparationTime: 15
    }, ownerToken);
    test('Add Second Menu Item', r.status === 201 && r.data.success, `Status: ${r.status}`);
    if (r.data.data) menuItemId2 = r.data.data._id;
  }

  // 4.3 Get All Menu Items
  r = await request('GET', '/menu');
  test('Get All Menu Items', r.status === 200 && r.data.success, `Status: ${r.status}`);

  // 4.4 Get Menu Items by Restaurant
  if (restaurantId) {
    r = await request('GET', `/menu/restaurant/${restaurantId}`);
    test('Get Menu Items by Restaurant', r.status === 200 && r.data.success && r.data.count >= 1, `Status: ${r.status}, Count: ${r.data.count}`);
  }

  // 4.5 Get Single Menu Item
  if (menuItemId) {
    r = await request('GET', `/menu/${menuItemId}`);
    test('Get Single Menu Item', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 4.6 Update Menu Item
  if (menuItemId) {
    r = await request('PUT', `/menu/${menuItemId}`, { price: 900, availability: false }, ownerToken);
    test('Update Menu Item', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 4.7 Search Menu Items
  r = await request('GET', '/menu?search=Chicken');
  test('Search Menu Items', r.status === 200 && r.data.success, `Status: ${r.status}, Count: ${r.data.count}`);

  // 4.8 Filter by Category
  if (categoryId) {
    r = await request('GET', `/menu?categoryId=${categoryId}`);
    test('Filter Menu by Category', r.status === 200 && r.data.success, `Status: ${r.status}, Count: ${r.data.count}`);
  }

  // ========== 5. ORDER MODULE ==========
  console.log('📦 MODULE 5: Order Management');
  results.push('\n📦 MODULE 5: Order Management');

  // 5.1 Place Order
  if (restaurantId && menuItemId) {
    r = await request('POST', '/orders', {
      restaurantId: restaurantId,
      items: [
        { menuItem: menuItemId, quantity: 2, price: 850 },
        ...(menuItemId2 ? [{ menuItem: menuItemId2, quantity: 1, price: 650 }] : [])
      ],
      totalAmount: 2350,
      deliveryAddress: '456 Customer St, Colombo 07',
      paymentMethod: 'Cash on Delivery'
    }, customerToken);
    test('Place Order', r.status === 201 && r.data.success, `Status: ${r.status}, Msg: ${r.data.message || ''}`);
    if (r.data.data) orderId = r.data.data._id;
  }

  // 5.2 Place order without items
  r = await request('POST', '/orders', {
    restaurantId: restaurantId,
    items: [],
    totalAmount: 0,
    deliveryAddress: '123 St',
    paymentMethod: 'Cash on Delivery'
  }, customerToken);
  test('Reject Empty Order', r.status === 400, `Status: ${r.status}`);

  // 5.3 Get My Orders (customer)
  r = await request('GET', '/orders/myorders', null, customerToken);
  test('Get My Orders', r.status === 200 && r.data.success && r.data.count >= 1, `Status: ${r.status}, Count: ${r.data.count}`);

  // 5.4 Get Restaurant Orders (owner)
  if (restaurantId) {
    r = await request('GET', `/orders/restaurant/${restaurantId}`, null, ownerToken);
    test('Get Restaurant Orders (Owner)', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 5.5 Get My Restaurant Orders (owner shortcut)
  r = await request('GET', '/orders/owner/my-restaurant', null, ownerToken);
  test('Get My Restaurant Orders (Owner)', r.status === 200 && r.data.success, `Status: ${r.status}`);

  // 5.6 Get All Orders (admin)
  r = await request('GET', '/orders', null, adminToken);
  test('Get All Orders (Admin)', r.status === 200 && r.data.success, `Status: ${r.status}`);

  // 5.7 Update Order Status (owner)
  if (orderId) {
    r = await request('PUT', `/orders/${orderId}/status`, {
      orderStatus: 'Preparing'
    }, ownerToken);
    test('Update Order Status (Owner)', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 5.8 Customer cannot update order status
  if (orderId) {
    r = await request('PUT', `/orders/${orderId}/status`, {
      orderStatus: 'Delivered'
    }, customerToken);
    test('Customer Cannot Update Status', r.status === 401, `Status: ${r.status}`);
  }

  // 5.9 Place a second order to test cancel
  let cancelOrderId = '';
  if (restaurantId && menuItemId) {
    r = await request('POST', '/orders', {
      restaurantId: restaurantId,
      items: [{ menuItem: menuItemId, quantity: 1, price: 850 }],
      totalAmount: 850,
      deliveryAddress: '789 Cancel St',
      paymentMethod: 'Card'
    }, customerToken);
    if (r.data.data) cancelOrderId = r.data.data._id;
  }

  // 5.10 Cancel Order
  if (cancelOrderId) {
    r = await request('PUT', `/orders/${cancelOrderId}/cancel`, {}, customerToken);
    test('Cancel Order', r.status === 200 && r.data.data?.orderStatus === 'Cancelled', `Status: ${r.status}`);
  }

  // 5.11 Cannot cancel non-pending order
  if (orderId) {
    r = await request('PUT', `/orders/${orderId}/cancel`, {}, customerToken);
    test('Cannot Cancel Non-Pending Order', r.status === 400, `Status: ${r.status}`);
  }

  // ========== 6. PAYMENT MODULE ==========
  console.log('📦 MODULE 6: Payment Management');
  results.push('\n📦 MODULE 6: Payment Management');

  // 6.1 Record Payment
  if (orderId) {
    r = await request('POST', '/payments', {
      orderId: orderId,
      paymentMethod: 'Cash on Delivery',
      amount: 2350,
      paymentStatus: 'Pending'
    }, customerToken);
    test('Record Payment', r.status === 201 && r.data.success, `Status: ${r.status}, Msg: ${r.data.message || ''}`);
    if (r.data.data) paymentId = r.data.data._id;
  }

  // 6.2 Duplicate payment check
  if (orderId) {
    r = await request('POST', '/payments', {
      orderId: orderId,
      paymentMethod: 'Cash on Delivery',
      amount: 2350,
    }, customerToken);
    test('Reject Duplicate Payment', r.status === 400, `Status: ${r.status}`);
  }

  // 6.3 Get My Payments
  r = await request('GET', '/payments/myhistory', null, customerToken);
  test('Get My Payment History', r.status === 200 && r.data.success, `Status: ${r.status}`);

  // 6.4 Generate Invoice
  if (paymentId) {
    r = await request('GET', `/payments/${paymentId}/invoice`, null, customerToken);
    test('Generate Invoice', r.status === 200 && r.data.success && r.data.data?.invoiceId, `Status: ${r.status}, InvoiceId: ${r.data.data?.invoiceId}`);
  }

  // 6.5 Update Payment Status (admin only)
  if (paymentId) {
    r = await request('PUT', `/payments/${paymentId}/status`, {
      paymentStatus: 'Paid'
    }, adminToken);
    test('Admin Update Payment Status', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 6.6 Non-admin cannot update payment status
  if (paymentId) {
    r = await request('PUT', `/payments/${paymentId}/status`, {
      paymentStatus: 'Failed'
    }, customerToken);
    test('Non-Admin Cannot Update Payment Status', r.status === 401, `Status: ${r.status}`);
  }

  // ========== 7. DELIVERY MODULE ==========
  console.log('📦 MODULE 7: Delivery Management');
  results.push('\n📦 MODULE 7: Delivery Management');

  // 7.1 Create Delivery
  if (orderId) {
    r = await request('POST', '/deliveries', {
      orderId: orderId,
      deliveryAddress: '456 Customer St, Colombo 07'
    }, adminToken);
    test('Create Delivery', r.status === 201 && r.data.success, `Status: ${r.status}, Msg: ${r.data.message || ''}`);
    if (r.data.data) deliveryId = r.data.data._id;
  }

  // 7.2 Get All Deliveries
  r = await request('GET', '/deliveries', null, adminToken);
  test('Get All Deliveries', r.status === 200 && r.data.success, `Status: ${r.status}`);

  // 7.3 Register a delivery rider
  const riderRes = await request('POST', '/auth/register', {
    name: 'Test Rider',
    email: `rider_${Date.now()}@test.com`,
    password: '123456',
    phone: '0779999999',
    role: 'deliveryRider'
  });
  const riderToken = riderRes.data.token;
  const riderId = riderRes.data._id;
  test('Register Delivery Rider', riderRes.status === 201 && riderRes.data.role === 'deliveryRider', `Status: ${riderRes.status}`);

  // 7.4 Assign Rider (admin only)
  if (deliveryId && riderId) {
    r = await request('PUT', `/deliveries/${deliveryId}/assign`, {
      riderId: riderId
    }, adminToken);
    test('Assign Delivery Rider', r.status === 200 && r.data.data?.deliveryStatus === 'Assigned', `Status: ${r.status}`);
  }

  // 7.5 Update Delivery Status (rider)
  if (deliveryId && riderToken) {
    r = await request('PUT', `/deliveries/${deliveryId}/status`, {
      deliveryStatus: 'In Transit'
    }, riderToken);
    test('Rider Update Delivery Status', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 7.6 Track Delivery
  if (deliveryId) {
    r = await request('GET', `/deliveries/${deliveryId}/track`, null, customerToken);
    test('Track Delivery', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 7.7 Get My Deliveries (rider)
  if (riderToken) {
    r = await request('GET', '/deliveries/my-deliveries', null, riderToken);
    test('Get My Deliveries (Rider)', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // ========== 8. RESERVATION MODULE ==========
  console.log('📦 MODULE 8: Reservation Management');
  results.push('\n📦 MODULE 8: Reservation Management');

  // 8.1 Make Reservation
  if (restaurantId) {
    r = await request('POST', '/reservations', {
      restaurantId: restaurantId,
      tableNumber: 'T5',
      reservationDate: '2026-05-01',
      reservationTime: '7:00 PM',
      guestCount: 4
    }, customerToken);
    test('Make Reservation', r.status === 201 && r.data.success, `Status: ${r.status}, Msg: ${r.data.message || ''}`);
    if (r.data.data) reservationId = r.data.data._id;
  }

  // 8.2 Get My Reservations
  r = await request('GET', '/reservations/my-reservations', null, customerToken);
  test('Get My Reservations', r.status === 200 && r.data.success && r.data.count >= 1, `Status: ${r.status}, Count: ${r.data.count}`);

  // 8.3 Get Restaurant Reservations (owner)
  if (restaurantId) {
    r = await request('GET', `/reservations/restaurant/${restaurantId}`, null, ownerToken);
    test('Get Restaurant Reservations (Owner)', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 8.4 Update Reservation Status
  if (reservationId) {
    r = await request('PUT', `/reservations/${reservationId}/status`, {
      reservationStatus: 'Confirmed'
    }, ownerToken);
    test('Update Reservation Status', r.status === 200 && r.data.data?.reservationStatus === 'Confirmed', `Status: ${r.status}`);
  }

  // 8.5 Make another reservation to test cancel
  let cancelReservationId = '';
  if (restaurantId) {
    r = await request('POST', '/reservations', {
      restaurantId: restaurantId,
      tableNumber: 'T10',
      reservationDate: '2026-05-02',
      reservationTime: '8:00 PM',
      guestCount: 2
    }, customerToken);
    if (r.data.data) cancelReservationId = r.data.data._id;
  }

  // 8.6 Cancel Reservation
  if (cancelReservationId) {
    r = await request('PUT', `/reservations/${cancelReservationId}/cancel`, {}, customerToken);
    test('Cancel Reservation', r.status === 200 && r.data.data?.reservationStatus === 'Cancelled', `Status: ${r.status}`);
  }

  // ========== 9. ADMIN-SPECIFIC TESTS ==========
  console.log('📦 MODULE 9: Admin Operations');
  results.push('\n📦 MODULE 9: Admin Operations');

  // 9.1 Get All Users (admin only)
  r = await request('GET', '/auth/users', null, adminToken);
  test('Admin Get All Users', r.status === 200 && r.data.success && r.data.count >= 4, `Status: ${r.status}, Count: ${r.data.count}`);

  // 9.2 Non-admin cannot get all users
  r = await request('GET', '/auth/users', null, customerToken);
  test('Non-Admin Cannot Get Users', r.status === 401, `Status: ${r.status}`);

  // 9.3 Get all restaurants with status filter
  r = await request('GET', '/restaurants?status=all');
  test('Get All Restaurants (All Status)', r.status === 200 && r.data.success, `Status: ${r.status}, Count: ${r.data.count}`);

  // ========== 10. CLEANUP — DELETE TESTS ==========
  console.log('📦 MODULE 10: Delete Operations');
  results.push('\n📦 MODULE 10: Delete Operations');

  // 10.1 Delete Menu Item
  if (menuItemId2) {
    r = await request('DELETE', `/menu/${menuItemId2}`, null, ownerToken);
    test('Delete Menu Item', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 10.2 Delete Category 
  // Note: This may or may not work depending on if items reference it
  if (categoryId) {
    r = await request('DELETE', `/categories/${categoryId}`, null, ownerToken);
    test('Delete Category', r.status === 200 && r.data.success, `Status: ${r.status}`);
  }

  // 10.3 Delete Restaurant
  // We'll skip this to preserve data, just test the authorization
  // Customer cannot delete restaurant
  if (restaurantId) {
    r = await request('DELETE', `/restaurants/${restaurantId}`, null, customerToken);
    test('Customer Cannot Delete Restaurant', r.status === 401, `Status: ${r.status}`);
  }

  // ========== SUMMARY ==========
  console.log('\n============================================');
  console.log('  TEST RESULTS SUMMARY');
  console.log('============================================');
  results.forEach(line => console.log(line));
  console.log('\n============================================');
  console.log(`  TOTAL: ${passed + failed} | ✅ PASSED: ${passed} | ❌ FAILED: ${failed}`);
  console.log('============================================\n');
}

runTests().catch(err => {
  console.error('Test runner error:', err);
});
