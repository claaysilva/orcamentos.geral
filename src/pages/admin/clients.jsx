import { useEffect } from 'react'

export default function AdminClients(){
  useEffect(()=>{
    try{
      const host = window.location.hostname || 'localhost'
      window.location.replace(`http://${host}:3000/admin/clients`)
    }catch(e){ /* ignore */ }
  },[])
  return null
}
