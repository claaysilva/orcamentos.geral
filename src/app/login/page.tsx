"use client"
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage(){
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  async function handleSubmit(e: any){
    e.preventDefault();
    setLoading(true)
    try{
      const { API_BASE } = await import('../../lib/apiBase')
      const res = await fetch(`${API_BASE}/api/login`, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ password }) })
      const j = await res.json()
      if(j.ok && j.token){
        localStorage.setItem('adminToken', j.token)
        router.push('/admin')
      }else{
        alert('Senha inválida')
      }
    }catch(e){ console.error(e); alert('Erro') }
    finally{ setLoading(false) }
  }

  return (
    <div style={{padding:20}}>
      <h2>Login Admin</h2>
      <form onSubmit={handleSubmit}>
        <div style={{marginBottom:8}}>
          <input placeholder="Senha" type="password" value={password} onChange={e=>setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={loading}>Entrar</button>
      </form>
    </div>
  )
}
