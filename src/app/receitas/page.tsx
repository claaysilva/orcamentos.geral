import ReceitasList from '../../../components/ReceitasList'

export default async function ReceitasPage(){
  return (
    <div>
      <h2>Receitas</h2>
      {/* Server component: carrega dados do Supabase no servidor */}
      {/* @ts-expect-error Server Component */}
      <ReceitasList />
    </div>
  )
}
