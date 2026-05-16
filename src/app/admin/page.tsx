import Link from 'next/link'

export default function AdminHome(){
  return (
    <div style={{padding:20}}>
      <h2>Admin</h2>
      <ul>
        <li><Link href="/admin/clients">Clientes</Link></li>
        <li><Link href="/admin/quotes">Orçamentos</Link></li>
      </ul>
      <p>Use <Link href="/login">/login</Link> para obter token admin (senha: senha123 por padrão).</p>
    </div>
  )
}
