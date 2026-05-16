import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

export default function QuoteEditor(){
  const { id } = useParams();
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(false);
  const [adminToken] = useState(()=> localStorage.getItem('adminToken') || '');

  useEffect(()=>{
    if(id){ 
      const headers = { 'Content-Type':'application/json' };
      if(adminToken) headers['x-admin-token'] = adminToken;
      fetch(`/api/admin/quotes/${id}`, { headers }).then(r=>r.json()).then(j=>setQuote(j.quote||null)); 
    }
  },[id, adminToken]);

  function addItem(){
    setQuote(prev=> ({ ...prev, items: [...(prev.items||[]), { title:'Novo item', price:0, discount:0, quantity:1 }] }));
  }

  function removeItem(idx){
    setQuote(prev=>{ const items = [...(prev.items||[])]; items.splice(idx,1); return {...prev, items}; })
  }

  function computeTotals(q){
    const items = q.items || [];
    const subtotal = items.reduce((s,it)=> s + (Number(it.price)||0) * (Number(it.quantity)||1), 0);
    const discount_total = items.reduce((s,it)=> s + (Number(it.discount)||0), 0);
    const total = Math.max(subtotal - discount_total, 0);
    return { subtotal, discount_total, total };
  }

  async function save(){
    setLoading(true);
    try{
      // ensure totals
      const totals = computeTotals(quote);
      const payload = { ...quote, subtotal: totals.subtotal, discount_total: totals.discount_total, total: totals.total, items: quote.items };
      const headers = { 'Content-Type':'application/json' };
      if(adminToken) headers['x-admin-token'] = adminToken;
      const res = await fetch(`/api/admin/quotes/${id}`, { method:'PUT', headers, body: JSON.stringify(payload) });
      const j = await res.json();
      setQuote(j.quote);
      alert('Salvo');
    }catch(e){ console.error(e); alert('Erro'); }
    setLoading(false);
  }

  if(!quote) return <div style={{padding:20}}>Carregando...</div>;

  return (
    <div style={{padding:40}}>
      <div className="val-wrap">
        <h2 className="section-title">Editor: {quote.title}</h2>
        <div style={{marginBottom:12}}>
          <label>Título</label>
          <input className="val-input" value={quote.title} onChange={e=>setQuote({...quote, title: e.target.value})} />
        </div>
        <div>
          <h3 className="section-title">Items</h3>
          <button className="btn" onClick={addItem}>Adicionar item</button>
          <ul style={{marginTop:8}}>
            {(quote.items||[]).map((it, idx)=>(
              <li key={idx} style={{marginBottom:8, display:'flex', gap:8, alignItems:'center'}}>
                <input className="val-input" style={{width:300}} value={it.title} onChange={e=>{ const items = [...quote.items]; items[idx].title = e.target.value; setQuote({...quote, items}); }} />
                <input className="val-input" style={{width:100}} type="number" value={it.price} onChange={e=>{ const items = [...quote.items]; items[idx].price = Number(e.target.value); setQuote({...quote, items}); }} />
                <input className="val-input" style={{width:100}} type="number" value={it.discount} onChange={e=>{ const items = [...quote.items]; items[idx].discount = Number(e.target.value); setQuote({...quote, items}); }} />
                <input className="val-input" style={{width:70}} type="number" value={it.quantity||1} onChange={e=>{ const items = [...quote.items]; items[idx].quantity = Number(e.target.value); setQuote({...quote, items}); }} />
                <button className="btn" onClick={()=>removeItem(idx)}>Remover</button>
              </li>
            ))}
          </ul>
        </div>
        <div style={{marginTop:12}}>
          <strong>Subtotal:</strong> R$ {computeTotals(quote).subtotal} — <strong>Total descontos:</strong> R$ {computeTotals(quote).discount_total} — <strong>Total:</strong> R$ {computeTotals(quote).total}
        </div>
        <div style={{marginTop:12}}>
          <button className="btn pri" onClick={save} disabled={loading}>Salvar</button>
        </div>
      </div>
    </div>
  );
}
