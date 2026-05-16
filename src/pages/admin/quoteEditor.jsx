import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function QuoteEditor(){
  const router = useRouter()
  useEffect(()=>{
    const path = window.location.pathname
    const parts = path.split('/')
    const id = parts[parts.length-1]
    router.replace(`/admin/quote/${id}`)
  },[router])
  return null
}
