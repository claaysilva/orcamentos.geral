import { useState, useEffect } from 'react';

export default function AdminClients(){
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name:'', cnpj:'', contact_email:'' });
  const [loading, setLoading] = useState(false);

  useEffect(()=>{
    fetch('/api/admin/clients')
      .then(r=>r.json())
      .then(data=>{ if(data?.clients) setClients(data.clients); })
      .catch(()=>{});
  },[]);

  async function handleCreate(e){
    e.preventDefault();
    setLoading(true);
    try{
      const res = await fetch('/api/admin/clients', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(form) });
      const json = await res.json();
      if(json?.client){
        setClients(prev=>[...prev, json.client]);
        setForm({ name:'', cnpj:'', contact_email:'' });
      }
    }catch(err){
      console.error(err);
    }finally{ setLoading(false); }
  }

  return (
    <div style={{padding:20}}>
      <h2>Clientes</h2>
      <form onSubmit={handleCreate} style={{marginBottom:12}}>
        <input placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
        <input placeholder="CNPJ" value={form.cnpj} onChange={e=>setForm({...form,cnpj:e.target.value})} required />
        <input placeholder="Email" value={form.contact_email} onChange={e=>setForm({...form,contact_email:e.target.value})} />
        <button type="submit" disabled={loading}>Criar</button>
      </form>

      <ul>
        {clients.map(c=> (
          <li key={c.id}>{c.name} — {c.contact_email || '—'}</li>
        ))}
      </ul>
    </div>
  );
}
