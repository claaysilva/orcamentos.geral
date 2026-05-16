import { useEffect } from 'react'
import { useRouter } from 'next/router'

export default function AdminQuotes(){
  const router = useRouter()
  useEffect(()=>{ router.replace('/admin/quotes') },[router])
  return null
}
