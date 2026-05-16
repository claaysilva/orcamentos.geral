"use client"
import { useEffect, useState } from 'react'

export default function AdminClients(){
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({ name:'', cnpj:'', contact_email:'' })
  const [loading, setLoading] = useState(false)

  function authHeaders(){
    const headers: any = { 'Content-Type':'application/json' }
    const token = localStorage.getItem('adminToken')
    if(token) headers['x-admin-token'] = token
    return headers
  }

  useEffect(()=>{ loadClients() },[])

  async function loadClients(){
    try{
      const { API_BASE } = await import('../../../lib/apiBase')
      const res = await fetch(`${API_BASE}/api/admin/clients`, { headers: authHeaders() })
      const json = await res.json()
      if(json?.clients) setClients(json.clients)
    }catch(e){ console.error(e) }
  }

  async function handleCreate(e:any){
    e.preventDefault(); setLoading(true)
    try{
      const { API_BASE } = await import('../../../lib/apiBase')
      const res = await fetch(`${API_BASE}/api/admin/clients`, { method:'POST', headers: authHeaders(), body: JSON.stringify(form) })
      const json = await res.json()
      if(json?.client){ setClients(prev=>[...prev, json.client]); setForm({ name:'', cnpj:'', contact_email:'' }) }
      else if(json?.error) alert('Erro: ' + json.error)
    }catch(err){ console.error(err); alert('Erro') }
    finally{ setLoading(false) }
  }

  async function handleDelete(id:string){
    if(!confirm('Confirmar exclusão do cliente?')) return;
    const { API_BASE } = await import('../../../lib/apiBase')
    const res = await fetch(`${API_BASE}/api/admin/clients/${id}`, { method:'DELETE', headers: authHeaders() });
    const j = await res.json(); if(j.ok) setClients(prev=>prev.filter(c=>c.id!==id)); else alert('Erro');
  }

  async function handleUpdate(id:string, patch:any){
    const { API_BASE } = await import('../../../lib/apiBase')
    const res = await fetch(`${API_BASE}/api/admin/clients/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(patch) });
    const j = await res.json(); if(j.client) setClients(prev=>prev.map(c=> c.id===id ? j.client : c)); else alert('Erro');
  }

  return (
    <div style={{padding:20}}>
      <h2>Clientes</h2>
      <form onSubmit={handleCreate} style={{marginBottom:12}}>
        <input placeholder="Nome" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        <input placeholder="CNPJ" value={form.cnpj} onChange={e=>setForm({...form, cnpj:e.target.value})} required />
        <input placeholder="Email" value={form.contact_email} onChange={e=>setForm({...form, contact_email:e.target.value})} />
        <button type="submit" disabled={loading}>Criar</button>
      </form>
      <ul>
        {clients.map(c=> (
          <li key={c.id} style={{marginBottom:8}}>
            <input defaultValue={c.name} onBlur={e=>handleUpdate(c.id, { name: e.target.value })} />
            <input defaultValue={c.contact_email} onBlur={e=>handleUpdate(c.id, { contact_email: e.target.value })} />
            <button onClick={()=>handleDelete(c.id)}>Excluir</button>
          </li>
        ))}
      </ul>
    </div>
  )
}
