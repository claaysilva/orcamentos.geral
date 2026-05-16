"use client"
import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

export default function QuoteEditor(){
  const params: any = useParams()
  const id = params?.id
  const [quote, setQuote] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const adminToken = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : ''

  useEffect(()=>{
    if(id){
      const headers: any = { 'Content-Type':'application/json' }
      if(adminToken) headers['x-admin-token'] = adminToken
      ;(async ()=>{
        const { API_BASE } = await import('../../../../lib/apiBase')
        const res = await fetch(`${API_BASE}/api/admin/quotes/${id}`, { headers })
        const j = await res.json()
        setQuote(j.quote||null)
      })()
    }
  },[id])

  function addItem(){ setQuote(prev=> ({ ...prev, items: [...(prev.items||[]), { title:'Novo item', price:0, discount:0, quantity:1 }] })) }
  function removeItem(idx){ setQuote(prev=>{ const items = [...(prev.items||[])]; items.splice(idx,1); return {...prev, items}; }) }
  function computeTotals(q){ const items = q.items || []; const subtotal = items.reduce((s:any,it:any)=> s + (Number(it.price)||0) * (Number(it.quantity)||1), 0); const discount_total = items.reduce((s:any,it:any)=> s + (Number(it.discount)||0), 0); const total = Math.max(subtotal - discount_total, 0); return { subtotal, discount_total, total } }

  async function save(){
    setLoading(true);
    try{
      const totals = computeTotals(quote);
      const payload = { ...quote, subtotal: totals.subtotal, discount_total: totals.discount_total, total: totals.total, items: quote.items };
      const headers: any = { 'Content-Type':'application/json' };
      if(adminToken) headers['x-admin-token'] = adminToken;
      const { API_BASE } = await import('../../../../lib/apiBase')
      const res = await fetch(`${API_BASE}/api/admin/quotes/${id}`, { method:'PUT', headers, body: JSON.stringify(payload) });
      const j = await res.json();
      setQuote(j.quote);
      alert('Salvo')
    }catch(e){ console.error(e); alert('Erro') }
    setLoading(false)
  }

  if(!quote) return <div style={{padding:20}}>Carregando...</div>

  return (
    <div style={{padding:20}}>
      <h2>Editor: {quote.title}</h2>
      <div style={{marginBottom:12}}>
        <label>Título</label>
        <input value={quote.title} onChange={e=>setQuote({...quote, title: e.target.value})} />
      </div>
      <div>
        <h3>Items</h3>
        <button onClick={addItem}>Adicionar item</button>
        <ul>
          {(quote.items||[]).map((it:any, idx:number)=>(
            <li key={idx} style={{marginBottom:8}}>
              <input value={it.title} onChange={e=>{ const items = [...quote.items]; items[idx].title = e.target.value; setQuote({...quote, items}); }} />
              <input type="number" value={it.price} onChange={e=>{ const items = [...quote.items]; items[idx].price = Number(e.target.value); setQuote({...quote, items}); }} />
              <input type="number" value={it.discount} onChange={e=>{ const items = [...quote.items]; items[idx].discount = Number(e.target.value); setQuote({...quote, items}); }} />
              <input type="number" value={it.quantity||1} onChange={e=>{ const items = [...quote.items]; items[idx].quantity = Number(e.target.value); setQuote({...quote, items}); }} />
              <button onClick={()=>removeItem(idx)}>Remover</button>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <strong>Subtotal:</strong> R$ {computeTotals(quote).subtotal} — <strong>Total descontos:</strong> R$ {computeTotals(quote).discount_total} — <strong>Total:</strong> R$ {computeTotals(quote).total}
      </div>
      <div style={{marginTop:12}}>
        <button onClick={save} disabled={loading}>Salvar</button>
      </div>
    </div>
  )
}
