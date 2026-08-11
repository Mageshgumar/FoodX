import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { MENU_CATALOG, getCategoryForItem, getCategoryTheme } from '../menuCatalog'
import { API_BASE } from '../apiBase'

export default function InventoryPage(){
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({ quantity: 0, threshold: 20, item: '', restaurant: '' })
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [orderedSummary, setOrderedSummary] = useState([])

  useEffect(()=>{ fetchItems() }, [])

  async function fetchItems(){
    setLoading(true)
    setError('')
    try{
      const [inventoryRes, ordersRes] = await Promise.all([
        axios.get(`${API_BASE}/inventory`),
        axios.get(`${API_BASE}/orders`)
      ])
      setItems(buildInventoryRows(inventoryRes.data))
      setOrderedSummary(buildOrderedSummary(ordersRes.data))
    }catch(e){
      console.error(e)
      setError('Failed to load inventory')
    }
    setLoading(false)
  }

  async function save(item){
    setError('')
    setMessage('')
    if (Number(form.quantity) < 0 || Number(form.threshold) < 0 || !form.item.trim() || !form.restaurant.trim()) {
      setError('Enter valid non-negative numbers and non-empty text values')
      return
    }

    setSaving(true)
    try{
      let res
      if (item?._id) {
        res = await axios.patch(`${API_BASE}/inventory/${item._id}`, {
          quantity: Number(form.quantity),
          threshold: Number(form.threshold),
          item: form.item.trim(),
          restaurant: form.restaurant.trim()
        })
      } else {
        res = await axios.post(`${API_BASE}/inventory`, {
          quantity: Number(form.quantity),
          threshold: Number(form.threshold),
          item: form.item.trim(),
          restaurant: form.restaurant.trim()
        })
      }
      if (!res.data || !res.data._id) {
        setError('Inventory save failed')
        return
      }
      setEditing(null)
      setMessage('Inventory updated successfully')
      await fetchItems()
    }catch(e){
      console.error(e)
      setError(e?.response?.data?.error || 'Failed to update inventory')
    }
    setSaving(false)
  }

  function buildOrderedSummary(orders){
    const summaryMap = {}
    for (const order of (orders || [])) {
      if (order.status === 'Cancelled') {
        continue
      }
      for (const orderItem of (order.items || [])) {
        const itemName = typeof orderItem.name === 'string' ? orderItem.name.trim() : ''
        if (!itemName) {
          continue
        }
        const category = getCategoryForItem(itemName)
        const key = `${category}::${itemName}`
        summaryMap[key] = summaryMap[key] || { category, itemName, qty: 0 }
        summaryMap[key].qty += Number(orderItem.qty) || 0
      }
    }
    return Object.values(summaryMap).sort((a, b) => {
      if (a.category === b.category) {
        return a.itemName.localeCompare(b.itemName)
      }
      return a.category.localeCompare(b.category)
    })
  }

  function buildInventoryRows(rawRows){
    const byCategoryAndItem = new Map()
    for (const row of (rawRows || [])) {
      const category = (row.restaurant || '').trim() || getCategoryForItem(row.item)
      const itemName = (row.item || '').trim()
      if (!itemName) {
        continue
      }
      byCategoryAndItem.set(`${category}::${itemName}`, { ...row, restaurant: category, item: itemName })
    }

    const catalogRows = MENU_CATALOG.flatMap((catalog) =>
      catalog.items.map((itemName) => {
        const key = `${catalog.category}::${itemName}`
        const existing = byCategoryAndItem.get(key)
        if (existing) {
          return existing
        }
        return {
          _id: null,
          restaurant: catalog.category,
          item: itemName,
          quantity: 0,
          threshold: 20
        }
      })
    )

    return catalogRows
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Inventory</h2>
        <button onClick={fetchItems} className="px-3 py-1 bg-orange-500 text-white rounded">Refresh</button>
      </div>
      {message && <p className="mb-3 text-sm text-green-700">{message}</p>}
      {error && <p className="mb-3 text-sm text-red-600">{error}</p>}

      <div className="mb-6">
        <h3 className="mb-2 text-md font-semibold">Ordered Food Varieties</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {orderedSummary.map((row) => {
            const theme = getCategoryTheme(row.category)
            return (
              <div key={`${row.category}-${row.itemName}`} className={`rounded-lg border bg-gradient-to-r ${theme.card} p-3`}>
                <p className="font-semibold text-gray-900">{row.itemName}</p>
                <p className="text-sm text-gray-700">{row.category}</p>
                <p className="mt-2 text-sm font-medium text-gray-800">Ordered: {row.qty}</p>
              </div>
            )
          })}
          {orderedSummary.length === 0 && (
            <div className="rounded-lg border border-orange-200 bg-orange-50 p-3 text-sm text-gray-700">
              No ordered food items yet.
            </div>
          )}
        </div>
      </div>

      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50"><tr><th className="px-4 py-2">Category</th><th className="px-4 py-2">Type</th><th className="px-4 py-2">Qty</th><th className="px-4 py-2">Threshold</th><th className="px-4 py-2">Actions</th></tr></thead>
            <tbody>
              {items.map(it=> (
                <tr key={it._id} className="border-t">
                  <td className="px-4 py-2">{it.restaurant}</td>
                  <td className="px-4 py-2">{it.item}</td>
                  <td className="px-4 py-2">{it.quantity}</td>
                  <td className="px-4 py-2">{it.threshold || 20}</td>
                  <td className="px-4 py-2 space-x-2">
                    <button
                      onClick={()=>{
                        setEditing(it)
                        setForm({
                          quantity: it.quantity,
                          threshold: it.threshold || 20,
                          item: it.item || '',
                          restaurant: it.restaurant || ''
                        })
                      }}
                      className="px-2 py-1 bg-sky-500 text-white rounded text-sm"
                    >
                      Edit
                    </button>
                    {it.quantity <= (it.threshold||20) && <span className="text-sm text-red-600 font-semibold">⚠ Low</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="w-full max-w-2xl mt-4 p-4 bg-white rounded shadow">
          <h3 className="font-semibold">Edit Inventory Row</h3>
          <div className="mt-2 grid grid-cols-1 md:grid-cols-4 gap-2">
            <input value={form.restaurant} onChange={(e)=>setForm((prev)=>({ ...prev, restaurant: e.target.value }))} className="border px-2 py-1 rounded" placeholder="Restaurant" />
            <input value={form.item} onChange={(e)=>setForm((prev)=>({ ...prev, item: e.target.value }))} className="border px-2 py-1 rounded" placeholder="Item" />
            <input type="number" min="0" value={form.quantity} onChange={e=>setForm((prev)=>({ ...prev, quantity: e.target.value }))} className="border px-2 py-1 rounded" placeholder="Quantity" />
            <input type="number" min="0" value={form.threshold} onChange={e=>setForm((prev)=>({ ...prev, threshold: e.target.value }))} className="border px-2 py-1 rounded" placeholder="Threshold" />
          </div>
          <div className="mt-3 flex items-center space-x-2">
            <button onClick={()=>save(editing)} disabled={saving} className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-60">{saving ? 'Saving...' : 'Save'}</button>
            <button onClick={()=>setEditing(null)} disabled={saving} className="px-3 py-1 bg-gray-200 rounded">Cancel</button>
          </div>
          </div>
        </div>
      )}
    </div>
  )
}
