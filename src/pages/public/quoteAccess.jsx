import { useEffect } from 'react'

export default function PublicQuoteAccess(){
  useEffect(()=>{
    try{
      const qp = new URLSearchParams(window.location.search)
      const q = qp.get('quoteId')
      const c = qp.get('cnpj')
      const query = (q||c) ? `?${qp.toString()}` : ''
      const host = window.location.hostname || 'localhost'
      window.location.replace(`http://${host}:3000/public${query}`)
    }catch(e){ }
  },[])
  return null
}
