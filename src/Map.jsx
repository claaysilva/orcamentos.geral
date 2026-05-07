import React, {useEffect, useMemo} from 'react'

const COL = 258
const GAP = 6
const OX = 40
const OY = 60

let measureEl = null

function cloneTree(node){
  return JSON.parse(JSON.stringify(node))
}

function ensureMeasureEl(){
  if(measureEl || typeof document === 'undefined') return measureEl
  measureEl = document.createElement('div')
  measureEl.style.cssText = 'position:absolute;visibility:hidden;left:-9999px;top:-9999px;white-space:pre-wrap;word-break:break-word;line-height:1.5;'
  document.body.appendChild(measureEl)
  return measureEl
}

function nodeHeight(text, level){
  const el = ensureMeasureEl()
  if(!el) return level === 0 ? 46 : 34
  const sizes = [13, 13, 12.5, 12]
  const paddings = ['13px 20px', '9px 18px', '5px 12px', '4px 10px']
  const widths = [230, 230, 220, 210]
  const index = Math.min(level, 3)
  el.style.fontFamily = "'Source Sans 3', sans-serif"
  el.style.fontSize = `${sizes[index]}px`
  el.style.fontWeight = level === 0 ? '700' : level === 1 ? '600' : level === 2 ? '500' : '400'
  el.style.padding = paddings[index]
  el.style.width = `${widths[index]}px`
  el.textContent = text
  return Math.max(el.offsetHeight, level === 0 ? 42 : 26)
}

function subtreeHeight(node){
  const own = nodeHeight(node.text, node._lv || 0)
  if(node.collapsed || !node.children || !node.children.length) return own
  const kids = node.children.reduce((sum, child) => sum + subtreeHeight(child) + GAP, 0) - GAP
  return Math.max(own, kids)
}

function layout(node, x, y, lv, pid, palIdx){
  node._lv = lv
  node._x = x
  node._y = y
  node._h = nodeHeight(node.text, lv)
  node._pid = pid
  node._pal = node.pal !== undefined && node.pal !== null ? node.pal : palIdx
  if(node.collapsed || !node.children || !node.children.length) return

  const total = node.children.reduce((sum, child) => sum + subtreeHeight(child) + GAP, 0) - GAP
  let cy = y + node._h / 2 - total / 2
  node.children.forEach(child => {
    const sh = subtreeHeight(child)
    const ch = nodeHeight(child.text, lv + 1)
    const childY = cy + sh / 2 - ch / 2
    layout(child, x + COL, childY, lv + 1, node.id, node._pal)
    cy += sh + GAP
  })
}

function collectNodes(node, acc = []){
  acc.push(node)
  if(!node.collapsed && node.children && node.children.length){
    node.children.forEach(child => collectNodes(child, acc))
  }
  return acc
}

function shiftTree(node, dy){
  node._y += dy
  if(node.children && node.children.length){
    node.children.forEach(child => shiftTree(child, dy))
  }
}

function getStyle(node){
  if(node._lv === 0) return { bg:'#1f2430', tx:'#fff', br:null, line:'#1f2430', badge:'#4b5563' }
  if(node._lv === 1) return { bg:'#dde3ee', tx:'#1f2430', br:null, line:'#8f99ab', badge:'#4b5563' }
  if(node._lv === 2) return { bg:'#f0f3f8', tx:'#1f2430', br:'#c5ccd8', line:'#8f99ab', badge:'#4b5563' }
  return { bg:'#f8fafc', tx:'#495166', br:'#d7dde7', line:'#8f99ab', badge:'#4b5563' }
}

function renderBadgeText(collapsed){
  return collapsed ? '+' : '−'
}

export default function Map({data, onToggle, transform, onCanvasSize}){
  const tree = useMemo(() => {
    const cloned = cloneTree(data)
    layout(cloned, OX, OY, 0, null, 0)
    const nodes = collectNodes(cloned)
    const minY = Math.min(...nodes.map(n => n._y))
    const shiftY = minY < 72 ? 72 - minY : 0
    if(shiftY) shiftTree(cloned, shiftY)
    return cloned
  }, [data])

  const nodes = useMemo(() => collectNodes(tree, []), [tree])
  const index = useMemo(() => {
    const map = new globalThis.Map()
    nodes.forEach(node => map.set(node.id, node))
    return map
  }, [nodes])

  let maxX = 0
  let maxY = 0
  nodes.forEach(node => {
    maxX = Math.max(maxX, node._x + 280)
    maxY = Math.max(maxY, node._y + node._h + 40)
  })

  useEffect(() => {
    if(onCanvasSize) {
      onCanvasSize({width: maxX + 80, height: maxY + 80})
    }
  }, [maxX, maxY, onCanvasSize])

  return (
    <div
      id="canvas"
      style={{
        position:'relative',
        width:`${maxX + 80}px`,
        height:`${maxY + 80}px`,
        minHeight:'100%',
        transform:`translate(${transform.tx}px, ${transform.ty}px) scale(${transform.sc})`,
        transformOrigin:'0 0',
      }}
    >
      <svg id="svg" style={{position:'absolute', left:0, top:0, width:maxX + 80, height:maxY + 80, overflow:'visible', pointerEvents:'none'}}>
        {nodes.map(node => {
          if(!node._pid) return null
          const parent = index.get(node._pid)
          if(!parent) return null
          const st = getStyle(node)
          const sx = parent._x + (parent._lv === 0 ? 230 : parent._lv === 1 ? 230 : parent._lv === 2 ? 220 : 210)
          const sy = parent._y + parent._h / 2
          const ex = node._x
          const ey = node._y + node._h / 2
          const mx = sx + (ex - sx) * 0.5
          return <path key={node.id} d={`M${sx},${sy} C${mx},${sy} ${mx},${ey} ${ex},${ey}`} stroke={st.line} strokeWidth={node._lv===1?2.2:node._lv===2?1.8:1.3} fill="none" strokeLinecap="round" strokeOpacity={node._lv===1?.75:.6} />
        })}
      </svg>

      {nodes.map(node => {
        const st = getStyle(node)
        const hasChildren = !!(node.children && node.children.length)
        return (
          <div
            key={node.id}
            className={'nd nd-' + node._lv}
            style={{position:'absolute', left:node._x, top:node._y}}
            onClick={(e)=>{
              e.stopPropagation()
              if(hasChildren && onToggle) onToggle(node.id)
            }}
          >
            <div
              className="lbl"
              style={{
                background: st.bg,
                color: st.tx,
                border: st.br ? `1px solid ${st.br}` : 'none',
                padding: node._lv===0 ? '13px 20px' : node._lv===1 ? '9px 18px' : node._lv===2 ? '5px 12px' : '4px 10px',
                borderRadius: node._lv===0 ? 12 : node._lv===1 ? 9 : node._lv===2 ? 8 : 7,
                maxWidth: node._lv===0 ? 230 : node._lv===1 ? 230 : node._lv===2 ? 220 : 210,
                boxShadow: node._lv===0 ? '0 4px 20px rgba(26,29,35,.18)' : node._lv===1 ? '0 2px 10px rgba(0,0,0,.08)' : node._lv===2 ? '0 1px 4px rgba(0,0,0,.06)' : 'none',
                fontSize: node._lv===0 ? 13 : node._lv===1 ? 13 : node._lv===2 ? 12.5 : 12,
                fontWeight: node._lv===0 ? 700 : node._lv===1 ? 600 : node._lv===2 ? 500 : 400,
                letterSpacing: node._lv===0 ? '-.2px' : node._lv===1 ? '-.1px' : '0'
              }}
            >{node.text}</div>
            {hasChildren ? (
              <div className="badge" style={{background: st.badge}} onClick={(e)=>{ e.stopPropagation(); if(onToggle) onToggle(node.id) }}>{renderBadgeText(node.collapsed)}</div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
