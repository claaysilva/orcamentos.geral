import '../../app/globals.css'

export const metadata = {
  title: 'Orçamentos - MultiCliente',
  description: 'Plataforma de orçamentos multi-cliente',
}

export default function RootLayout({ children }: { children: React.ReactNode }){
  return (
    <html lang="pt-BR">
      <body>
        <header style={{padding:16, borderBottom:'1px solid #eee'}}>
          <h1>Orçamentos</h1>
        </header>
        <main style={{padding:16}}>{children}</main>
      </body>
    </html>
  )
}
