import React, {useEffect, useState} from 'react'
import axios from 'axios'
import { API_BASE } from '../apiBase'

export default function TablesPage(){
  const [tables, setTables] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(()=>{ fetchTables() }, [])

  async function fetchTables(){
    setIsLoading(true)
    setError('')
    try{
      const res = await axios.get(`${API_BASE}/tables`)
      if (!Array.isArray(res.data)) {
        throw new Error('The tables response was not a list')
      }
      setTables(res.data)
    }catch(e){
      console.error(e)
      setTables([])
      setError('Unable to load table details. Check that the backend and database are running, then try again.')
    }finally{
      setIsLoading(false)
    }
  }

  async function updateTable(id, status){
    setError('')
    try{
      await axios.patch(`${API_BASE}/tables/${id}`, { status })
      fetchTables()
    }catch(e){
      console.error(e)
      setError('Unable to update this table. Please try again.')
    }
  }

  function getStatusLabel(status){
    return status === 'Available' ? 'Vacant' : status
  }

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold">Tables</h2>
        <button onClick={fetchTables} className="px-3 py-1 bg-orange-500 text-white rounded">Refresh</button>
      </div>

      {error && (
        <div role="alert" className="mb-4 rounded border border-red-200 bg-red-50 px-4 py-3 text-red-700">
          {error}
        </div>
      )}

      {isLoading ? (
        <p className="rounded-lg border bg-white p-6 text-center text-gray-600">Loading table details...</p>
      ) : tables.length === 0 ? (
        <p className="rounded-lg border bg-white p-6 text-center text-gray-600">
          No tables have been configured yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-6">
          {tables.map(t=> (
            <div key={t._id} className={`rounded-lg border p-3 text-center ${t.status==='Occupied' ? 'bg-red-100' : t.status==='Reserved' ? 'bg-yellow-100' : 'bg-green-50'}`}>
              <div className="font-semibold">Table {t.tableNumber}</div>
              <div className="text-sm text-gray-600">{getStatusLabel(t.status)}</div>
              <div className="mt-2 flex flex-wrap justify-center gap-1">
                <button onClick={()=>updateTable(t._id,'Available')} className="rounded bg-green-500 px-2 py-1 text-sm text-white">Free</button>
                <button onClick={()=>updateTable(t._id,'Occupied')} className="rounded bg-red-500 px-2 py-1 text-sm text-white">Occupy</button>
                <button onClick={()=>updateTable(t._id,'Reserved')} className="rounded bg-yellow-400 px-2 py-1 text-sm">Reserve</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
