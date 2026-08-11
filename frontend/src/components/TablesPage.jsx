import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { API_BASE } from '../apiBase'

export default function TablesPage(){
  const [tables, setTables] = useState([])

  useEffect(()=>{ fetchTables() }, [])

  async function fetchTables(){
    try{
      const res = await axios.get(`${API_BASE}/tables`)
      setTables(res.data)
    }catch(e){ console.error(e) }
  }

  async function updateTable(id, status){
    try{
      await axios.patch(`${API_BASE}/tables/${id}`, { status })
      fetchTables()
    }catch(e){ console.error(e) }
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tables</h2>
        <button onClick={fetchTables} className="px-3 py-1 bg-orange-500 text-white rounded">Refresh</button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {tables.map(t=> (
          <div key={t._id} className={`p-3 rounded-lg text-center ${t.status==='Occupied' ? 'bg-red-100' : t.status==='Reserved' ? 'bg-yellow-100' : 'bg-green-50'} border` }>
            <div className="font-semibold">Table {t.tableNumber}</div>
            <div className="text-sm text-gray-600">{t.status}</div>
            <div className="mt-2 space-x-1">
              <button onClick={()=>updateTable(t._id,'Available')} className="px-2 py-1 bg-green-500 text-white rounded text-sm">Free</button>
              <button onClick={()=>updateTable(t._id,'Occupied')} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Occupy</button>
              <button onClick={()=>updateTable(t._id,'Reserved')} className="px-2 py-1 bg-yellow-400 rounded text-sm">Reserve</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
