import Link from 'next/link'

export default function Home(){
  return (
    <div>
      <h2>Bem-vindo à plataforma de orçamentos</h2>
      <p>Use as rotas de API em <code>/api/</code> para receitas, despesas e categorias.</p>
      <ul>
        <li><Link href="/receitas">Receitas</Link></li>
        <li><Link href="/despesas">Despesas</Link></li>
        <li><Link href="/categorias">Categorias</Link></li>
      </ul>
    </div>
  )
}
