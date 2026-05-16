'use client'
import React, { useState } from 'react'

export default function DespesaForm({ initial, onSaved } : { initial?: any, onSaved?: (d:any)=>void }){
  const [form, setForm] = useState(initial || { title:'', value:0, category_id: null })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: any){
    e.preventDefault();
    setSaving(true)
    try{
      const method = form.id ? 'PUT' : 'POST'
      const url = form.id ? `/api/despesas/${form.id}` : '/api/despesas'
      const res = await fetch(url, { method, headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) })
      const json = await res.json()
      if(onSaved) onSaved(json)
      alert('Salvo')
    }catch(e){ console.error(e); alert('Erro') }
    finally{ setSaving(false) }
  }

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label>Título</label>
        <input value={form.title} onChange={e=>setForm({...form, title: e.target.value})} />
      </div>
      <div>
        <label>Valor</label>
        <input type="number" value={form.value} onChange={e=>setForm({...form, value: Number(e.target.value)})} />
      </div>
      <button type="submit" disabled={saving}>Salvar</button>
    </form>
  )
}
