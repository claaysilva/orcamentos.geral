import { NextResponse } from 'next/server'
import { getSupabase } from '../../../../lib/supabaseServer'

export async function GET(){
  const supabase = getSupabase()
  const { data, error } = await supabase.from('categorias').select('*').order('name', { ascending: true })
  if(error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(request: Request){
  try{
    const body = await request.json()
    const supabase = getSupabase()
    const { data, error } = await supabase.from('categorias').insert([body]).select().single()
    if(error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  }catch(e){
    return NextResponse.json({ error: e.message }, { status: 400 })
  }
}
