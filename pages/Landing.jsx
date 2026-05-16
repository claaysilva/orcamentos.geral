import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Landing(){
  const [mode, setMode] = useState('choose');
  const [adminToken, setAdminToken] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [quotes, setQuotes] = useState(null);
  const [error, setError] = useState('');
  const nav = useNavigate();

  async function loginAdmin(){
    if(!adminToken) return setError('Senha requerida');
    try{
      const res = await fetch('/api/admin/login', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password: adminToken }) });
      const j = await res.json();
      if(j.ok && j.token){ localStorage.setItem('adminToken', j.token); nav('/admin/quotes'); }
      else { setError('Senha inválida'); }
    }catch(e){ setError('Erro de autenticação'); }
  }

  async function lookupCnpj(){
    setError('');
    try{
      const res = await fetch('/api/public/quotes', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ cnpj }) });
      const j = await res.json();
      if(j.ok){ setQuotes(j.quotes || []); setMode('clientList'); }
      else setError(j.error || 'Não encontrado');
    }catch(e){ setError('Erro'); }
  }

  if(mode === 'choose'){
    return (
      <div style={{padding:20}}>
        <h2>Entrar</h2>
        <div style={{marginBottom:12}}>
          <button onClick={()=>setMode('admin')}>Sou Admin</button>
          <button onClick={()=>setMode('client')} style={{marginLeft:8}}>Sou Cliente (CNPJ)</button>
        </div>
      </div>
    );
  }

  if(mode === 'admin'){
    return (
      <div style={{padding:20}}>
        <h2>Área Admin</h2>
        <div>
          <input placeholder="Admin token" value={adminToken} onChange={e=>setAdminToken(e.target.value)} style={{width:400}} />
          <button onClick={loginAdmin} style={{marginLeft:8}}>Entrar</button>
        </div>
        {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
      </div>
    );
  }

  if(mode === 'client'){
    return (
      <div style={{padding:20}}>
        <h2>Acesso do Cliente</h2>
        <div>
          <input placeholder="CNPJ" value={cnpj} onChange={e=>setCnpj(e.target.value)} />
          <button onClick={lookupCnpj} style={{marginLeft:8}}>Buscar meus orçamentos</button>
        </div>
        {error && <div style={{color:'red',marginTop:8}}>{error}</div>}
      </div>
    );
  }

  if(mode === 'clientList'){
    return (
      <div style={{padding:20}}>
        <h2>Seus Orçamentos</h2>
        <ul>
          {quotes && quotes.length ? quotes.map(q=>(<li key={q.id}>{q.title} — R$ {q.total || 0} — <a href={`/public/access?quoteId=${q.id}&cnpj=${encodeURIComponent(cnpj)}`}>Abrir</a></li>)) : <li>Nenhum orçamento</li>}
        </ul>
      </div>
    );
  }

  return null;
}
