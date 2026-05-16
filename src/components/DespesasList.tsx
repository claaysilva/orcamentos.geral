import React from 'react'

async function fetchDespesas(){
  const res = await fetch('/api/despesas', { cache: 'no-store' })
  if(!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default async function DespesasList(){
  const despesas = await fetchDespesas()
  return (
    <div>
      <a href="/despesas/novo">Criar despesa</a>
      <ul>
        {despesas.map((r: any)=> (
          <li key={r.id}>{r.title} — R$ {r.value} — <a href={`/despesas/${r.id}`}>Editar</a></li>
        ))}
      </ul>
    </div>
  )
}
