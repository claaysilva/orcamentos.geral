import { useEffect } from 'react'

export default function Landing(){
  useEffect(()=>{
    try{
      const host = window.location.hostname || 'localhost'
      window.location.replace(`http://${host}:3000/`)
    }catch(e){ }
  },[])
  return null
}
