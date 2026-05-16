import { useEffect, useState } from 'react';

export default function AdminQuotes(){
  const [quotes, setQuotes] = useState([]);
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ title:'', client_id:'' });
  const [adminToken, setAdminToken] = useState(()=> localStorage.getItem('adminToken') || '');

  function authHeaders(){
    const headers = { 'Content-Type':'application/json' };
    const token = localStorage.getItem('adminToken');
    if(token) headers['x-admin-token'] = token;
    return headers;
  }

  useEffect(()=>{ 
    fetch('/api/admin/quotes', { headers: authHeaders() }).then(r=>r.json()).then(j=>setQuotes(j.quotes||[])); 
    fetch('/api/admin/clients', { headers: authHeaders() }).then(r=>r.json()).then(j=>setClients(j.clients||[])); 
  },[]);

  async function create(){
    const payload = { title: form.title, client_id: form.client_id };
    const res = await fetch('/api/admin/quotes', { method:'POST', headers: authHeaders(), body: JSON.stringify(payload) });
    const json = await res.json();
    if(json?.quote) setQuotes(prev=>[...prev, json.quote]);
    else if(json?.error) alert('Erro: ' + json.error);
  }

  async function send(id){
    const res = await fetch(`/api/admin/quotes/${id}/send`, { method:'POST', headers: authHeaders() });
    const j = await res.json();
    if(j.ok) alert('Token gerado: ' + j.token);
    else alert('Erro: ' + (j.error||''));
  }

  async function remove(id){
    if(!confirm('Excluir orçamento?')) return;
    const res = await fetch(`/api/admin/quotes/${id}`, { method:'DELETE', headers: authHeaders() });
    const j = await res.json();
    if(j.ok) setQuotes(prev=>prev.filter(q=>q.id!==id)); else alert('Erro: ' + (j.error||''));
  }
  return (
    <div style={{padding:40}}>
      <div className="val-wrap">
        <h2 className="section-title">Orçamentos</h2>
        <div style={{display:'flex', gap:8, marginBottom:12, alignItems:'center'}}>
          <input className="val-input" placeholder="Título" value={form.title} onChange={e=>setForm({...form,title:e.target.value})} />
          <select className="val-input" value={form.client_id} onChange={e=>setForm({...form,client_id:e.target.value})}>
            <option value="">-- selecionar cliente --</option>
            {clients.map(c=>(<option key={c.id} value={c.id}>{c.name}</option>))}
          </select>
          <button className="btn pri" onClick={create}>Criar</button>
        </div>

        <ul>
          {quotes.map(q=> (
            <li key={q.id} style={{marginBottom:10}}>{q.title} — {q.client_id} — <a href={`/admin/quote/${q.id}`}>Abrir</a> — <button className="btn" onClick={()=>send(q.id)}>Enviar</button> — <button className="btn" onClick={()=>remove(q.id)}>Excluir</button></li>
          ))}
        </ul>
      </div>
    </div>
  );
}
