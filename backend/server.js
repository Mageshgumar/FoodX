const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodx';
mongoose.connect(mongoUri)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connect error', err));

// Simple models (expand later)
const { Schema } = mongoose;

const OrderSchema = new Schema({
  orderId: String,
  restaurant: String,
  status: { type: String, default: 'New' },
  items: [{ name: String, qty: Number }],
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model('Order', OrderSchema);

const InventorySchema = new Schema({
  restaurant: String,
  item: String,
  quantity: Number,
  threshold: Number
});
const Inventory = mongoose.model('Inventory', InventorySchema);

const TableSchema = new Schema({
  tableNumber: Number,
  status: { type: String, enum: ['Available','Occupied','Reserved'], default: 'Available' }
});
const Table = mongoose.model('Table', TableSchema);

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Orders
app.get('/api/orders', async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 }).limit(200);
  res.json(orders);
});
app.delete('/api/orders', async (req, res) => {
  const result = await Order.deleteMany({});
  res.json({ deletedCount: result.deletedCount });
});
app.post('/api/orders', async (req, res) => {
  const { restaurant, items } = req.body;
  if (!restaurant || typeof restaurant !== 'string') {
    return res.status(400).json({ error: 'restaurant is required' });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'items must contain at least one entry' });
  }

  const normalizedItems = items
    .map((entry) => ({
      name: typeof entry.name === 'string' ? entry.name.trim() : '',
      qty: Number(entry.qty)
    }))
    .filter((entry) => entry.name && Number.isFinite(entry.qty) && entry.qty > 0);

  if (normalizedItems.length === 0) {
    return res.status(400).json({ error: 'items contain invalid values' });
  }

  for (const orderItem of normalizedItems) {
    const stockRow = await Inventory.findOne({ restaurant, item: orderItem.name });
    if (!stockRow || stockRow.quantity <= 0) {
      return res.status(400).json({ error: `${orderItem.name} is exhausted` });
    }
    if (stockRow.quantity < orderItem.qty) {
      return res.status(400).json({ error: `insufficient stock for ${orderItem.name}. available=${stockRow.quantity}` });
    }
  }

  for (const orderItem of normalizedItems) {
    await Inventory.findOneAndUpdate(
      { restaurant, item: orderItem.name },
      { $inc: { quantity: -orderItem.qty } },
      { new: true }
    );
  }

  const o = new Order({
    ...req.body,
    restaurant,
    items: normalizedItems,
    status: req.body.status || 'Preparing'
  });
  await o.save();
  res.status(201).json(o);
});
app.patch('/api/orders/:id', async (req, res) => {
  const payload = {};
  if (req.body.status !== undefined) {
    const allowed = ['New', 'Preparing', 'Ready', 'Delivered', 'Cancelled'];
    if (!allowed.includes(req.body.status)) {
      return res.status(400).json({ error: 'invalid order status' });
    }
    payload.status = req.body.status;
  }
  const o = await Order.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!o) {
    return res.status(404).json({ error: 'order not found' });
  }
  res.json(o);
});

// Inventory
app.get('/api/inventory', async (req, res) => {
  const inv = await Inventory.find();
  res.json(inv);
});
app.post('/api/inventory', async (req, res) => {
  const i = new Inventory(req.body);
  await i.save();
  res.status(201).json(i);
});

// Tables
app.get('/api/tables', async (req, res) => {
  const t = await Table.find();
  res.json(t);
});
app.post('/api/tables', async (req, res) => {
  const t = new Table(req.body);
  await t.save();
  res.status(201).json(t);
});
app.patch('/api/tables/:id', async (req, res) => {
  const t = await Table.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(t);
});

// Inventory patch
app.patch('/api/inventory/:id', async (req, res) => {
  const payload = {};
  if (req.body.quantity !== undefined) {
    const quantity = Number(req.body.quantity);
    if (!Number.isFinite(quantity) || quantity < 0) {
      return res.status(400).json({ error: 'quantity must be a non-negative number' });
    }
    payload.quantity = quantity;
  }
  if (req.body.threshold !== undefined) {
    const threshold = Number(req.body.threshold);
    if (!Number.isFinite(threshold) || threshold < 0) {
      return res.status(400).json({ error: 'threshold must be a non-negative number' });
    }
    payload.threshold = threshold;
  }
  if (req.body.item !== undefined) {
    if (typeof req.body.item !== 'string' || !req.body.item.trim()) {
      return res.status(400).json({ error: 'item must be a non-empty string' });
    }
    payload.item = req.body.item.trim();
  }
  if (req.body.restaurant !== undefined) {
    if (typeof req.body.restaurant !== 'string' || !req.body.restaurant.trim()) {
      return res.status(400).json({ error: 'restaurant must be a non-empty string' });
    }
    payload.restaurant = req.body.restaurant.trim();
  }

  if (Object.keys(payload).length === 0) {
    return res.status(400).json({ error: 'no valid fields to update' });
  }

  const i = await Inventory.findByIdAndUpdate(req.params.id, payload, { new: true });
  if (!i) {
    return res.status(404).json({ error: 'inventory row not found' });
  }
  res.json(i);
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`Backend listening on ${port}`));
