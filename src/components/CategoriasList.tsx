import React from 'react'

async function fetchCategorias(){
  const res = await fetch('/api/categorias', { cache: 'no-store' })
  if(!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export default async function CategoriasList(){
  const categorias = await fetchCategorias()
  return (
    <div>
      <a href="/categorias/novo">Criar categoria</a>
      <ul>
        {categorias.map((r: any)=> (
          <li key={r.id}>{r.name} — <a href={`/categorias/${r.id}`}>Editar</a></li>
        ))}
      </ul>
    </div>
  )
}
