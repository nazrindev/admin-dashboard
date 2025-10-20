# Inventory Management API Documentation

This document describes the inventory management system for merchants to track stock levels and handle both legacy stock and size-based inventory systems.

## Overview

The inventory management system supports two types of inventory tracking:

- **Legacy Stock**: Simple total quantity tracking (backward compatible)
- **Size-based Inventory**: Track quantities per size with SKUs and reservations

## API Endpoints

### 1. Get Inventory

**GET** `/api/product/:productId/inventory`

Retrieves current inventory information for a product.

**Headers:**

```
Authorization: Bearer <merchant-jwt-token>
```

**Response:**

```json
{
  "message": "Inventory retrieved successfully",
  "inventory": {
    "productId": "product-id",
    "productName": "Product Name",
    "inventoryType": "size-based",
    "totalStock": 33,
    "totalReserved": 3,
    "availableStock": 30,
    "lowStockThreshold": 5,
    "lowStockAlerts": [
      {
        "size": "S",
        "quantity": 3,
        "threshold": 5
      }
    ],
    "sizeInventory": [
      {
        "size": "S",
        "quantity": 10,
        "reserved": 0,
        "sku": "PROD-S-001",
        "isActive": true
      }
    ],
    "legacyStock": null,
    "trackInventory": true
  }
}
```

### 2. Check Availability

**POST** `/api/product/:productId/availability`

Checks product availability for a specific quantity and size.

**Body:**

```json
{
  "size": "M", // Required for size-based inventory
  "quantity": 2 // Optional, defaults to 1
}
```

**Response:**

```json
{
  "message": "Availability checked successfully",
  "availability": {
    "productId": "product-id",
    "productName": "Product Name",
    "size": "M",
    "requestedQuantity": 2,
    "availableQuantity": 13,
    "available": true,
    "message": "2 units available in size M"
  }
}
```

### 3. Update Inventory

**PUT** `/api/product/:productId/inventory`

Updates inventory settings and quantities.

**Headers:**

```
Authorization: Bearer <merchant-jwt-token>
```

**Body (Size-based Inventory):**

```json
{
  "inventoryType": "size-based",
  "sizeInventory": [
    {
      "size": "S",
      "quantity": 10,
      "reserved": 0,
      "sku": "PROD-S-001",
      "isActive": true
    },
    {
      "size": "M",
      "quantity": 15,
      "reserved": 2,
      "sku": "PROD-M-001",
      "isActive": true
    }
  ],
  "lowStockThreshold": 5,
  "trackInventory": true
}
```

**Body (Legacy Stock):**

```json
{
  "inventoryType": "legacy",
  "legacyStock": 50,
  "lowStockThreshold": 10,
  "trackInventory": true
}
```

## Database Schema

The product model has been enhanced with the following inventory fields:

```javascript
inventory: {
  type: {
    type: String,
    enum: ['legacy', 'size-based'],
    default: 'legacy'
  },
  sizeInventory: [{
    size: { type: String, required: true },
    quantity: { type: Number, default: 0, min: 0 },
    reserved: { type: Number, default: 0, min: 0 },
    sku: { type: String },
    isActive: { type: Boolean, default: true }
  }],
  lowStockThreshold: { type: Number, default: 5 },
  trackInventory: { type: Boolean, default: true }
}
```

## Usage Examples

### Setting up Size-based Inventory

```javascript
// Update product to use size-based inventory
const response = await fetch("/api/product/product-id/inventory", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your-jwt-token",
  },
  body: JSON.stringify({
    inventoryType: "size-based",
    sizeInventory: [
      { size: "XS", quantity: 5, sku: "PROD-XS-001" },
      { size: "S", quantity: 10, sku: "PROD-S-001" },
      { size: "M", quantity: 15, sku: "PROD-M-001" },
      { size: "L", quantity: 12, sku: "PROD-L-001" },
      { size: "XL", quantity: 8, sku: "PROD-XL-001" },
    ],
    lowStockThreshold: 3,
    trackInventory: true,
  }),
});
```

### Checking Availability Before Order

```javascript
// Check if 2 units of size M are available
const availability = await fetch("/api/product/product-id/availability", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    size: "M",
    quantity: 2,
  }),
});

const result = await availability.json();
if (result.availability.available) {
  // Proceed with order
  console.log("Product is available");
} else {
  // Show out of stock message
  console.log(result.availability.message);
}
```

### Managing Legacy Stock

```javascript
// Update legacy stock
const response = await fetch("/api/product/product-id/inventory", {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your-jwt-token",
  },
  body: JSON.stringify({
    inventoryType: "legacy",
    legacyStock: 100,
    lowStockThreshold: 10,
    trackInventory: true,
  }),
});
```

## Helper Functions

The inventory controller includes helper functions for order processing:

### reserveInventory(productId, size, quantity)

Reserves inventory for pending orders.

```javascript
const { reserveInventory } = require("./controller/product/inventory");

const result = await reserveInventory("product-id", "M", 2);
if (result.success) {
  console.log("Inventory reserved successfully");
} else {
  console.log("Failed to reserve:", result.message);
}
```

### releaseInventory(productId, size, quantity)

Releases reserved inventory for cancelled orders.

```javascript
const { releaseInventory } = require("./controller/product/inventory");

const result = await releaseInventory("product-id", "M", 2);
if (result.success) {
  console.log("Reserved inventory released");
} else {
  console.log("Failed to release:", result.message);
}
```

## Migration from Legacy to Size-based

To migrate existing products from legacy stock to size-based inventory:

1. **Get current inventory:**

   ```javascript
   GET /api/product/:productId/inventory
   ```

2. **Update to size-based:**
   ```javascript
   PUT /api/product/:productId/inventory
   {
     "inventoryType": "size-based",
     "sizeInventory": [
       {
         "size": "One Size",
         "quantity": 50,  // Current legacy stock
         "reserved": 0,
         "isActive": true
       }
     ]
   }
   ```

## Error Handling

The API returns appropriate HTTP status codes:

- `200` - Success
- `400` - Bad Request (invalid data)
- `401` - Unauthorized (missing/invalid token)
- `404` - Product not found
- `500` - Server error

Error responses include descriptive messages:

```json
{
  "message": "Size is required for size-based inventory",
  "error": "Validation error details"
}
```

## Testing

Use the provided test script (`test-inventory.js`) to verify the endpoints:

```bash
node test-inventory.js
```

Make sure to:

1. Update the test configuration with actual product ID and JWT token
2. Have your server running
3. Have at least one product in your database

## Best Practices

1. **Always check availability** before processing orders
2. **Use reservations** for pending orders to prevent overselling
3. **Set appropriate low stock thresholds** based on your business needs
4. **Monitor low stock alerts** regularly
5. **Use SKUs** for better inventory tracking and reporting
6. **Keep inventory tracking enabled** for accurate stock management

## Integration with Orders

The inventory system integrates with the order processing workflow:

1. **Order Creation**: Check availability and reserve inventory
2. **Order Confirmation**: Keep reservation or convert to sale
3. **Order Cancellation**: Release reserved inventory
4. **Order Completion**: Deduct from available stock

This ensures accurate stock levels and prevents overselling across all sales channels.

