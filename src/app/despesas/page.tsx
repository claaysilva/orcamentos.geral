import DespesasList from '../../../components/DespesasList'

export default async function DespesasPage(){
  return (
    <div>
      <h2>Despesas</h2>
      {/* Server component: carrega dados do Supabase no servidor */}
      {/* @ts-expect-error Server Component */}
      <DespesasList />
    </div>
  )
}
