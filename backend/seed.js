require('dotenv').config();
const mongoose = require('mongoose');

const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/foodx';

async function main(){
  await mongoose.connect(mongoUri, { });
  console.log('Connected to', mongoUri);

  const { Schema } = mongoose;

  const OrderSchema = new Schema({
    orderId: String,
    restaurant: String,
    status: { type: String, default: 'New' },
    items: [{ name: String, qty: Number }],
    createdAt: { type: Date, default: Date.now }
  });
  const InventorySchema = new Schema({
    restaurant: String,
    item: String,
    quantity: Number,
    threshold: Number
  });
  const TableSchema = new Schema({
    tableNumber: Number,
    status: { type: String, enum: ['Available','Occupied','Reserved'], default: 'Available' }
  });

  const Order = mongoose.model('Order', OrderSchema);
  const Inventory = mongoose.model('Inventory', InventorySchema);
  const Table = mongoose.model('Table', TableSchema);

  // Clear app collections so dashboard reflects fresh seed data
  await Order.deleteMany({});
  await Inventory.deleteMany({});
  await Table.deleteMany({});

  const menuCatalog = [
    {
      restaurant: 'Burger',
      items: ['Chicken Burger', 'Veg Burger', 'Mushroom Burger', 'Paneer Burger']
    },
    {
      restaurant: 'Ice Cream',
      items: ['Vanilla', 'Strawberry', 'Pista', 'Butterscotch', 'Chocolate']
    },
    {
      restaurant: 'Pizza',
      items: ['Margherita', 'Farmhouse', 'Pepperoni', 'Mushroom']
    },
    {
      restaurant: 'Juice',
      items: ['Orange Juice', 'Mango Juice', 'Watermelon Juice', 'Pineapple Juice']
    }
  ];

  // Seed inventory from the same menu used by the app
  const inventoryDocs = [];
  for (const category of menuCatalog) {
    for (const itemName of category.items) {
      inventoryDocs.push({
        restaurant: category.restaurant,
        item: itemName,
        quantity: randomInt(20, 220),
        threshold: 20
      });
    }
  }
  await Inventory.insertMany(inventoryDocs);
  console.log('Inserted inventory items:', inventoryDocs.length);

  // Seed tables: total 120
  const tableDocs = [];
  const totalTables = 120;
  const occupied = 95;
  const reserved = 8;
  const available = totalTables - occupied - reserved;
  let idx = 1;
  for(let i=0;i<occupied;i++,idx++) tableDocs.push({ tableNumber: idx, status: 'Occupied' });
  for(let i=0;i<available;i++,idx++) tableDocs.push({ tableNumber: idx, status: 'Available' });
  for(let i=0;i<reserved;i++,idx++) tableDocs.push({ tableNumber: idx, status: 'Reserved' });
  await Table.insertMany(tableDocs);
  console.log('Inserted tables:', tableDocs.length);

  // Seed orders with a distribution across hours (simulate peak at 13:00)
  // Distribution: 10:00->5,11:00->10,12:00->50,13:00->100,14:00->80,15:00->30 => total 275
  const hours = [{h:10,c:5},{h:11,c:10},{h:12,c:50},{h:13,c:100},{h:14,c:80},{h:15,c:30}];
  const orderDocs = [];
  let ordinal = 1000;
  const today = new Date();
  for(const bucket of hours){
    for(let i=0;i<bucket.c;i++){
      const minute = randomInt(0,59);
      const second = randomInt(0,59);
      const createdAt = new Date(today.getFullYear(), today.getMonth(), today.getDate(), bucket.h, minute, second);
      const category = menuCatalog[randomInt(0, menuCatalog.length - 1)];
      const restaurant = category.restaurant;
      const status = pickStatusForHour(bucket.h);
      const items = [
        {
          name: category.items[randomInt(0, category.items.length - 1)],
          qty: randomInt(1, 3)
        }
      ];
      orderDocs.push({ orderId: `#${++ordinal}`, restaurant, status, items, createdAt });
    }
  }
  await Order.insertMany(orderDocs);
  console.log('Inserted orders:', orderDocs.length);

  console.log('Seeding complete. Summary:');
  console.log('Restaurants:', menuCatalog.length);
  console.log('Inventory items:', inventoryDocs.length);
  console.log('Tables:', tableDocs.length);
  console.log('Orders:', orderDocs.length);

  await mongoose.disconnect();
  process.exit(0);
}

function randomInt(min, max){ return Math.floor(Math.random()*(max-min+1))+min }
function pickStatusForHour(h){
  // closer to peak hours, more new/preparing orders
  if(h === 13) return pick(['New','Preparing','Preparing','Ready','New','Preparing']);
  if(h === 12) return pick(['Preparing','Preparing','Ready','Ready','Delivered']);
  if(h === 14) return pick(['Preparing','Ready','Ready','Delivered']);
  if(h <= 11) return pick(['Delivered','Ready','Delivered']);
  return pick(['Ready','Delivered','Preparing']);
}
function pick(arr){ return arr[Math.floor(Math.random()*arr.length)] }

main().catch(err=>{ console.error(err); process.exit(1) });
