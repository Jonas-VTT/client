import React, { useRef, useMemo, useEffect } from 'react'
import { Group, Image as KonvaImage, Line, Rect, Circle } from 'react-konva'
import { Html } from 'react-konva-utils'
import useImage from 'use-image'
import { FaTrash, FaEye, FaEyeSlash } from 'react-icons/fa'

// --- SUB-COMPONENTES VISUAIS  ---
const ImageVisual = ({ element, opacity }) => {
   const [image] = useImage(element.src)
   return (
      <KonvaImage
         image={image}
         width={element.width}
         height={element.height}
         offsetX={element.width / 2}
         offsetY={element.height / 2}
         opacity={opacity}
         rotation={element.rotation}
      />
   )
}
const FloorVisual = ({ element, isSelected, onSelect, isInteractive, gridSize = 70 }) => {
   const [pattern] = useImage(element.src)

   const patternScale = useMemo(() => {
      if (!pattern) return { x: 1, y: 1 }
      const tx = element.tilesX || 1
      const ty = element.tilesY || 1
      return {
         x: (gridSize * tx) / pattern.width,
         y: (gridSize * ty) / pattern.height
      }
   }, [pattern, gridSize, element.tilesX, element.tilesY])

   const shapeProps = {
      id: element.id,
      x: element.x,
      y: element.y,
      rotation: element.rotation,
      opacity: element.opacity,

      fillPatternImage: pattern,
      fillPatternScale: patternScale,
      fillPatternRepeat: 'repeat',

      stroke: isSelected ? '#4f46e5' : null,
      strokeWidth: isSelected ? 2 : 0,
      draggable: isInteractive && !element.locked,
      listening: isInteractive,

      closed: true,

      onClick: (e) => {
         if (!isInteractive) return
         e.cancelBubble = true
         onSelect()
      },
      onDragStart: (e) => {
         e.target.moveToTop()
         onSelect()
      },
   }

   if (element.shapeType === 'rect') {
      return (
         <Rect
            {...shapeProps}
            width={element.width}
            height={element.height}
         />
      )
   }
   if (element.shapeType === 'poly') {
      return (
         <Line
            {...shapeProps}
            points={element.points}
            closed={true}
         />
      )
   }

   return null
}
const WallVisual = ({ element, isSelected, onSelect, isInteractive, gridSize = 70 }) => {
   const [pattern] = useImage(element.src)
   const radius = 20 / 2
   const convertedPoints = useMemo(() => {
      const wallPoints = element.points || []
      const p = []
      for (let i = 0; i < wallPoints.length; i += 2) {
         p.push({ x: wallPoints[i], y: wallPoints[i + 1] })
      }
      return p
   }, [element.points])
   const patternScale = useMemo(() => {
      if (!pattern) return { x: 1, y: 1 }
      const tx = element.tilesX || 1
      const ty = element.tilesY || 1
      return {
         x: (gridSize * tx) / pattern.width,
         y: (gridSize * ty) / pattern.height
      }
   }, [pattern, gridSize, element.tilesX, element.tilesY])

   const shapeProps = {
      id: element.id,
      name: 'collisor',
      x: element.x,
      y: element.y,
      rotation: element.rotation,
      opacity: element.opacity,

      stroke: isSelected ? '#4f46e5' : null,
      strokeWidth: isSelected ? 2 : 0,
      draggable: isInteractive && !element.locked,
      listening: isInteractive,

      closed: true,

      onClick: (e) => {
         if (!isInteractive) return
         e.cancelBubble = true
         onSelect()
      },
      onDragStart: (e) => {
         e.target.moveToTop()
         onSelect()
      }
   }

   if (element.shapeType === 'poly') {
      return (
         <Group {...shapeProps}>
            {convertedPoints.map((point, i) => {
               const nextPoint = convertedPoints[i + 1]
               const elements = []

               elements.push(
                  <Circle
                     key={`joint-${i}`}
                     x={point.x}
                     y={point.y}
                     radius={radius}
                     fillPatternImage={pattern}
                     fillPatternScale={patternScale}
                  />
               )

               if (nextPoint) {
                  const length = getDistance(point, nextPoint)
                  const angleDeg = getAngleDegrees(point, nextPoint)

                  elements.push(
                     <Rect
                        key={`segment-${i}`}
                        x={point.x}
                        y={point.y}
                        width={length}
                        height={20}
                        rotation={angleDeg}
                        offsetX={0}
                        offsetY={radius}

                        fillPatternImage={pattern}
                        fillPatternScale={patternScale}
                        fillPatternRepeat="repeat"
                     />
                  )
               }
               return elements
            })}
         </Group>
      )
   }
   return null
}

// --- HUD (Menu Flutuante) ---
const ElementHUD = ({ element, isMaster, onDelete, onToggleVisibility }) => {
   return (
      <div
         className="absolute flex flex-col items-center gap-2"
         style={{
            transform: 'translate(-50%, -100%)',
            top: -15,
            pointerEvents: 'auto' // Importante para o clique funcionar
         }}
      >
         {/* Exemplo simples de HUD */}
         <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
            {element.name || "Sem Nome"}
         </div>

         {isMaster && (
            <div className="flex gap-1">
               <button onClick={() => onToggleVisibility(element)} className="bg-gray-700 text-white p-1.5 rounded hover:bg-gray-600">
                  {element.visible !== false ? <FaEye size={12} /> : <FaEyeSlash size={12} />}
               </button>
               <button onClick={onDelete} className="bg-red-700 text-white p-1.5 rounded hover:bg-red-600">
                  <FaTrash size={12} />
               </button>
            </div>
         )}
      </div>
   )
}

// --- COMPONENTE PRINCIPAL (Onde a mágica acontece) ---
const MapElement = ({
   element,
   isSelected,
   isMaster,
   onSelect,
   onDragStart,
   onDragEnd,
   checkCollide,
   // Funções extras
   onDelete,
   onToggleVisibility
}) => {
   const shapeRef = useRef(null)

   // Visibilidade e Opacidade
   const isVisible = element.visible !== false
   const finalOpacity = !isVisible ? 0.4 : (element.opacity || 1)

   // Se não for visível e não for mestre, não renderiza nada
   if (!isVisible && !isMaster) return null

   // Permissões
   const isLocked = element.locked
   // Adicione aqui sua lógica de "checkIsMyToken" se quiser bloquear drag de players
   const canInteract = !isLocked

   // Animação suave de movimento (vinda do socket)
   useEffect(() => {
      const node = shapeRef.current
      if (!node || node.isDragging()) return

      // Só anima se a diferença for grande (evita jitter)
      node.to({
         x: element.x,
         y: element.y,
         rotation: element.rotation,
         duration: 0.2
      })
   }, [element.x, element.y, element.rotation])

   return (
      <Group
         ref={shapeRef}
         id={element.id}
         x={element.x}
         y={element.y}
         rotation={element.rotation}
         draggable={canInteract}

         // --- EVENTOS UNIFICADOS ---
         onClick={(e) => {
            if (!canInteract) return
            e.cancelBubble = true
            onSelect(element.id)
         }}
         onDragStart={(e) => {
            e.target.moveToTop()
            onSelect(element.id)
            if (onDragStart) onDragStart(e)
         }}
         onDragEnd={(e) => {
            if (onDragEnd) onDragEnd(e, element)
         }}
         dragBoundFunc={(pos) => {
            // Aplica colisão apenas para tokens
            if (element.type === 'token' && checkCollide) {
               return checkCollide(pos, shapeRef.current)
            }
            return pos
         }}
      >
         {/* 1. RENDERIZAÇÃO VISUAL (Switch Case Interno) */}
         {(() => {
            switch (element.type) {
               case 'token':
               case 'asset':
               case 'prop':
                  return <ImageVisual element={element} opacity={finalOpacity} />

               case 'wall':
                  return <WallVisual element={element} opacity={finalOpacity} isSelected={isSelected} />

               case 'floor':
                  return <FloorVisual element={element} opacity={finalOpacity} isSelected={isSelected} />

               default:
                  return <Circle radius={10} fill="red" /> // Fallback de erro
            }
         })()}

         {/* 2. HUD (Apenas se selecionado e for Token/Asset) */}
         {isSelected && ['token', 'asset', 'prop'].includes(element.type) && (
            <Html divProps={{ style: { pointerEvents: 'none' } }}>
               <ElementHUD
                  element={element}
                  isMaster={isMaster}
                  onDelete={onDelete}
                  onToggleVisibility={onToggleVisibility}
               />
            </Html>
         )}
      </Group>
   )
}

// O React.memo aqui é crucial para performance!
// Ele impede que 50 tokens re-renderizem se você mover apenas 1.
export default React.memo(MapElement, (prev, next) => {
   return (
      prev.element === next.element &&
      prev.isSelected === next.isSelected &&
      prev.isMaster === next.isMaster
   )
})