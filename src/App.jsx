import React, {useEffect, useRef, useState} from 'react'
import { DATA } from './data'
import Map from './Map'

function cloneTree(node){
  return JSON.parse(JSON.stringify(node))
}

function cleanText(text){
  return String(text).replace(/^\d+\.\s*/, '')
}

function setAllCollapsed(node, collapsed, keepRootOpen = false, keepFirstLevelOpen = false){
  const next = cloneTree(node)
  const walk = (current, level = 0) => {
    current.collapsed = (keepRootOpen && level === 0) || (keepFirstLevelOpen && level === 1) ? false : collapsed
    ;(current.children || []).forEach(child => walk(child, level + 1))
  }
  walk(next, 0)
  return next
}

function toggleNode(node, targetId){
  const next = cloneTree(node)
  const walk = current => {
    if(current.id === targetId){
      current.collapsed = !current.collapsed
      return true
    }
    for(const child of (current.children || [])){
      if(walk(child)) return true
    }
    return false
  }
  walk(next)
  return next
}

function OutlineNode({node, level, onToggle}){
  const hasChildren = !!(node.children && node.children.length)
  return (
    <div className="ol-item">
      <div className={'ol-node lv-' + level} onClick={()=>{ if(hasChildren) onToggle(node.id) }}>
        {hasChildren ? (
          <div className="ol-toggle" onClick={(e)=>{ e.stopPropagation(); onToggle(node.id); }}>{node.collapsed ? '+' : '−'}</div>
        ) : (
          <div style={{width:'18px', flexShrink:0}} />
        )}
        <div className="ol-text">
          {cleanText(node.text)}
          {node.status || node.estimate ? (
            <span className="item-meta"> — <em className="status">{node.status || ''}</em>{node.estimate ? ` • ${node.estimate}` : ''}</span>
          ) : null}
        </div>
      </div>
      {hasChildren && !node.collapsed && (
        <div className="ol-children">
          {node.children.map(child => (
            <OutlineNode key={child.id} node={child} level={level + 1} onToggle={onToggle} />
          ))}
        </div>
      )}
    </div>
  )
}

function Outline({data, onToggle}){
  return (
    <div id="outlineInner" className="view-inner">
      <OutlineNode node={data} level={0} onToggle={onToggle} />
    </div>
  )
}

function Values({data}){
  const toNumber = v => {
    if(typeof v === 'number') return v
    return Number(String(v).replace(/[^0-9]/g,'')) || 0
  }

  const meta = data.meta || {}
  const extras = meta.extras || []
  const rows = (data.children || []).map(c => ({
    id: c.id,
    label: cleanText(c.text),
    value: c.price || 0,
    discount: c.discount || 0,
    status: c.status || '',
    estimate: c.estimate || '',
    included: c.included || [],
    excluded: c.excluded || []
  }))

  const subtotalReal = rows.reduce((s,r)=> s + toNumber(r.value),0) + extras.reduce((s,e)=> s + toNumber(e.price),0)
  const totalDiscounts = rows.reduce((s,r)=> s + toNumber(r.discount),0) + extras.reduce((s,e)=> s + toNumber(e.discount||0),0)
  const total = Math.max(subtotalReal - totalDiscounts,0)

  const projectPayment = { value: meta.total || 'R$ 0', plan: meta.condicoes || '' }

  return (
    <div id="valuesInner" className="view-inner">
      <div className="val-wrap">
        <div className="summary">
          <div className="meta-row"><div className="meta-label">Total</div><div className="meta-value">{meta.total}</div></div>
          <div className="meta-row"><div className="meta-label">Prazo</div><div className="meta-value">{meta.prazo}</div></div>
          <div className="meta-row"><div className="meta-label">Condições</div><div className="meta-value">{meta.condicoes}</div></div>
          <div className="meta-row"><div className="meta-label">Validade</div><div className="meta-value">{meta.validade}</div></div>
        </div>

        {rows.map((r,idx)=>(
          <div className={'val-row val-level-1'} key={r.id || idx}>
            <div>
              <div className="val-label">{r.label} <small className="item-small">{r.status}{r.estimate?` • ${r.estimate}`:''}</small></div>
              {r.included && r.included.length? <div className="item-included">Incluso: {r.included.join(', ')}</div> : null}
              {r.excluded && r.excluded.length? <div className="item-excluded">Fora do escopo: {r.excluded.join(', ')}</div> : null}
            </div>
            <div className="val-value">R$ {toNumber(r.value)}</div>
          </div>
        ))}

        {extras.map((ex,i)=> (
          <div className={'val-row val-level-1'} key={'ex'+i}>
            <div className="val-label">{ex.label} <small className="item-small">{ex.status}{ex.estimate?` • ${ex.estimate}`:''}</small></div>
            <div className="val-value">R$ {toNumber(ex.price)}</div>
          </div>
        ))}

        <div className="val-row total"><div className="val-label">Subtotal</div><div className="val-value">R$ {subtotalReal}</div></div>
        <div className="val-row"><div className="val-label">Total descontos</div><div className="val-value">- R$ {totalDiscounts}</div></div>
        <div className="val-row total"><div className="val-label">Total com desconto</div><div className="val-value">R$ {total}</div></div>

        <div style={{height:10}} />

        <div className="val-row"><div className="val-label">Pagamento (projeto): {projectPayment.plan}</div><div className="val-value">{projectPayment.value}</div></div>

        <div style={{height:18}} />
        <div className="section-title">Próximos passos</div>
        <div className="next-steps">{(meta.nextSteps||[]).map((s,i)=> <div key={i}>• {s}</div>)}</div>

        <div style={{height:10}} />
        <div className="section-title">Premissas e escopo excluído</div>
        <div className="assumptions">
          <div><strong>Premissas:</strong> {(meta.assumptions||[]).join(' • ')}</div>
          <div><strong>Fora do escopo:</strong> {(meta.excludedScope||[]).join(' • ')}</div>
        </div>
      </div>
    </div>
  )
}

export default function App(){
  const [mode,setMode]=useState(()=>{
    const isMobile = window.matchMedia('(max-width:820px)').matches
    return isMobile ? 'outline' : 'mindmap'
  })
  const [tree, setTree] = useState(()=> setAllCollapsed(DATA, true, true, false))
  const [canvasSize, setCanvasSize] = useState({width: 0, height: 0})
  const [view, setView] = useState({tx: 60, ty: 30, sc: 1})
  const vpRef = useRef(null)
  const panRef = useRef(null)
  const hasCenteredRef = useRef(false)
  const isMobile = window.matchMedia('(max-width:820px)').matches

  const expandAll = ()=> setTree(prev => setAllCollapsed(prev, false, true, true))
  const collapseAll = ()=> setTree(prev => setAllCollapsed(prev, true, true, false))
  const onToggle = (id)=> setTree(prev => toggleNode(prev, id))
  const onCanvasSize = nextSize => {
    setCanvasSize(prev => prev.width === nextSize.width && prev.height === nextSize.height ? prev : nextSize)
  }

  const centerMap = ()=>{
    if(!vpRef.current || !canvasSize.width || !canvasSize.height) return
    const bounds = vpRef.current.getBoundingClientRect()
    const tx = Math.round((bounds.width - canvasSize.width) / 2)
    const ty = Math.round((bounds.height - canvasSize.height) / 2)
    setView(prev => ({...prev, tx, ty, sc: 1}))
  }

  const clampZoom = value => Math.min(Math.max(value, 0.15), 3)
  const zoomAtCenter = factor => {
    if(!vpRef.current) return
    setView(prev => {
      const nextSc = clampZoom(prev.sc * factor)
      const scaleFactor = nextSc / prev.sc
      const bounds = vpRef.current.getBoundingClientRect()
      const mx = bounds.width / 2
      const my = bounds.height / 2
      return {
        sc: nextSc,
        tx: mx - (mx - prev.tx) * scaleFactor,
        ty: my - (my - prev.ty) * scaleFactor,
      }
    })
  }

  useEffect(()=>{
    const onMove = (event) => {
      if(!panRef.current) return
      const start = panRef.current
      setView({
        tx: event.clientX - start.offsetX,
        ty: event.clientY - start.offsetY,
        sc: start.sc,
      })
    }
    const onUp = () => { panRef.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [])

  useEffect(()=>{
    if(mode !== 'mindmap' || isMobile) return
    if(hasCenteredRef.current) return
    if(!canvasSize.width || !canvasSize.height) return
    if(!vpRef.current) return
    const bounds = vpRef.current.getBoundingClientRect()
    const tx = Math.round((bounds.width - canvasSize.width) / 2)
    const ty = Math.round((bounds.height - canvasSize.height) / 2)
    setView({tx, ty, sc: 1})
    hasCenteredRef.current = true
  }, [canvasSize, isMobile, mode])

  useEffect(()=>{
    if(mode === 'mindmap' && isMobile) setMode('outline')
  }, [isMobile, mode])

  const onWheel = (event) => {
    if(mode !== 'mindmap') return
    event.preventDefault()
    const factor = event.deltaY < 0 ? 1.1 : 0.91
    if(!vpRef.current) return
    setView(prev => {
      const nextSc = clampZoom(prev.sc * factor)
      const scaleFactor = nextSc / prev.sc
      const bounds = vpRef.current.getBoundingClientRect()
      const mx = bounds.width / 2
      const my = bounds.height / 2
      return {
        sc: nextSc,
        tx: mx - (mx - prev.tx) * scaleFactor,
        ty: my - (my - prev.ty) * scaleFactor,
      }
    })
  }

  const onMouseDown = (event) => {
    if(mode !== 'mindmap') return
    if(event.target.closest('.nd')) return
    panRef.current = { offsetX: event.clientX - view.tx, offsetY: event.clientY - view.ty, sc: view.sc }
  }

  const onHome = () => {
    setView(prev => ({...prev, sc: 1}))
    requestAnimationFrame(centerMap)
  }

  return (
    <div className="app-root">
      <div id="tb">
        <span className="tb-logo">GHL Dr Keoma</span>
        <span className="tb-sub">— Advocacia Caldeira Paizante</span>
        <span className="sep"></span>
        <button id="bmap" className={"btn hide-mobile" + (mode==='mindmap'? ' active':'')} onClick={()=>setMode('mindmap')}>Modo Mapa</button>
        <button id="btext" className={"btn" + (mode==='outline'? ' active':'')} onClick={()=>setMode('outline')}>Modo Texto</button>
        <button id="bval" className={"btn" + (mode==='values'? ' active':'')} onClick={()=>setMode('values')}>Valores</button>
        <div className="tb-sep"></div>
        <span className="hint">Clique direito = opções</span>
        <div className="tb-sep"></div>
        <button id="bexp" className={"btn hide-mobile"} onClick={expandAll}>Expandir</button>
        <button id="bcol" className={"btn"} onClick={collapseAll}>Recolher</button>
        <div className="tb-sep"></div>
      </div>

      <div
        id="vp"
        ref={vpRef}
        className={mode === 'mindmap' ? 'active' : ''}
        onMouseDown={onMouseDown}
        onWheel={onWheel}
      >
        <Map
          data={tree}
          onToggle={onToggle}
          transform={view}
          onCanvasSize={onCanvasSize}
        />
      </div>

      <div id="outline" className={mode==='outline' ? 'active':''}>
        <Outline data={tree} onToggle={onToggle} />
      </div>

      <div id="values" className={mode==='values' ? 'active':''}>
        <Values data={DATA} />
      </div>

      <div id="ctx" style={{display:'none'}}>
        <div className="ci">+ Adicionar sub-item</div>
        <div className="ci">↕ Adicionar irmão</div>
        <div className="csep"></div>
        <div className="ci">✎ Editar texto</div>
        <div className="ci">⊟ Recolher / Expandir</div>
        <div className="csep"></div>
        <div className="ci red">⊗ Deletar</div>
      </div>

      <div id="zoom">
        <button className="zb" onClick={()=>zoomAtCenter(0.87)}>−</button>
        <span id="zl">{Math.round(view.sc * 100)}%</span>
        <button className="zb" onClick={()=>zoomAtCenter(1.15)}>+</button>
        <button className="zb" onClick={onHome}>⌂</button>
      </div>
    </div>
  )
}
