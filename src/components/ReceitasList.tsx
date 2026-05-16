import React from 'react'

async function fetchReceitas(){
  const res = await fetch('/api/receitas', { cache: 'no-store' })
  if(!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default async function ReceitasList(){
  const receitas = await fetchReceitas()
  return (
    <div>
      <a href="/receitas/novo">Criar receita</a>
      <ul>
        {receitas.map((r: any)=> (
          <li key={r.id}>{r.title} — R$ {r.value} — <a href={`/receitas/${r.id}`}>Editar</a></li>
        ))}
      </ul>
    </div>
  )
}
