import { useState, useRef, useEffect, useMemo } from 'react'
import { Stage, Layer, Image as KonvaImage, Line, Transformer } from 'react-konva'
import useImage from 'use-image'
import api from '../../config/api'

import { FaTrash } from 'react-icons/fa'

const AnimatedURLImage = ({
   src, x, y, rotation,
   isSelected, onSelect,
   isDraggable,
   onDragMove,
   ...props
}) => {
   const [image] = useImage(src)
   const nodeRef = useRef(null)
   const isFirstRender = useRef(true)

   useEffect(() => {
      const node = nodeRef.current
      if (!node) return

      if (isFirstRender.current) {
         node.x(x)
         node.y(y)
         node.rotation(rotation)
         isFirstRender.current = false
      }
      else {
         if (node.isDragging()) return
         node.to({
            x: x,
            y: y,
            rotation: rotation,
            duration: 0.2,
            easing: Konva.Easings.EaseOut
         })
      }
   }, [x, y, rotation])

   return (
      <KonvaImage
         ref={nodeRef}
         image={image}
         {...props}

         offsetX={props.width / 2}
         offsetY={props.height / 2}

         onMouseEnter={(e) => {
            const stage = e.target.getStage()
            stage.container().style.cursor = isDraggable ? 'grab' : 'pointer'
         }}
         onMouseLeave={(e) => {
            const stage = e.target.getStage()
            stage.container().style.cursor = 'default'
         }}
         onDragMove={onDragMove}
         onDragStart={(e) => {
            e.target.moveToTop()
            e.target.to({ scaleX: 1.1, scaleY: 1.1, duration: 0.1 })
            e.target.getStage().container().style.cursor = 'grabbing'
            if (onSelect) onSelect()
         }}
         onDragEnd={(e) => {
            e.target.to({ scaleX: 1, scaleY: 1, duration: 0.1 })
            e.target.getStage().container().style.cursor = isDraggable ? 'grab' : 'default'
            props.onDragEnd && props.onDragEnd(e)
         }}
         onTransformEnd={(e) => {
            const node = e.target
            const newRotation = node.rotation()

            if (props.onDragEnd) {
               node.rotation(newRotation)
               props.onDragEnd(e)
            }
         }}
         onClick={(e) => {
            e.cancelBubble = true
            if (onSelect) onSelect()
         }}
      />
   )
}

const MapStage = ({ activeScene, isMaster, onUpdateScene, isSidebarOpen, user }) => {
   const stageRef = useRef(null)
   const transformerRef = useRef(null)

   const [scale, setScale] = useState(1)
   const [position, setPosition] = useState({ x: 0, y: 0 })
   const [menuPos, setMenuPos] = useState(null)

   const [selectedIds, setSelectedIds] = useState([])

   const gridEnabled = activeScene.mapConfig?.gridEnabled ?? true
   const gridSize = activeScene.mapConfig?.gridSize || 70
   const gridColor = activeScene.mapConfig?.gridColor || '#000'
   const gridOpacity = activeScene.mapConfig?.gridOpacity || 0.3

   useEffect(() => {
      if (selectedIds.length > 0 && transformerRef.current) {
         const stage = stageRef.current
         const selectedNodes = selectedIds.map(id => stage.findOne('#' + id)).filter(node => node)

         if (selectedNodes.length === 0) {
            setSelectedIds([])
            setMenuPos(null)
            return
         }

         transformerRef.current.nodes(selectedNodes)
         transformerRef.current.getLayer().batchDraw()

         setTimeout(updateMenuPosition, 0)
      }
      else {
         if (transformerRef.current) {
            transformerRef.current.nodes([])
         }
         setMenuPos(null)
      }
   }, [selectedIds, activeScene.elements])
   useEffect(() => {
      const handleKeyDown = (e) => {
         if ((e.key === 'Delete') && selectedIds.length > 0) {
            handleDeleteSelected()
         }
      }
      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
   }, [selectedIds, activeScene])

   const checkDeselect = (e) => {
      const clickedOnEmpty = e.target === e.target.getStage()

      if (clickedOnEmpty) {
         setSelectedIds([])
         if (transformerRef.current) {
            transformerRef.current.nodes([])
         }
         setMenuPos(null)
      }
   }
   const updateMenuPosition = () => {
      if (selectedIds.length === 0 || !transformerRef.current || transformerRef.current.nodes().length === 0) {
         setMenuPos(null)
         return
      }

      const node = transformerRef.current
      const box = node.getClientRect()

      const buttonSize = 40
      const paddingDoTransformer = 5
      const margin = 10

      let x = box.x + (box.width / 2) - (buttonSize / 2)
      let y = box.y - buttonSize - margin + paddingDoTransformer

      if (y < 0) {
         y = box.y + box.height + margin - paddingDoTransformer
      }

      setMenuPos({ x, y })
   }
   const sortedElements = useMemo(() => {
      if (!activeScene.elements) return []
      const layerPriority = { 'map': 0, 'object': 1, 'token': 2, 'dm': 3, 'fog': 4 }
      return [...activeScene.elements].sort((a, b) => (layerPriority[a.layer] || 0) - (layerPriority[b.layer] || 0))
   }, [activeScene.elements])


   const handleDeleteSelected = async () => {
      if (selectedIds.length === 0) return
      if (!isMaster) return

      try {
         if (transformerRef.current) transformerRef.current.nodes([])
         setMenuPos(null)

         const idsToDelete = [...selectedIds]
         setSelectedIds([])

         for (const id of idsToDelete) {
            await api.delete(`/scenes/${activeScene._id}/elements/${id}`)
         }
         const newElements = activeScene.elements.filter(el => !selectedIds.includes(el.id))
         onUpdateScene({ ...activeScene, elements: newElements })
      }
      catch (error) {
         console.error("Erro ao deletar", error)
      }
   }
   const handleWheel = (e) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      const oldScale = stage.scaleX()

      const pointer = stage.getPointerPosition()
      const mousePointTo = {
         x: (pointer.x - stage.x()) / oldScale,
         y: (pointer.y - stage.y()) / oldScale,
      }

      // Calcula novo zoom (Scale)
      const scaleBy = 1.1
      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy

      // Limites de Zoom
      if (newScale < 0.1 || newScale > 5) return

      setScale(newScale)

      const newPos = {
         x: pointer.x - mousePointTo.x * newScale,
         y: pointer.y - mousePointTo.y * newScale,
      }
      setPosition(newPos)
      updateMenuPosition()
   }
   const handleDrop = async (e) => {
      e.preventDefault()

      if (!isMaster && !activeScene.permissions?.allowPlayerDrops) return

      const type = e.dataTransfer.getData('type')
      if (type !== 'token') return

      try {
         const charData = JSON.parse(e.dataTransfer.getData('character'))
         const stage = stageRef.current

         stage.setPointersPositions(e)
         const pointer = stage.getPointerPosition()
         if (!pointer) return

         let centeredX, centeredY
         const dropX = (pointer.x - stage.x()) / stage.scaleX()
         const dropY = (pointer.y - stage.y()) / stage.scaleY()

         if (gridEnabled) {
            const col = Math.floor(dropX / gridSize)
            const row = Math.floor(dropY / gridSize)

            centeredX = (col * gridSize) + (gridSize / 2)
            centeredY = (row * gridSize) + (gridSize / 2)
         }
         else {
            centeredX = dropX
            centeredY = DropY
         }

         const newElement = {
            type: 'token',
            layer: 'token',
            x: centeredX,
            y: centeredY,
            width: gridSize,
            height: gridSize,
            src: charData.imageUrl || 'https://placehold.co/70x70?text=?',
            linkedCharacterId: charData._id,
            name: charData.name
         }

         const { data: updatedScene } = await api.post(`/scenes/${activeScene._id}/elements`, newElement)
         onUpdateScene(updatedScene)

      }
      catch (error) {
         console.error("Erro ao soltar token:", error)
      }
   }

   const renderGrid = () => {
      if (!gridEnabled || !activeScene.mapConfig?.gridSize) return null

      const lines = []
      const width = 5000
      const height = 5000

      for (let i = 0; i <= width / gridSize; i++) {
         lines.push(
            <Line
               key={`v-${i}`}
               points={[i * gridSize, 0, i * gridSize, height]}
               stroke={gridColor}
               strokeWidth={1}
               opacity={gridOpacity}
               listening={false}
            />
         )
      }
      for (let j = 0; j <= height / gridSize; j++) {
         lines.push(
            <Line
               key={`h-${j}`}
               points={[0, j * gridSize, width, j * gridSize]}
               stroke={gridColor}
               strokeWidth={1}
               opacity={gridOpacity}
               listening={false}
            />
         )
      }
      return lines
   }

   return (
      <div
         onDragOver={(e) => e.preventDefault()}
         onDrop={handleDrop}
         className="absolute inset-0 bg-[#18181b] overflow-hidden"
      >
         <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            draggable
            onWheel={handleWheel}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}
            ref={stageRef}
            onMouseDown={checkDeselect}

            onDragStart={(e) => {
               if (e.target === e.target.getStage()) {
                  e.target.getStage().container().style.cursor = 'grabbing'
               }
            }}
            onDragEnd={(e) => {
               if (e.target === e.target.getStage()) {
                  e.target.getStage().container().style.cursor = 'default'
                  setPosition({ x: e.target.x(), y: e.target.y() })
               }
            }}
         >
            {/* CAMADA 1: MAPA / CHÃO */}
            <Layer>
               {activeScene.media?.url && (
                  <URLImage
                     src={activeScene.media.url}
                     x={0}
                     y={0}
                  />
               )}
            </Layer>

            {/* CAMADA 2: GRID */}
            <Layer listening={false}>
               {renderGrid()}
            </Layer>

            {/* CAMADA 3: TOKENS E OBJETOS (Virá do array elements) */}
            <Layer>
               {sortedElements.map((el) => {
                  const canMove = isMaster || (user && el.controlledBy === user._id) || (user && el.linkedCharacterId && String(el.linkedCharacterId) === String(user._id))

                  return (
                     <AnimatedURLImage
                        key={el.id}
                        id={el.id}
                        src={el.src}
                        x={el.x}
                        y={el.y}
                        width={el.width}
                        height={el.height}
                        rotation={el.rotation}
                        opacity={el.opacity}

                        isSelected={selectedIds.includes(el.id)}
                        onSelect={() => setSelectedIds([el.id])}
                        isDraggable={!el.locked && canMove}
                        draggable={!el.locked && isMaster}
                        onDragMove={updateMenuPosition}
                        onDragStart={(e) => {
                           e.target.x(newX)
                           e.target.y(newY)
                           updateMenuPosition()
                        }}
                        onDragEnd={async (e) => {
                           let newX
                           let newY

                           if (gridEnabled) {
                              const col = Math.floor(x / gridSize)
                              const row = Math.floor(y / gridSize)

                              newX = (col * gridSize) + (gridSize / 2)
                              newY = (row * gridSize) + (gridSize / 2)
                           }
                           else {
                              newX = e.target.x()
                              newY = e.target.y()
                           }

                           let newRotation = e.target.rotation()
                           e.target.x(newX)
                           e.target.y(newY)

                           updateMenuPosition()

                           try {
                              const { data: updatedScene } = await api.put(
                                 `/scenes/${activeScene._id}/elements/${el.id}`,
                                 { x: newX, y: newY, rotation: newRotation }
                              )

                              onUpdateScene(updatedScene)
                           }
                           catch (error) {
                              console.error("Erro ao mover token:", error)
                              e.target.x(el.x)
                              e.target.y(el.y)
                           }
                        }}
                     />
                  )
               })}

               <Transformer
                  ref={transformerRef}
                  boundBoxFunc={(oldBox, newBox) => {
                     if (newBox.width < 5 || newBox.height < 5) return oldBox
                     return newBox
                  }}

                  borderStroke="#71717a"
                  borderStrokeWidth={1}
                  borderDash={[4, 4]}

                  anchorCornerRadius={50}
                  anchorStroke="#71717a"
                  anchorFill="#18181b"
                  anchorSize={8}

                  rotateEnabled={isMaster}
                  rotationSnaps={[0, 90, 180, 270]}
                  rotationSnapTolerance={20}

                  keepRatio={true}
                  resizeEnabled={isMaster}
                  onTransformEnd={async () => {
                     const node = transformerRef.current.nodes()[0]
                     if (!node) return

                     // O Konva altera a ESCALA (scaleX), não o width/height.
                     // Precisamos "aplicar" a escala no width para salvar corretamente.
                     const scaleX = node.scaleX()
                     const scaleY = node.scaleY()

                     // Reseta escala para 1 e atualiza dimensões
                     node.scaleX(1)
                     node.scaleY(1)

                     const newWidth = node.width() * scaleX
                     const newHeight = node.height() * scaleY

                     // Aplica visualmente
                     node.width(newWidth)
                     node.height(newHeight)

                     updateMenuPosition() // Atualiza posição do menu (bolinha)

                     // Salva no banco
                     try {
                        const { data } = await api.put(`/scenes/${activeScene._id}/elements/${node.id()}`, {
                           width: newWidth,
                           height: newHeight,
                           rotation: node.rotation(),
                           x: node.x(),
                           y: node.y()
                        })
                        onUpdateScene(updatedScene)
                     } catch (err) { console.error("Erro resize:", err) }
                  }}

                  padding={1}
               />
            </Layer>
         </Stage>

         {/* HUD DE CONTROLES */}
         {menuPos && isMaster && (
            <div
               className="absolute z-50 pointer-events-auto animate-fade-in"
               style={{
                  left: menuPos.x,
                  top: menuPos.y
               }}
            >
               <button
                  onClick={handleDeleteSelected}
                  className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 border border-gray-300"
                  title="Deletar (Del)"
               >
                  <FaTrash size={14} />
               </button>
            </div>
         )}
         <div
            className={`absolute bottom-4 right-4 flex gap-2 transition-all
            ${isSidebarOpen ? 'right-97' : 'right-15'}`}
         >
            <div className="bg-black/70 text-white px-3 py-1 rounded text-xs">
               Zoom: {Math.round(scale * 100)}%
            </div>
         </div>
      </div>
   )
}

export default MapStage