import { useEffect, useState } from 'react';

export default function AdminQuotes(){
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ title:'', client_id:'' });

  useEffect(()=>{ fetch('/api/admin/quotes').then(r=>r.json()).then(j=>setQuotes(j.quotes||[])); fetch('/api/admin/clients').then(r=>r.json()).then(j=>setClients(j.clients||[])); },[]);

  async function create(){
    const payload = { title: form.title, client_id: form.client_id };
    const res = await fetch('/api/admin/quotes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    const json = await res.json();
    if(json?.quote) setQuotes(prev=>[...prev, json.quote]);
  }

  async function send(id){
    const res = await fetch(`/api/admin/quotes/${id}/send`, { method:'POST' });
    const j = await res.json();
    if(j.ok) alert('Token gerado: ' + j.token);
  }

  return (
    <div style={{padding:20}}>
      <h2>Orçamentos</h2>
      <div style={{marginBottom:12}}>
        <input placeholder="Título" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
        <select value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})}>
          <option value="">-- selecionar cliente --</option>
          {clients.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
        </select>
        <button onClick={create}>Criar</button>
      </div>

      <ul>
        {quotes.map(q=> (
          <li key={q.id}>{q.title} — {q.client_id} — <a href={`#/admin/quote/${q.id}`}>Abrir</a> — <button onClick={()=>send(q.id)}>Enviar</button></li>
        ))}
      </ul>
    </div>
  );
}
