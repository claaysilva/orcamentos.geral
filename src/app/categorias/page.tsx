import CategoriasList from '../../../components/CategoriasList'

export default async function CategoriasPage(){
  return (
    <div>
      <h2>Categorias</h2>
      {/* Server component: carrega dados do Supabase no servidor */}
      {/* @ts-expect-error Server Component */}
      <CategoriasList />
    </div>
  )
}
