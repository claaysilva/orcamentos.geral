import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function PublicQuoteAccess(){
  const router = useRouter()
  useEffect(()=>{
    const qp = new URLSearchParams(window.location.search)
    const q = qp.get('quoteId')
    const c = qp.get('cnpj')
    const target = '/public' + (q||c ? `?${qp.toString()}` : '')
    router.replace(target)
  },[router])
  return null
}
