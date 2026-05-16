'use client'
import React, { useState } from 'react'

export default function CategoriaForm({ initial, onSaved } : { initial?: any, onSaved?: (d:any)=>void }){
  const [form, setForm] = useState(initial || { name:'' })
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e: any){
    e.preventDefault();
    setSaving(true)
    try{
      const method = form.id ? 'PUT' : 'POST'
      const url = form.id ? `/api/categorias/${form.id}` : '/api/categorias'
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
        <label>Nome</label>
        <input value={form.name} onChange={e=>setForm({...form, name: e.target.value})} />
      </div>
      <button type="submit" disabled={saving}>Salvar</button>
    </form>
  )
}
