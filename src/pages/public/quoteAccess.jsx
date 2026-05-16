import { useState } from 'react';

export default function PublicQuoteAccess(){
  const [form, setForm] = useState({ quoteId:'', cnpj:'', token:'' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e){
    e.preventDefault();
    setLoading(true);
    try{
      const res = await fetch('/api/public/access', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      const json = await res.json();
      if(json?.ok && json.quote){
        setResult({ ok:true, quote: json.quote });
      } else setResult(json);
    }catch(err){
      console.error(err);
      setResult({ ok:false });
    }finally{ setLoading(false); }
  }

  return (
    <div style={{padding:20}}>
      <h2>Acessar Orçamento</h2>
      <form onSubmit={handleSubmit}>
        <input placeholder="Código do Orçamento (ID)" value={form.quoteId} onChange={e=>setForm({...form,quoteId:e.target.value})} />
        <input placeholder="CNPJ" value={form.cnpj} onChange={e=>setForm({...form,cnpj:e.target.value})} required />
        <input placeholder="Token (opcional)" value={form.token} onChange={e=>setForm({...form,token:e.target.value})} />
        <button type="submit" disabled={loading}>Acessar</button>
      </form>

      {result && result.ok && result.quote && (
        <div style={{marginTop:16}}>
          <h3>{result.quote.title}</h3>
          <div><strong>Subtotal:</strong> R$ {result.quote.subtotal}</div>
          <div><strong>Total descontos:</strong> R$ {result.quote.discount_total}</div>
          <div><strong>Total:</strong> R$ {result.quote.total}</div>
          <div style={{marginTop:12}}>
            <h4>Itens</h4>
            <ul>
              {(result.quote.items||[]).map(it=>(<li key={it.id}>{it.title} — R$ {it.price} {it.discount?` (desconto R$ ${it.discount})`:''}</li>))}
            </ul>
          </div>
          <div style={{marginTop:12}}>
            <button onClick={()=>window.print()}>Imprimir</button>
          </div>
        </div>
      )}

      {result && !result.ok && (
        <div style={{marginTop:12,color:'red'}}>Erro: {result.error || 'Acesso negado'}</div>
      )}
    </div>
  );
}
