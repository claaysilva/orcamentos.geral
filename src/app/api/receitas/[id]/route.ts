import { NextResponse } from 'next/server'
import { getSupabase } from '../../../../../lib/supabaseServer'

export async function GET(request: Request, { params } : { params: { id: string } }){
  const { id } = params
  const supabase = getSupabase()
  const { data, error } = await supabase.from('receitas').select('*').eq('id', id).single()
  if(error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PUT(request: Request, { params } : { params: { id: string } }){
  const { id } = params
  const body = await request.json()
  const supabase = getSupabase()
  const { data, error } = await supabase.from('receitas').update(body).eq('id', id).select().single()
  if(error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function DELETE(request: Request, { params } : { params: { id: string } }){
  const { id } = params
  const supabase = getSupabase()
  const { error } = await supabase.from('receitas').delete().eq('id', id)
  if(error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok:true })
}
