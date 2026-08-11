import React, {useEffect, useMemo, useState} from 'react'
import axios from 'axios'
import { MENU_CATALOG, getItemsForCategory, getCategoryForItem, getCategoryTheme } from '../menuCatalog'
import { API_BASE } from '../apiBase'

export default function OrdersPage(){
  const [orders, setOrders] = useState([])
  const [inventory, setInventory] = useState([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [ready, setReady] = useState(false)
  const [form, setForm] = useState({
    category: MENU_CATALOG[0].category,
    itemName: MENU_CATALOG[0].items[0],
    qty: 1
  })

  const availableItems = getItemsForCategory(form.category)
  const inventoryByKey = useMemo(() => {
    const map = new Map()
    for (const row of inventory) {
      const category = typeof row.restaurant === 'string' ? row.restaurant.trim() : ''
      const item = typeof row.item === 'string' ? row.item.trim() : ''
      if (!category || !item) {
        continue
      }
      map.set(`${category}::${item}`, Number(row.quantity) || 0)
    }
    return map
  }, [inventory])

  const selectedItemQuantity = inventoryByKey.get(`${form.category}::${form.itemName}`) ?? 0
  const isSelectedItemExhausted = selectedItemQuantity <= 0

  useEffect(()=>{
    initializeFreshOrders()
  }, [])

  useEffect(() => {
    if (availableItems.length > 0 && !availableItems.includes(form.itemName)) {
      setForm((prev) => ({ ...prev, itemName: availableItems[0] }))
    }
    if (availableItems.length === 0) {
      setForm((prev) => ({ ...prev, itemName: '' }))
    }
  }, [form.category])

  async function initializeFreshOrders(){
    setLoading(true)
    setError('')
    try {
      const isFreshInitialized = window.localStorage.getItem('foodx-fresh-orders-initialized')
      if (!isFreshInitialized) {
        await axios.delete(`${API_BASE}/orders`)
        window.localStorage.setItem('foodx-fresh-orders-initialized', 'true')
      }
      await fetchData()
      setReady(true)
    } catch (e) {
      console.error(e)
      setError('Failed to initialize fresh orders')
      setLoading(false)
    }
  }

  async function fetchData(){
    try{
      const [ordersRes, inventoryRes] = await Promise.all([
        axios.get(`${API_BASE}/orders`),
        axios.get(`${API_BASE}/inventory`)
      ])
      setOrders(ordersRes.data)
      setInventory(inventoryRes.data)
    }catch(e){
      console.error(e)
      setError('Failed to load orders data')
    }
    setLoading(false)
  }

  async function fetchOrders(){
    try {
      const res = await axios.get(`${API_BASE}/orders`)
      setOrders(res.data)
    } catch (e) {
      console.error(e)
      setError('Failed to refresh orders')
    }
  }

  async function updateStatus(id, status){
    setError('')
    try{
      await axios.patch(`${API_BASE}/orders/${id}`, { status })
      await fetchOrders()
    }catch(e){
      console.error(e)
      setError(e?.response?.data?.error || `Failed to update status to ${status}`)
    }
  }

  async function addOrder(e){
    e.preventDefault()
    setError('')
    if (!form.itemName || Number(form.qty) <= 0) {
      setError('Select a food item and enter valid quantity')
      return
    }
    if (isSelectedItemExhausted) {
      setError(`${form.itemName} is exhausted. Please choose another item.`)
      return
    }
    if (Number(form.qty) > selectedItemQuantity) {
      setError(`Only ${selectedItemQuantity} ${form.itemName} available in inventory.`)
      return
    }

    setSubmitting(true)
    try{
      await axios.post(`${API_BASE}/orders`, {
        orderId: `#${Date.now().toString().slice(-6)}`,
        restaurant: form.category,
        status: 'Preparing',
        items: [{ name: form.itemName, qty: Number(form.qty) }]
      })
      setShowAddModal(false)
      await fetchData()
    }catch(e){
      console.error(e)
      setError(e?.response?.data?.error || 'Failed to place order')
    }
    setSubmitting(false)
  }

  function actionButtonClass(orderStatus, buttonStatus, activeClass, inactiveClass) {
    return `px-2 py-1 rounded text-sm ${orderStatus === buttonStatus ? activeClass : inactiveClass}`
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Recent Orders</h2>
        <div className="flex items-center gap-2">
          <button onClick={()=>setShowAddModal(true)} className="px-3 py-1 bg-emerald-600 text-white rounded">Add Order</button>
          <button onClick={fetchData} className="px-3 py-1 bg-orange-500 text-white rounded">Refresh</button>
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <form onSubmit={addOrder} className="w-full max-w-lg bg-white rounded-lg shadow-lg p-5">
            <h3 className="text-lg font-semibold mb-3">Place New Order</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Food Category</label>
                <select
                  value={form.category}
                  onChange={(e)=>setForm((prev)=>({ ...prev, category: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                >
                  {MENU_CATALOG.map((row) => (
                    <option key={row.category} value={row.category}>{row.category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Food Variety</label>
                <select
                  value={form.itemName}
                  onChange={(e)=>setForm((prev)=>({ ...prev, itemName: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                  disabled={availableItems.length === 0}
                >
                  {availableItems.length === 0 && <option value="">No items available</option>}
                  {availableItems.map((name) => (
                    <option key={name} value={name}>{name}</option>
                  ))}
                </select>
                {form.itemName && (
                  <p className={`mt-1 text-xs ${isSelectedItemExhausted ? 'text-red-600 font-semibold' : 'text-gray-600'}`}>
                    {isSelectedItemExhausted
                      ? `${form.itemName} is exhausted`
                      : `Available: ${selectedItemQuantity}`}
                  </p>
                )}
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  min="1"
                  value={form.qty}
                  onChange={(e)=>setForm((prev)=>({ ...prev, qty: e.target.value }))}
                  className="w-full border rounded px-3 py-2"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <button type="button" onClick={()=>setShowAddModal(false)} className="px-3 py-1 bg-gray-200 rounded">Close</button>
              <button type="submit" disabled={submitting || availableItems.length === 0 || isSelectedItemExhausted} className="px-3 py-1 bg-orange-500 text-white rounded disabled:opacity-60">
                {submitting ? 'Placing...' : 'Add'}
              </button>
            </div>
          </form>
        </div>
      )}

      {loading || !ready ? <p>Loading...</p> : (
        <>
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {orders.slice(0,12).map((o) => {
              const inferredCategory = o.restaurant || getCategoryForItem(o?.items?.[0]?.name)
              const theme = getCategoryTheme(inferredCategory)
              return (
                <div key={`card-${o._id}`} className={`rounded-xl border bg-gradient-to-r ${theme.card} p-4 shadow-sm`}>
                  <div className="mb-2 flex items-center justify-between">
                    <p className="font-semibold text-gray-900">{o.orderId || o._id.slice(-6)}</p>
                    <span className={`rounded-full px-2 py-1 text-xs font-semibold ${theme.badge}`}>{inferredCategory}</span>
                  </div>
                  <p className="text-sm text-gray-700">{(o.items || []).map((it) => `${it.name} x${it.qty}`).join(', ') || '-'}</p>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="rounded bg-white/70 px-2 py-1 text-xs font-medium text-gray-700">{o.status}</span>
                    <span className="text-xs text-gray-700">{new Date(o.createdAt).toLocaleTimeString()}</span>
                  </div>
                </div>
              )
            })}
            {orders.length === 0 && (
              <div className="rounded-xl border border-orange-200 bg-gradient-to-r from-orange-50 to-pink-50 p-5 text-sm text-gray-700">
                No orders yet. Add a new food item to start fresh.
              </div>
            )}
          </div>

        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium">Order</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Food Items</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Time</th>
                <th className="px-4 py-2 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0,50).map(o => (
                <tr key={o._id} className="border-t">
                  <td className="px-4 py-3">{o.orderId || o._id.slice(-6)}</td>
                  <td className="px-4 py-3">{(o.items || []).map((it) => `${it.name} x${it.qty}`).join(', ') || '-'}</td>
                  <td className="px-4 py-3">{o.status}</td>
                  <td className="px-4 py-3">{new Date(o.createdAt).toLocaleTimeString()}</td>
                  <td className="px-4 py-3 space-x-2">
                    <button
                      onClick={()=>updateStatus(o._id,'Preparing')}
                      className={actionButtonClass(o.status, 'Preparing', 'bg-yellow-500 text-white ring-2 ring-yellow-700', 'bg-yellow-200')}
                    >
                      Preparing
                    </button>
                    <button
                      onClick={()=>updateStatus(o._id,'Ready')}
                      className={actionButtonClass(o.status, 'Ready', 'bg-green-600 text-white ring-2 ring-green-800', 'bg-green-500 text-white opacity-80')}
                    >
                      Ready
                    </button>
                    <button
                      onClick={()=>updateStatus(o._id,'Delivered')}
                      className={actionButtonClass(o.status, 'Delivered', 'bg-sky-700 text-white ring-2 ring-sky-900', 'bg-sky-600 text-white opacity-80')}
                    >
                      Delivered
                    </button>
                    <button
                      onClick={()=>updateStatus(o._id,'Cancelled')}
                      className={actionButtonClass(o.status, 'Cancelled', 'bg-red-700 text-white ring-2 ring-red-900', 'bg-red-500 text-white opacity-80')}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  )
}
