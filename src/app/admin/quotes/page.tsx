"use client"
import { useEffect, useState } from 'react'
import Link from 'next/link'

export default function AdminQuotes(){
  const [quotes, setQuotes] = useState<any[]>([])
  const [clients, setClients] = useState<any[]>([])
  const [form, setForm] = useState({ title:'', client_id:'' })

  function authHeaders(){ const headers: any = { 'Content-Type':'application/json' }; const token = localStorage.getItem('adminToken'); if(token) headers['x-admin-token'] = token; return headers }

  useEffect(()=>{ load() },[])
  async function load(){ const { API_BASE } = await import('../../../lib/apiBase'); const r1 = await fetch(`${API_BASE}/api/admin/quotes`, { headers: authHeaders() }); const j1 = await r1.json(); setQuotes(j1.quotes||[]); const r2 = await fetch(`${API_BASE}/api/admin/clients`, { headers: authHeaders() }); const j2 = await r2.json(); setClients(j2.clients||[]) }

  async function create(){ const payload = { title: form.title, client_id: form.client_id }; const { API_BASE } = await import('../../../lib/apiBase'); const res = await fetch(`${API_BASE}/api/admin/quotes`, { method:'POST', headers: authHeaders(), body: JSON.stringify(payload) }); const json = await res.json(); if(json?.quote) setQuotes(prev=>[...prev, json.quote]); else if(json?.error) alert('Erro: ' + json.error) }
  async function send(id:string){ const { API_BASE } = await import('../../../lib/apiBase'); const res = await fetch(`${API_BASE}/api/admin/quotes/${id}/send`, { method:'POST', headers: authHeaders() }); const j = await res.json(); if(j.ok) alert('Token gerado: ' + j.token); else alert('Erro: ' + (j.error||'')) }
  async function remove(id:string){ if(!confirm('Excluir orçamento?')) return; const { API_BASE } = await import('../../../lib/apiBase'); const res = await fetch(`${API_BASE}/api/admin/quotes/${id}`, { method:'DELETE', headers: authHeaders() }); const j = await res.json(); if(j.ok) setQuotes(prev=>prev.filter(q=>q.id!==id)); else alert('Erro') }

  return (
    <div style={{padding:20}}>
      <h2>Orçamentos</h2>
      <div style={{display:'flex', gap:8, marginBottom:12}}>
        <input placeholder="Título" value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
        <select value={form.client_id} onChange={e=>setForm({...form, client_id: e.target.value})}>
          <option value="">-- selecionar cliente --</option>
          {clients.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <button onClick={create}>Criar</button>
      </div>
      <ul>
        {quotes.map(q=> (
          <li key={q.id} style={{marginBottom:8}}>{q.title} — {q.client_id} — <Link href={`/admin/quote/${q.id}`}>Abrir</Link> — <button onClick={()=>send(q.id)}>Enviar</button> — <button onClick={()=>remove(q.id)}>Excluir</button></li>
        ))}
      </ul>
    </div>
  )
}
