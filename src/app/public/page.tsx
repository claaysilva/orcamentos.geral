"use client"
import { useState } from 'react'

export default function PublicAccess(){
  const [form, setForm] = useState({ quoteId:'', cnpj:'', token:'' })
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e:any){
    e.preventDefault(); setLoading(true);
    try{
      const { API_BASE } = await import('../../lib/apiBase')
      const res = await fetch(`${API_BASE}/api/public/access`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      const json = await res.json(); if(json?.ok && json.quote) setResult({ ok:true, quote: json.quote }); else setResult(json);
    }catch(err){ console.error(err); setResult({ ok:false }); }
    finally{ setLoading(false) }
  }

  const updateItem = (idx:number, patch:any) => { setResult((prev:any)=>{ const next = JSON.parse(JSON.stringify(prev)); next.quote.items[idx] = { ...next.quote.items[idx], ...patch }; return next; }) }
  const addItem = () => setResult((prev:any)=>{ const next = JSON.parse(JSON.stringify(prev)); const newItem = { id: 'tmp-' + Date.now(), title: 'Novo item', description:'', quantity:1, price:0, discount:0, sort_order: next.quote.items.length }; next.quote.items.push(newItem); return next; })
  const removeItem = (idx:number) => setResult((prev:any)=>{ const next = JSON.parse(JSON.stringify(prev)); next.quote.items.splice(idx,1); return next; })

  const handleSave = async () => {
    if(!result || !result.quote) return;
    setLoading(true);
    try{
      const { API_BASE } = await import('../../lib/apiBase')
      const payload = { cnpj: form.cnpj, quote: result.quote };
      const res = await fetch(`${API_BASE}/api/public/quotes/${result.quote.id}/save`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
      const json = await res.json(); if(json?.ok && json.quote){ setResult({ ok:true, quote: json.quote }); alert('Orçamento salvo com sucesso'); } else { alert('Erro ao salvar: ' + (json.error || 'unknown')); }
    }catch(err){ console.error(err); alert('Erro ao salvar'); }
    finally{ setLoading(false) }
  }

  return (
    <div style={{padding:20}}>
      <h2>Acessar / Editar Orçamento</h2>
      <form onSubmit={handleSubmit} style={{marginBottom:12}}>
        <input placeholder="Código do Orçamento (ID)" value={form.quoteId} onChange={e=>setForm({...form,quoteId:e.target.value})} />
        <input placeholder="CNPJ" value={form.cnpj} onChange={e=>setForm({...form,cnpj:e.target.value})} required />
        <input placeholder="Token (opcional)" value={form.token} onChange={e=>setForm({...form,token:e.target.value})} />
        <button type="submit" disabled={loading}>Acessar</button>
      </form>

      {result && result.ok && result.quote && (
        <div style={{marginTop:16}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <h3 contentEditable suppressContentEditableWarning onBlur={e=>setResult((prev:any)=>({ ...prev, quote: { ...prev.quote, title: e.target.innerText } }))}>{result.quote.title}</h3>
            <div>
              <button onClick={addItem}>+ Item</button>
              <button onClick={handleSave} style={{marginLeft:8}} disabled={loading}>Salvar</button>
            </div>
          </div>
          <div><strong>Subtotal:</strong> R$ <input value={result.quote.subtotal||0} onChange={e=>setResult((prev:any)=>({ ...prev, quote:{ ...prev.quote, subtotal: Number(e.target.value) } }))} /></div>
          <div><strong>Total descontos:</strong> R$ <input value={result.quote.discount_total||0} onChange={e=>setResult((prev:any)=>({ ...prev, quote:{ ...prev.quote, discount_total: Number(e.target.value) } }))} /></div>
          <div><strong>Total:</strong> R$ <input value={result.quote.total||0} onChange={e=>setResult((prev:any)=>({ ...prev, quote:{ ...prev.quote, total: Number(e.target.value) } }))} /></div>
          <div style={{marginTop:12}}>
            <h4>Itens</h4>
            <div>
              {(result.quote.items||[]).map((it:any,idx:number)=>(
                <div key={it.id} style={{border:'1px solid #ddd', padding:8, marginBottom:8}}>
                  <div><input value={it.title} onChange={e=>updateItem(idx, { title: e.target.value })} style={{width:'70%'}} /></div>
                  <div style={{marginTop:6}}><input value={it.description||''} onChange={e=>updateItem(idx, { description: e.target.value })} style={{width:'70%'}} placeholder="Descrição" /></div>
                  <div style={{marginTop:6}}>
                    Quantidade: <input type="number" value={it.quantity||1} onChange={e=>updateItem(idx, { quantity: Number(e.target.value) })} style={{width:80}} />
                    Preço: R$ <input type="number" value={it.price||0} onChange={e=>updateItem(idx, { price: Number(e.target.value) })} style={{width:100, marginLeft:8}} />
                    Desconto: R$ <input type="number" value={it.discount||0} onChange={e=>updateItem(idx, { discount: Number(e.target.value) })} style={{width:100, marginLeft:8}} />
                    <button onClick={()=>removeItem(idx)} style={{marginLeft:8}}>Remover</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {result && !result.ok && (
        <div style={{marginTop:12,color:'red'}}>Erro: {result.error || 'Acesso negado'}</div>
      )}
    </div>
  )
}
