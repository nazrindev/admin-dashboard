// Test script for inventory management endpoints
// This script demonstrates how to use the inventory management API

const axios = require("axios");

// Configuration
const BASE_URL = "http://localhost:3000/api"; // Adjust port as needed
const TEST_PRODUCT_ID = "your-product-id-here"; // Replace with actual product ID
const TEST_MERCHANT_TOKEN = "your-merchant-jwt-token-here"; // Replace with actual JWT token

// Helper function to make authenticated requests
const makeRequest = async (method, url, data = null, token = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...(data && { data }),
    };

    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(
      `Error ${method} ${url}:`,
      error.response?.data || error.message
    );
    throw error;
  }
};

// Test functions
const testInventoryEndpoints = async () => {
  console.log("🧪 Testing Inventory Management Endpoints\n");

  try {
    // Test 1: Get inventory (requires authentication)
    console.log("1. Testing GET /api/product/:productId/inventory");
    const inventory = await makeRequest(
      "GET",
      `/product/${TEST_PRODUCT_ID}/inventory`,
      null,
      TEST_MERCHANT_TOKEN
    );
    console.log("✅ Inventory retrieved:", JSON.stringify(inventory, null, 2));
    console.log("");

    // Test 2: Check availability (no authentication required)
    console.log("2. Testing POST /api/product/:productId/availability");
    const availability = await makeRequest(
      "POST",
      `/product/${TEST_PRODUCT_ID}/availability`,
      {
        size: "M", // For size-based inventory
        quantity: 2,
      }
    );
    console.log(
      "✅ Availability checked:",
      JSON.stringify(availability, null, 2)
    );
    console.log("");

    // Test 3: Update inventory (requires authentication)
    console.log("3. Testing PUT /api/product/:productId/inventory");
    const updateData = {
      inventoryType: "size-based",
      sizeInventory: [
        {
          size: "S",
          quantity: 10,
          reserved: 0,
          sku: "PROD-S-001",
          isActive: true,
        },
        {
          size: "M",
          quantity: 15,
          reserved: 2,
          sku: "PROD-M-001",
          isActive: true,
        },
        {
          size: "L",
          quantity: 8,
          reserved: 1,
          sku: "PROD-L-001",
          isActive: true,
        },
      ],
      lowStockThreshold: 5,
      trackInventory: true,
    };

    const updatedInventory = await makeRequest(
      "PUT",
      `/product/${TEST_PRODUCT_ID}/inventory`,
      updateData,
      TEST_MERCHANT_TOKEN
    );
    console.log(
      "✅ Inventory updated:",
      JSON.stringify(updatedInventory, null, 2)
    );
    console.log("");

    // Test 4: Check availability after update
    console.log("4. Testing availability after inventory update");
    const newAvailability = await makeRequest(
      "POST",
      `/product/${TEST_PRODUCT_ID}/availability`,
      {
        size: "M",
        quantity: 5,
      }
    );
    console.log(
      "✅ New availability:",
      JSON.stringify(newAvailability, null, 2)
    );
    console.log("");

    // Test 5: Test legacy stock update
    console.log("5. Testing legacy stock update");
    const legacyUpdate = await makeRequest(
      "PUT",
      `/product/${TEST_PRODUCT_ID}/inventory`,
      {
        inventoryType: "legacy",
        legacyStock: 50,
        lowStockThreshold: 10,
        trackInventory: true,
      },
      TEST_MERCHANT_TOKEN
    );
    console.log(
      "✅ Legacy stock updated:",
      JSON.stringify(legacyUpdate, null, 2)
    );
    console.log("");

    // Test 6: Check legacy availability
    console.log("6. Testing legacy availability");
    const legacyAvailability = await makeRequest(
      "POST",
      `/product/${TEST_PRODUCT_ID}/availability`,
      {
        quantity: 25,
      }
    );
    console.log(
      "✅ Legacy availability:",
      JSON.stringify(legacyAvailability, null, 2)
    );

    console.log("\n🎉 All tests completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error.message);
  }
};

// Example usage scenarios
const exampleUsageScenarios = () => {
  console.log("\n📚 Example Usage Scenarios:\n");

  console.log("1. 📦 Size-based Inventory Management:");
  console.log('   - Set inventory type to "size-based"');
  console.log("   - Add size inventory with quantities and SKUs");
  console.log("   - Check availability for specific sizes");
  console.log("   - Track reserved quantities for pending orders\n");

  console.log("2. 📊 Legacy Stock Management:");
  console.log('   - Set inventory type to "legacy"');
  console.log("   - Update total stock quantity");
  console.log("   - Simple availability checking without size specification\n");

  console.log("3. ⚠️ Low Stock Alerts:");
  console.log("   - Set low stock threshold");
  console.log("   - Get alerts when stock falls below threshold");
  console.log("   - Monitor inventory levels across all sizes\n");

  console.log("4. 🔄 Order Integration:");
  console.log("   - Use reserveInventory() helper for order processing");
  console.log("   - Use releaseInventory() helper for order cancellation");
  console.log("   - Automatic stock deduction for completed orders\n");

  console.log("5. 📈 Inventory Analytics:");
  console.log("   - Track total stock across all sizes");
  console.log("   - Monitor reserved vs available quantities");
  console.log("   - Generate low stock reports\n");
};

// Run the tests if this file is executed directly
if (require.main === module) {
  console.log("🚀 Inventory Management API Test Suite");
  console.log("=====================================\n");

  console.log("⚠️  Before running tests:");
  console.log("1. Make sure your server is running on the correct port");
  console.log("2. Replace TEST_PRODUCT_ID with an actual product ID");
  console.log("3. Replace TEST_MERCHANT_TOKEN with a valid JWT token");
  console.log("4. Ensure you have a product created in your database\n");

  // Uncomment the line below to run tests
  // testInventoryEndpoints();

  exampleUsageScenarios();
}

module.exports = {
  testInventoryEndpoints,
  makeRequest,
};

