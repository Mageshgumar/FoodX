import React, {useEffect, useState} from 'react'
import OrdersPage from './OrdersPage'
import KitchenPage from './KitchenPage'
import InventoryPage from './InventoryPage'
import TablesPage from './TablesPage'

export default function Dashboard(){
  const [tab, setTab] = useState('orders')

  useEffect(()=>{
    document.title = 'FoodX Dashboard'
  },[])

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-orange-500 to-pink-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">FoodX</h1>
          </div>
          <nav className="space-x-2">
            <button onClick={()=>setTab('orders')} className={`px-3 py-2 rounded-md font-medium ${tab==='orders' ? 'bg-white text-orange-600' : 'bg-white/20'}`}>Orders</button>
            <button onClick={()=>setTab('kitchen')} className={`px-3 py-2 rounded-md font-medium ${tab==='kitchen' ? 'bg-white text-orange-600' : 'bg-white/20'}`}>Kitchen</button>
            <button onClick={()=>setTab('inventory')} className={`px-3 py-2 rounded-md font-medium ${tab==='inventory' ? 'bg-white text-orange-600' : 'bg-white/20'}`}>Inventory</button>
            <button onClick={()=>setTab('tables')} className={`px-3 py-2 rounded-md font-medium ${tab==='tables' ? 'bg-white text-orange-600' : 'bg-white/20'}`}>Tables</button>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {tab === 'orders' && <OrdersPage />}
        {tab === 'kitchen' && <KitchenPage />}
        {tab === 'inventory' && <InventoryPage />}
        {tab === 'tables' && <TablesPage />}
      </main>

      <footer className="text-center py-6 text-sm text-gray-500">Prototype — expand modules for Chefs, Waste, Revenue, Analytics</footer>
    </div>
  )
}
