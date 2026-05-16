import { useState, useEffect } from 'react';

export default function AdminClients(){
  const [clients, setClients] = useState([]);
  const [form, setForm] = useState({ name:'', cnpj:'', contact_email:'' });
  const [loading, setLoading] = useState(false);
  const [adminToken, setAdminToken] = useState(()=> localStorage.getItem('adminToken') || '');

  useEffect(()=>{
    loadClients();
  },[]);

  function authHeaders(){
    const headers = { 'Content-Type':'application/json' };
    const token = localStorage.getItem('adminToken');
    if(token) headers['x-admin-token'] = token;
    return headers;
  }

  async function loadClients(){
    try{
      const res = await fetch('/api/admin/clients', { headers: authHeaders() });
      const json = await res.json();
      if(json?.clients) setClients(json.clients);
    }catch(e){ console.error(e); }
  }

  function saveToken(){ localStorage.setItem('adminToken', adminToken); loadClients(); }
  function clearToken(){ localStorage.removeItem('adminToken'); setAdminToken(''); loadClients(); }

  async function handleCreate(e){
    e.preventDefault();
    setLoading(true);
    try{
      const res = await fetch('/api/admin/clients', { method:'POST', headers: authHeaders(), body: JSON.stringify(form) });
      const json = await res.json();
      if(json?.client){
        setClients(prev=>[...prev, json.client]);
        setForm({ name:'', cnpj:'', contact_email:'' });
      }else if(json?.error){ alert('Erro: ' + json.error); }
    }catch(err){ console.error(err); alert('Erro ao criar'); }
    finally{ setLoading(false); }
  }

  async function handleDelete(id){
    if(!confirm('Confirmar exclusão do cliente?')) return;
    try{
      const res = await fetch(`/api/admin/clients/${id}`, { method:'DELETE', headers: authHeaders() });
      const j = await res.json();
      if(j.ok){ setClients(prev=>prev.filter(c=>c.id!==id)); }
      else alert('Erro: ' + (j.error||'')); 
    }catch(e){ console.error(e); alert('Erro ao excluir'); }
  }

  async function handleUpdate(id, patch){
    try{
      const res = await fetch(`/api/admin/clients/${id}`, { method:'PUT', headers: authHeaders(), body: JSON.stringify(patch) });
      const j = await res.json();
      if(j.client){ setClients(prev=>prev.map(c=> c.id===id ? j.client : c)); }
      else alert('Erro: ' + (j.error||''));
    }catch(e){ console.error(e); alert('Erro ao salvar'); }
  }

  return (
    <div style={{padding:40}}>
      <div className="val-wrap">
        <h2 className="section-title">Clientes</h2>

        <div style={{display:'flex', gap:8, marginBottom:12}}>
          <input className="val-input" placeholder="Nome" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required />
          <input className="val-input" placeholder="CNPJ" value={form.cnpj} onChange={e=>setForm({...form,cnpj:e.target.value})} required />
          <input className="val-input" placeholder="Email" value={form.contact_email} onChange={e=>setForm({...form,contact_email:e.target.value})} />
          <button className="btn pri" onClick={handleCreate} disabled={loading}>Criar</button>
        </div>

        <ul>
          {clients.map(c=> (
            <li key={c.id} style={{marginBottom:12, display:'flex', alignItems:'center', gap:8}}>
              <input className="val-input" defaultValue={c.name} onBlur={e=>handleUpdate(c.id, { name: e.target.value })} />
              <input className="val-input" style={{width:260}} defaultValue={c.contact_email} onBlur={e=>handleUpdate(c.id, { contact_email: e.target.value })} />
              <button className="btn" onClick={()=>handleDelete(c.id)}>Excluir</button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
