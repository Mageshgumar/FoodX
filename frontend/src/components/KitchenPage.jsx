import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { getCategoryForItem } from '../menuCatalog'
import { API_BASE } from '../apiBase'

export default function KitchenPage(){
  const [orders, setOrders] = useState([])
  const [grouped, setGrouped] = useState({})

  useEffect(()=>{ fetchOrders() }, [])

  async function fetchOrders(){
    try{
      const res = await axios.get(`${API_BASE}/orders`)
      setOrders(res.data)
      const g = {}
      for(const o of res.data){
        if (o.status !== 'Preparing') {
          continue
        }
        for (const orderItem of (o.items || [])) {
          const category = getCategoryForItem(orderItem.name)
          g[category] = g[category] || { preparing: 0 }
          g[category].preparing += Number(orderItem.qty) || 0
        }
      }
      setGrouped(g)
    }catch(e){ console.error(e) }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Kitchen Overview</h2>
        <button onClick={fetchOrders} className="px-3 py-1 bg-orange-500 text-white rounded">Refresh</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Object.keys(grouped).length === 0 && <p>No preparing items available</p>}
        {Object.entries(grouped).map(([name, stats])=> (
          <div key={name} className="p-4 rounded-lg shadow bg-white">
            <h3 className="text-lg font-semibold">{name}</h3>
            <p className="text-sm text-gray-600">Currently Preparing: <strong>{stats.preparing}</strong></p>
          </div>
        ))}
      </div>

      <div className="mt-6">
        <h3 className="text-md font-semibold mb-2">Raw Orders (latest)</h3>
        <div className="bg-white rounded shadow overflow-auto">
          <table className="min-w-full">
            <thead className="bg-gray-50"><tr><th className="px-4 py-2">Order</th><th className="px-4 py-2">Restaurant</th><th className="px-4 py-2">Status</th><th className="px-4 py-2">Time</th></tr></thead>
            <tbody>
              {orders.slice(0,200).map(o=> (
                <tr key={o._id} className="border-t"><td className="px-4 py-2">{o.orderId || o._id.slice(-6)}</td><td className="px-4 py-2">{o.restaurant}</td><td className="px-4 py-2">{o.status}</td><td className="px-4 py-2">{new Date(o.createdAt).toLocaleTimeString()}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
