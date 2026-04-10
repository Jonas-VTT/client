import React, { useState, useRef, useEffect, useMemo, useContext, useCallback, memo } from 'react'
import { Stage, Layer, Image as KonvaImage, Line, Transformer, Tag, Text as KonvaText, Group, Rect, Circle } from 'react-konva'
import useImage from 'use-image'
import api from '../../config/api'
import { AuthContext } from '../../context/authContext'

import { getDistance, getAngleDegrees, getRayIntersection, lerp } from '../../utils/geometry'

import DebugMonitor from '../DebugMonitor'

import { FaTrash, FaHeart, FaBrain, FaBolt, FaVideo, FaEye, FaEyeSlash } from 'react-icons/fa'

//#region ELEMENTOS DO MAPA
const ElementImage = memo(({
   src, x, y, rotation, width, height,
   isSelected, onSelect,
   isDraggable, checkCollide,
   ...props
}) => {
   const [image] = useImage(src)
   const shapeRef = useRef(null)
   const isFirstRender = useRef(true)

   useEffect(() => {
      const node = shapeRef.current
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
         ref={shapeRef}
         image={image}
         width={width}
         height={height}
         {...props}

         offsetX={width / 2}
         offsetY={height / 2}

         onMouseEnter={(e) => {
            const stage = e.target.getStage()
            stage.container().style.cursor = isDraggable ? 'grab' : 'pointer'
         }}
         onMouseLeave={(e) => {
            const stage = e.target.getStage()
            stage.container().style.cursor = 'default'
         }}

         onDragStart={(e) => {
            e.target.moveToTop()
            e.target.getStage().container().style.cursor = 'grabbing'
            if (onSelect) onSelect()
            if (props.onDragStart) props.onDragStart(e)
         }}
         onDragMove={(e) => {
            if (props.onDragMove) props.onDragMove(e)
         }}
         onDragEnd={(e) => {
            e.target.getStage().container().style.cursor = isDraggable ? 'grab' : 'default'
            if (props.onDragEnd) props.onDragEnd(e)
         }}
         dragBoundFunc={(pos) => {
            if (checkCollide && shapeRef.current) {
               return checkCollide(pos, shapeRef.current)
            }
            return pos
         }}

         onTransformEnd={(e) => {
            const node = e.target
            const newRotation = node.rotation()

            if (props.onTransformEnd) {
               node.rotation(newRotation)
               props.onTransformEnd(e)
            }
         }}
         onClick={(e) => {
            e.cancelBubble = true
            if (onSelect) onSelect()
         }}
         onTap={(e) => {
            e.cancelBubble = true
            if (onSelect) onSelect()
         }}
      />
   )
})
const ElementHUDMemo = (prev, next) => {
   if (!prev.element || !next.element) return false
   if (!prev.position || !next.position) return false

   const isSameId = prev.element.id === next.element.id
   const isSameVisibility = prev.element.visible === next.element.visible
   const isSameCharId = prev.element.linkedCharacterId === next.element.linkedCharacterId
   const isSamePos = prev.position.x === next.position.x && prev.position.y === next.position.y
   const isSameMaster = prev.isMaster === next.isMaster

   return isSameId && isSameVisibility && isSameCharId && isSamePos && isSameMaster
}
const ElementHUD = memo(({ element, position, onDelete, onToggleVisibility, socket, isMaster }) => {
   if (!element || !position) return null

   const [charData, setCharData] = useState(null)
   const [loading, setLoading] = useState(true)

   const isVisible = element.visible !== false
   const hasSheet = !!element.linkedCharacterId

   useEffect(() => {
      let isMounted = true

      if (!hasSheet) {
         if (isMounted) {
            setCharData(null)
            setLoading(false)
         }
         return
      }

      const fetchChar = async () => {
         if (isMounted) {
            if (!element.linkedCharacterId) {
               setLoading(false)
               return
            }
            try {
               const { data } = await api.get(`/characters/${element.linkedCharacterId}`)
               setCharData(data)
            }
            catch (error) {
               console.error(error)
            }
            finally {
               setLoading(false)
            }
         }
      }

      fetchChar()
      return () => { isMounted = false }
   }, [element.linkedCharacterId, hasSheet])
   useEffect(() => {
      if (!socket) return

      const handleSocketUpdate = (updatedChar) => {
         if (updatedChar._id === element.linkedCharacterId) {
            setCharData(prev => {
               if (JSON.stringify(prev) === JSON.stringify(updatedChar)) return prev
            })
         }
      }

      socket.on('character_updated', handleSocketUpdate)
      return () => {
         socket.off('character_updated', handleSocketUpdate)
      }
   }, [socket, element.linkedCharacterId, hasSheet])

   const handleInputChange = (stat, newValue) => {
      setCharData(prev => ({
         ...prev,
         sheet: {
            ...prev.sheet,
            [stat]: { ...prev.sheet[stat], atual: Number(newValue) }
         }
      }))
   }
   const handleSave = async (stat) => {
      if (!charData) return
      try {
         await api.put(`/characters/${element.linkedCharacterId}`, {
            sheet: {
               ...charData.sheet,
               [stat]: { ...charData.sheet[stat], atual: charData.sheet[stat].atual }
            }
         })
      } catch (err) { console.error("Erro ao salvar status", err) }
   }
   const handleKeyDown = (e, stat) => {
      if (e.key === 'Enter') e.target.blur()
   }

   if (loading) return null
   const showStats = hasSheet && charData && charData.type === 'pc'

   return (
      <div
         className="absolute z-50 animate-slide-up flex flex-col items-center gap-2"
         style={{
            left: -47,
            top: 0
         }}
      >
         {/* LINHA DE STATUS */}
         {showStats && (
            <div className="flex gap-2">

               {/* BOLINHA VIDA (PV) */}
               <div className="relative group">
                  <input
                     type="number"
                     className="w-10 h-10 bg-red-900/90 text-white font-bold text-center outline-none border-2 border-black rounded-full transition-all shadow-lg focus:scale-110"
                     value={charData.sheet.pv.atual}
                     onChange={(e) => handleInputChange('pv', e.target.value)}
                     onBlur={() => handleSave('pv')}
                     onKeyDown={(e) => handleKeyDown(e, 'pv')}
                  />
                  <div className="absolute top-0 -right-1 bg-red-600 border border-black rounded-full p-0.5 shadow-sm pointer-events-none">
                     <FaHeart size={8} className="text-white" />
                  </div>
               </div>

               {/* BOLINHA SANIDADE (SAN) */}
               <div className="relative group">
                  <input
                     type="number"
                     className="w-10 h-10 bg-blue-600/90 text-white font-bold text-center outline-none border-2 border-black rounded-full transition-all shadow-lg focus:scale-110"
                     value={charData.sheet.san.atual}
                     onChange={(e) => handleInputChange('san', e.target.value)}
                     onBlur={() => handleSave('san')}
                     onKeyDown={(e) => handleKeyDown(e, 'san')}
                  />
                  <div className="absolute top-0 -right-1 bg-blue-500 border border-black rounded-full p-0.5 shadow-sm pointer-events-none">
                     <FaBrain size={8} className="text-white" />
                  </div>
               </div>

               {/* BOLINHA ESFORÇO (PE) */}
               <div className="relative group">
                  <input
                     type="number"
                     className="w-10 h-10 bg-yellow-600/90 text-white font-bold text-center outline-none border-2 border-black rounded-full transition-all shadow-lg focus:scale-110"
                     value={charData.sheet.pe.atual}
                     onChange={(e) => handleInputChange('pe', e.target.value)}
                     onBlur={() => handleSave('pe')}
                     onKeyDown={(e) => handleKeyDown(e, 'pe')}
                  />
                  <div className="absolute top-0 -right-1 bg-yellow-500 border border-black rounded-full p-0.5 shadow-sm pointer-events-none">
                     <FaBolt size={8} className="text-white" />
                  </div>
               </div>

            </div>
         )}

         {/* BOTÕES DE AÇÃO */}
         <div
            className="absolute w-full flex justify-center gap-3 pointer-events-none"
            style={{
               top: (element.height || 70) + 125
            }}
         >
            {isMaster && (
               <button
                  onClick={() => onToggleVisibility(element)}
                  title={isVisible ? "Tornar Invisível" : "Tornar Visível"}
                  className={`w-10 h-10 flex items-center justify-center border border-gray-800 rounded-full shadow-lg pointer-events-auto hover:scale-110 transition-all cursor-pointer backdrop-blur-sm
                        ${isVisible ? 'bg-gray-500/70 text-gray-300 hover:text-white' : 'bg-indigo-600/90 text-white border-indigo-400'}`}
               >
                  {isVisible ? <FaEye size={16} /> : <FaEyeSlash size={16} />}
               </button>
            )}

            <button
               onClick={onDelete}
               title="Deletar Token"
               className="bg-gray-500/70 w-10 h-10 text-gray-300 flex items-center justify-center border border-gray-800 rounded-full shadow-lg
                  pointer-events-auto hover:text-gray-100 hover:scale-110 transition-all active:scale-95  cursor-pointer backdrop-blur-sm"
            >
               <FaTrash size={12} />
            </button>
         </div>
      </div>
   )
}, ElementHUDMemo)
//#endregion

//#region RENDERS
const GridRenderer = React.memo(({ width, height, gridSize, gridColor, gridOpacity }) => {
   if (!gridSize || gridSize <= 0 || gridOpacity === 0) return null

   const lines = []

   // Linhas do Grid
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
   return <Group>{lines}</Group>
})
const FogRenderer = React.memo(({ width, height, isMaster, fogShapes }) => {
   return (
      <Group>
         <Rect
            x={0} y={0}
            width={width} height={height}
            fill="black"
            opacity={isMaster ? 0.4 : 1}
            listening={false}
         />
         <Group globalCompositeOperation="destination-out">
            {fogShapes}
         </Group>
      </Group>
   )
})
const ElementsGroup = React.memo(({
   elements,
   layerName,
   isMaster,
   activeLayer,
   activeTool,
   selectedIds,
   onSelectElement,
   onDragStart,
   onDragMove,
   onDragEnd,
   checkCollide,
   gridSize,
   myCharacters,
   user
}) => {
   const isLayerActive = isMaster ? (activeLayer === layerName) : (layerName === 'token')
   const isObjectLayerActive = isMaster ? (activeLayer === 'object') : false
   const checkActive = (layerName === 'object') ? isObjectLayerActive : isLayerActive

   const checkIsMyToken = (token) => {
      if (!user) return false
      if (token.type !== 'token') return true
      if (isMaster) return true
      const char = myCharacters.find(c => c._id === token.linkedCharacterId)
      return !!char
   }

   return elements.map((element) => {
      const isVisible = element.visible !== false
      if (!isVisible && !isMaster) return null
      const finalOpacity = !isVisible ? 0.4 : (element.opacity || 1)

      const isInteractive = checkActive
      const allowInteract = isInteractive && !element.locked && (['select', 'gallery'].includes(activeTool) && checkIsMyToken(element))
      const isSelected = selectedIds.includes(element.id)

      // PAREDE
      if (element.type === 'wall') {
         return (
            <WallShape
               key={element.id}
               element={element}
               isSelected={isSelected}
               onSelect={() => onSelectElement(element.id)}
               isInteractive={allowInteract && isMaster}
               gridSize={gridSize}
               onDragEnd={(e) => onDragEnd(e, element)}
            />
         )
      }
      // CHÃO
      if (element.type === 'floor') {
         return (
            <FloorShape
               key={element.id}
               element={element}
               isSelected={isSelected}
               onSelect={() => onSelectElement(element.id)}
               isInteractive={allowInteract && isMaster}
               gridSize={gridSize}
               onDragEnd={(e) => onDragEnd(e, element)}
            />
         )
      }
      // TOKEN / OBJETO / IMAGEM
      return (
         <ElementImage
            key={element.id}
            id={element.id}
            src={element.src}
            x={element.x}
            y={element.y}
            width={element.width}
            height={element.height}
            rotation={element.rotation}
            opacity={finalOpacity}
            listening={isInteractive}
            isSelected={isSelected}
            isDraggable={allowInteract}
            draggable={allowInteract}
            checkCollide={checkCollide}

            // Eventos passados pelo pai
            onSelect={() => allowInteract && onSelectElement(element.id)}
            onDragStart={onDragStart}
            onDragMove={onDragMove}
            onDragEnd={(e) => onDragEnd(e, element)}
         />
      )
   })
}, (prev, next) => {
   return (
      prev.elements === next.elements &&
      prev.selectedIds === next.selectedIds &&
      prev.activeTool === next.activeTool &&
      prev.activeLayer === next.activeLayer &&
      prev.myCharacters === next.myCharacters &&
      prev.isMaster === next.isMaster
   )
})
//#endregion

//#region FERRAMENTA DE RÉGUA
const RulerOverlay = ({ start, end, gridSize = 70 }) => {
   if (!start || !end) return null

   const dx = end.x - start.x
   const dy = end.y - start.y
   const distancePx = Math.sqrt(dx * dx + dy * dy)

   // Cálculo: (Pixels / TamanhoGrid) * 1.5m
   const distanceMeters = (distancePx / gridSize) * 1.5

   // Ponto médio para colocar o texto
   const midX = (start.x + end.x) / 2
   const midY = (start.y + end.y) / 2

   return (
      <Group listening={false}>
         {/* Linha Tracejada */}
         <Line
            points={[start.x, start.y, end.x, end.y]}
            stroke="white"
            strokeWidth={2}
            dash={[10, 5]}
            shadowColor="black"
            shadowBlur={2}
         />

         {/* Etiqueta de Distância */}
         <Group x={midX} y={midY - 20}>
            <Tag
               fill="#ffffff"
               opacity={0.8}
               pointerDirection="down"
               pointerWidth={10}
               pointerHeight={10}
               lineJoin="round"
               cornerRadius={5}
            />
            <KonvaText
               text={`${distanceMeters.toFixed(1)}m`}
               fontFamily="monospace"
               fontSize={14}
               padding={5}
               fill="white"
               align="center"
               offsetX={20}
               offsetY={25}
            />
         </Group>
      </Group>
   )
}
//#endregion

//#region FERRAMENTA DE DESENHO
const DRAWING_CONFIG = {
   wall: {
      defaultShape: 'poly',
      minPoints: 2,
      autoClose: false,
      hasFill: false,
      hasStroke: true,
      forceStrokeWidth: true,
   },
   floor: {
      defaultShape: 'rect',
      minPoints: 3,
      autoClose: true,
      hasFill: true,
      hasStroke: false,
      forceStrokeWidth: false
   }
}
const FloorShape = ({ element, isSelected, onSelect, isInteractive, onDragEnd, gridSize = 70 }) => {
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
      onDragEnd: (e) => {
         if (onDragEnd) onDragEnd(e)
      }
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
const WallShape = ({ element, isSelected, onSelect, isInteractive, onDragEnd, gridSize = 70 }) => {
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
      },
      onDragEnd: (e) => {
         if (onDragEnd) onDragEnd(e)
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
//#endregion

const MapStage = ({ activeScene, isMaster, onUpdateScene, isSidebarOpen, activeTool, socket, isSyncing, objectDrawing, activeLayer }) => {
   //#region VARIAVEIS
   const { user } = useContext(AuthContext)

   const stageRef = useRef(null)
   const transformerRef = useRef(null)
   const isPanning = useRef(false)
   const lastMousePos = useRef({ x: 0, y: 0 })
   const targetView = useRef({ x: 0, y: 0, scale: 1 })
   const positionRef = useRef({ x: 0, y: 0 })

   const lastDist = useRef(0)

   const [selectedIds, setSelectedIds] = useState([])
   const [scale, setScale] = useState(1)
   const [position, setPosition] = useState({ x: 0, y: 0 })
   const [ruler, setRuler] = useState(null)
   const [isViewLocked, setIsViewLocked] = useState(false)
   const hudContainerRef = useRef(null)

   const [myCharacters, setMyCharacters] = useState([])

   const snapEnabled = activeScene.mapConfig?.gridSnap ?? true
   const gridSize = activeScene.mapConfig?.gridSize || 70
   const gridColor = activeScene.mapConfig?.gridColor || '#000'
   const gridOpacity = activeScene.mapConfig?.gridOpacity || 0.3

   const mapSizeConfig = activeScene.mapConfig?.mapSize || {}
   const limitView = mapSizeConfig.hasLimit ?? true
   const mapWidth = mapSizeConfig.mapWidth * gridSize
   const mapHeight = mapSizeConfig.mapHeight * gridSize
   const mapMargin = 100

   const [drawStart, setDrawStart] = useState(null)
   const [drawPoints, setDrawPoints] = useState([])
   const [currentMousePos, setCurrentMousePos] = useState(null)
   const [drawingPattern] = useImage(objectDrawing?.texture || '')

   const [isFogEnabled, setIsFogEnabled] = useState(true)
   const [fogShapes, setFogShapes] = useState([])
   //#endregion

   //#region ---------- DEBUG ---------
   const [showDebug, setShowDebug] = useState(false)
   const [debugVisionPoints, setDebugVisionPoints] = useState([])
   const debugData = {
      activeTool,
      activeLayer,
      isMaster,
      snapEnabled,
      gridSize,
      zoomScale: scale,

      // States Complexos (Objetos)
      objectDrawing,
      ruler,
      position,

      // Arrays
      drawPoints,
      selectedIds,

      // Flags
      isPanning: isPanning.current, // Refs precisam do .current
      isViewLocked,
      isSyncing,

      // Dados Dinâmicos
      mousePos: currentMousePos,
      elementsCount: activeScene?.elements?.length || 0
   }
   const wallCache = useRef([])
   useEffect(() => {
      const handleDebugKey = (e) => {
         if (e.ctrlKey && e.key === "'") {
            setShowDebug(prev => !prev)
         }
      }
      window.addEventListener('keydown', handleDebugKey)
      return () => window.removeEventListener('keydown', handleDebugKey)
   }, [])
   //#endregion

   //#region --------- INTERAÇÃO E SELEÇÃO ---------  
   useEffect(() => {
      if (selectedIds.length > 0 && transformerRef.current) {
         const stage = stageRef.current
         const selectedNodes = selectedIds.map(id => stage.findOne('#' + id)).filter(node => node)

         if (selectedNodes.length === 0) {
            setSelectedIds([])
            if (hudContainerRef.current) {
               hudContainerRef.current.style.display = 'none'
            }
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
         if (hudContainerRef.current) hudContainerRef.current.style.display = 'none'
      }
   }, [selectedIds, activeScene.elements]) // Atualiza a caixa de seleção
   useEffect(() => {
      const handleKeyDown = (e) => {
         if ((e.key === 'Delete') && selectedIds.length > 0) {
            handleDeleteSelected()
         }
         if (e.key.toLowerCase() === 'h' && selectedIds.length > 0) {
            if (!isMaster) return

            selectedIds.forEach(id => {
               const element = activeScene.elements.find(element => element.id === id)
               if (element) {
                  handleToggleVisibility(element)
               }
            })
         }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
   }, [selectedIds, activeScene])
   useEffect(() => {
      setSelectedIds([])
      if (transformerRef.current) transformerRef.current.nodes([])
   }, [activeLayer])

   const getCursorStyle = () => {
      if (activeTool === 'ruler' || activeTool === 'draw' || activeTool === 'ping') return 'crosshair'
      return 'default'
   }
   const updateMenuPosition = () => {
      if (selectedIds.length === 0 || !transformerRef.current || transformerRef.current.nodes().length === 0) {
         if (hudContainerRef.current) {
            hudContainerRef.current.style.display = 'none'
         }
         return
      }

      const node = transformerRef.current
      const box = node.getClientRect()

      const buttonSize = 40
      const paddingDoTransformer = 5
      const margin = 10

      let x = box.x + (box.width / 2) - (buttonSize / 2)
      let y = box.y - buttonSize - margin + paddingDoTransformer

      if (hudContainerRef.current) {
         hudContainerRef.current.style.display = 'block'
         hudContainerRef.current.style.transform = `translate(${x}px, ${y}px)`
      }
   }
   const checkDeselect = (e) => {
      if (!['select', 'gallery'].includes(activeTool)) return
      const clickedOnEmpty = e.target === e.target.getStage()

      if (clickedOnEmpty) {
         setSelectedIds([])
         if (transformerRef.current) {
            transformerRef.current.nodes([])
         }
      }
   }
   const handleDeleteSelected = async () => {
      if (selectedIds.length === 0) return

      try {
         if (transformerRef.current) transformerRef.current.nodes([])
         if (hudContainerRef.current) {
            hudContainerRef.current.style.display = 'none'
         }

         const idsToDelete = [...selectedIds]
         setSelectedIds([])

         for (const id of idsToDelete) {
            const element = activeScene.elements.find(element => element.id === id)
            if (!element) continue
            const isMine = checkIsMyToken(element)

            if (!isMaster && !isMine) {
               console.warn("Permissão negada para deletar:", element.id)
               continue
            }

            await api.delete(`/scenes/${activeScene._id}/elements/${id}`)
         }
         const newElements = activeScene.elements.filter(element => !selectedIds.includes(element.id))
         onUpdateScene({ ...activeScene, elements: newElements })
      }
      catch (error) {
         console.error("Erro ao deletar", error)
      }
   }
   const handleToggleVisibility = async (targetElement) => {
      if (!isMaster) return

      const newVisibleState = targetElement.visible === false ? true : false

      try {
         const updatedEl = { ...targetElement, visible: newVisibleState }
         const newElements = activeScene.elements.map(element =>
            element.id === targetElement.id ? updatedEl : element
         )
         onUpdateScene({ ...activeScene, elements: newElements })

         await api.put(`/scenes/${activeScene._id}/elements/${targetElement.id}`, {
            visible: newVisibleState
         })
      }
      catch (error) {
         console.error("Erro ao mudar visibilidade", error)
      }
   }
   //#endregion

   //#region --------- CÂMERA, ZOOM E DIRETOR ---------
   useEffect(() => {
      const handleForceView = (e) => {
         const { x, y, scale: newScale } = e.detail

         if (stageRef.current) {
            stageRef.current.to({
               x: x,
               y: y,
               scaleX: newScale,
               scaleY: newScale,
               duration: 1.5,
               easing: Konva.Easings.EaseInOut
            })
         }
         setPosition({ x, y })
         setScale(newScale)
         targetView.current = { x, y, scale: newScale }
         positionRef.current = { x, y }
      }
      const handleSyncView = (e) => {
         const { x, y, scale: newScale } = e.detail

         targetView.current = { x, y, scale: newScale }

         setIsViewLocked(true)
         isPanning.current = false
         document.body.style.cursor = 'default'
      }

      window.addEventListener('map_force_view', handleForceView)
      window.addEventListener('map_sync_view', handleSyncView)

      return () => {
         window.removeEventListener('map_force_view', handleForceView)
         window.removeEventListener('map_sync_view', handleSyncView)
      }
   }, [])
   useEffect(() => {
      let animId
      const animate = () => {
         if (isViewLocked) {
            setPosition(prev => ({
               x: lerp(prev.x, targetView.current.x, 0.1),
               y: lerp(prev.y, targetView.current.y, 0.1)
            }))

            setScale(prev => lerp(prev, targetView.current.scale, 0.1))
         }
         animId = requestAnimationFrame(animate)
      }

      animate()
      return () => cancelAnimationFrame(animId)
   }, [isViewLocked])
   useEffect(() => {
      if (isSyncing && isMaster) {
         broadcastView(positionRef.current, scale)
      }
   }, [isSyncing])

   const broadcastView = (newPos, newScale) => {
      if (!isMaster || !socket) return

      if (isSyncing) {
         socket.emit('gm_sync_view', {
            campaignId: activeScene.campaign,
            x: newPos.x,
            y: newPos.y,
            scale: newScale
         })
      }
   }
   const clampPosition = (x, y, currentScale) => {
      if (!limitView) return { x, y }

      const stageW = window.innerWidth
      const stageH = window.innerHeight

      const maxX = mapMargin
      const maxY = mapMargin
      const minX = -(mapWidth * currentScale) + stageW - maxX
      const minY = -(mapHeight * currentScale) + stageH - maxY

      const finalX = (minX > maxX) ? (stageW - mapWidth * currentScale) / 2 : Math.max(minX, Math.min(x, maxX))
      const finalY = (minY > maxY) ? (stageH - mapHeight * currentScale) / 2 : Math.max(minY, Math.min(y, maxY))

      return { x: finalX, y: finalY }
   }
   const handleWheel = (e) => {
      if (isViewLocked && !isMaster) return

      e.evt.preventDefault()
      const stage = stageRef.current
      const oldScale = stage.scaleX()

      const pointer = stage.getPointerPosition()
      const mousePointTo = {
         x: (pointer.x - stage.x()) / oldScale,
         y: (pointer.y - stage.y()) / oldScale,
      }

      const scaleBy = 1.1
      const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy
      if (newScale < 0.1 || newScale > 5) return

      const attemptedX = pointer.x - mousePointTo.x * newScale
      const attemptedY = pointer.y - mousePointTo.y * newScale
      const newPos = clampPosition(attemptedX, attemptedY, newScale)

      positionRef.current = newPos
      setScale(newScale)
      setPosition(newPos)
      updateMenuPosition()

      if (isSyncing) broadcastView(newPos, newScale)
   }
   //#endregion

   //#region --------- SISTEMA DE TOKENS ---------
   const getCorners = (node) => {
      const rect = node.getClientRect({ skipTransform: true });
      const transform = node.getAbsoluteTransform()

      return [
         transform.point({ x: rect.x, y: rect.y }),
         transform.point({ x: rect.x + rect.width, y: rect.y }),
         transform.point({ x: rect.x + rect.width, y: rect.y + rect.height }),
         transform.point({ x: rect.x, y: rect.y + rect.height }),
      ];
   }
   const doPolygonsIntersect = (a, b) => {
      const polygons = [a, b];
      let minA, maxA, projected, i, i1, j, minB, maxB;

      for (i = 0; i < polygons.length; i++) {
         const polygon = polygons[i];
         for (i1 = 0; i1 < polygon.length; i1++) {
            const i2 = (i1 + 1) % polygon.length;
            const p1 = polygon[i1];
            const p2 = polygon[i2];
            const normal = { x: p2.y - p1.y, y: p1.x - p2.x };

            minA = maxA = undefined;
            for (j = 0; j < a.length; j++) {
               projected = normal.x * a[j].x + normal.y * a[j].y;
               if (minA === undefined || projected < minA) minA = projected;
               if (maxA === undefined || projected > maxA) maxA = projected;
            }

            minB = maxB = undefined;
            for (j = 0; j < b.length; j++) {
               projected = normal.x * b[j].x + normal.y * b[j].y;
               if (minB === undefined || projected < minB) minB = projected;
               if (maxB === undefined || projected > maxB) maxB = projected;
            }

            if (maxA < minB || maxB < minA) return false;
         }
      }
      return true;
   }
   const checkCollide = (pos, tokenNode) => {
      const wallPolygons = wallCache.current
      const currentAbsPos = tokenNode.getAbsolutePosition()
      const stage = tokenNode.getStage()

      const scale = stage.scaleX()
      const tokenWidth = tokenNode.width() * scale
      const tokenHeight = tokenNode.height() * scale

      //#region LIMITE DE MAPA
      const stageX = stage.x()
      const stageY = stage.y()

      const minX = stageX + tokenWidth / 2
      const minY = stageY + tokenHeight / 2
      const maxX = stageX + (mapWidth * scale) - tokenWidth / 2
      const maxY = stageY + (mapHeight * scale) - tokenHeight / 2

      const clampedPos = {
         x: Math.max(minX, Math.min(pos.x, maxX)),
         y: Math.max(minY, Math.min(pos.y, maxY))
      }
      //#endregion

      //#region COLISÃO
      const element = activeScene.elements.find(el => el.id === tokenNode.id())
      if (element && element.visible === false) return clampedPos
      if (wallPolygons.length == 0) return clampedPos

      const dx = pos.x - currentAbsPos.x
      const dy = pos.y - currentAbsPos.y

      if (Math.abs(dx) < 1 && Math.abs(dy) < 1) return currentAbsPos

      const distance = Math.hypot(dx, dy)
      const stepSize = 10
      const steps = Math.ceil(distance / stepSize)
      let lastSafePos = currentAbsPos

      for (let i = 1; i <= steps; i++) {
         const progress = i / steps
         const nextCenterX = currentAbsPos.x + (dx * progress)
         const nextCenterY = currentAbsPos.y + (dy * progress)

         const nextX = nextCenterX - (tokenWidth / 2)
         const nextY = nextCenterY - (tokenHeight / 2)

         const tokenPolygon = [
            { x: nextX, y: nextY },
            { x: nextX + tokenWidth, y: nextY },
            { x: nextX + tokenWidth, y: nextY + tokenHeight },
            { x: nextX, y: nextY + tokenHeight }
         ]

         const hasCollision = wallPolygons.some(wallPoly => {
            return doPolygonsIntersect(wallPoly, tokenPolygon)
         })
         if (hasCollision) return lastSafePos
         lastSafePos = { x: nextCenterX, y: nextCenterY }
      }
      //#endregion

      return clampedPos
   }
   //#endregion

   //#region --------- SISTEMA DE DESENHO ---------
   useEffect(() => {
      const handleDrawKeys = (e) => {
         if (!objectDrawing.active) return

         if (e.key === 'Escape') {
            setDrawStart(null)
            setDrawPoints([])
            setCurrentMousePos(null)
         }
         if (e.key === 'Enter') {
            if (objectDrawing.shape === 'poly') {
               finishDrawing('poly')
            }
         }
      }

      window.addEventListener('keydown', handleDrawKeys)
      return () => window.removeEventListener('keydown', handleDrawKeys)
   }, [objectDrawing, drawPoints, drawStart, currentMousePos]) // Teclas de atalho para os desenhos
   const getSnappedPosition = (stageX, stageY) => {
      const transform = stageRef.current.getAbsoluteTransform().copy()
      transform.invert()
      const pos = transform.point({ x: stageX, y: stageY })

      const useSnap = objectDrawing.active ? objectDrawing.snap : snapEnabled
      if (!useSnap) return pos

      const col = Math.floor(pos.x / gridSize)
      const row = Math.floor(pos.y / gridSize)

      const vertexX = Math.round(pos.x / gridSize) * gridSize
      const vertexY = Math.round(pos.y / gridSize) * gridSize

      const centerX = (col * gridSize) + (gridSize / 2)
      const centerY = (row * gridSize) + (gridSize / 2)

      const distToVertex = Math.hypot(pos.x - vertexX, pos.y - vertexY)
      const distToCenter = Math.hypot(pos.x - centerX, pos.y - centerY)

      if (distToVertex < distToCenter) {
         return { x: vertexX, y: vertexY }
      }
      else {
         return { x: centerX, y: centerY }
      }
   }
   const finishDrawing = async (overrideShape = null, startPos = null, endPos = null) => {
      const currentType = objectDrawing.type
      const config = DRAWING_CONFIG[currentType]

      if (!config) return console.error("Tipo de desenho desconhecido:", currentType)

      const shapeMode = overrideShape || objectDrawing.shape
      let finalData = {}

      if (shapeMode == 'rect') {
         const s = startPos || drawStart
         const e = endPos || currentMousePos
         if (!s || !e) return


         const x = Math.min(s.x, e.x)
         const y = Math.min(s.y, e.y)
         const width = Math.abs(e.x - s.x)
         const height = Math.abs(e.y - s.y)
         if (width < 5 || height < 5) return

         finalData = {
            shapeType: 'rect',
            x, y, width, height,
            points: []
         }
      }
      else if (shapeMode === 'poly') {
         if (drawPoints.length < config.minPoints) return

         const xs = drawPoints.map(p => p.x)
         const ys = drawPoints.map(p => p.y)
         const minX = Math.min(...xs)
         const minY = Math.min(...ys)
         const maxX = Math.max(...xs)
         const maxY = Math.max(...ys)

         const normalizedPoints = drawPoints.flatMap(p => [
            p.x - minX,
            p.y - minY
         ])

         finalData = {
            shapeType: 'poly',
            x: minX, y: minY,
            width: Math.max(...xs) - minX,
            height: Math.max(...ys) - minY,
            points: drawPoints.flatMap(p => [p.x - minX, p.y - minY])
         }
      }

      await createShapeAPI({
         strokeWidth: config.forceStrokeWidth ? (objectDrawing.strokeWidth || 20) : 0,
         ...finalData
      })

      setDrawPoints([])
      setDrawStart(null)
      setCurrentMousePos(null)
   }
   const createShapeAPI = async (payload) => {
      try {
         const newElement = {
            type: objectDrawing.type,
            src: objectDrawing.texture,
            tilesX: objectDrawing.tilesX || 1,
            tilesY: objectDrawing.tilesY || 1,
            rotation: 0,
            layer: activeLayer,
            ...payload
         }
         const { data: updatedScene } = await api.post(`/scenes/${activeScene._id}/elements`, newElement)
         onUpdateScene(updatedScene)
      }
      catch (error) {
         console.error("Erro ao criar shape", error)
      }
   }

   const previewPatternScale = useMemo(() => {
      if (!drawingPattern || !objectDrawing.active) return { x: 1, y: 1 }

      const tx = objectDrawing.tilesX || 1
      const ty = objectDrawing.tilesY || 1

      return {
         x: (gridSize * tx) / drawingPattern.width,
         y: (gridSize * ty) / drawingPattern.height
      }
   }, [drawingPattern, objectDrawing, gridSize])
   //#endregion

   //#region --------- INPUT ROUTERS ---------
   const handleMouseDown = (e) => {
      checkDeselect(e)

      if (e.evt.button === 1 || e.evt.button === 2) {
         if (isViewLocked) return

         isPanning.current = true
         lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY }
         e.target.getStage().container().style.cursor = 'grabbing'
         return
      }
      if (activeTool === 'ruler' && e.evt.button === 0) {
         const stage = e.target.getStage()
         const pointer = stage.getRelativePointerPosition()
         setRuler({ start: pointer, end: pointer })
      }
      if (activeTool === 'director' && isMaster && e.evt.button === 0) {
         const stage = e.target.getStage()
         const pointer = stage.getRelativePointerPosition()

         const newX = (window.innerWidth / 2) - (pointer.x * scale)
         const newY = (window.innerHeight / 2) - (pointer.y * scale)

         stage.to({ x: newX, y: newY, duration: 1 })
         setPosition({ x: newX, y: newY })
         positionRef.current = { x: newX, y: newY }

         if (socket) {
            socket.emit('gm_force_view', {
               campaignId: activeScene.campaign,
               x: newX, y: newY, scale
            })
         }
      }
      if (activeTool === 'gallery' && objectDrawing.active) {
         const stage = e.target.getStage()
         const snapped = getSnappedPosition(stage.getPointerPosition().x, stage.getPointerPosition().y)
         const config = DRAWING_CONFIG[objectDrawing.type]

         if (!config) return

         if (objectDrawing.shape === 'rect') {
            setDrawStart(snapped)
         }
         else if (objectDrawing.shape == 'poly') {
            if (config.autoClose && drawPoints.length > 2) {
               const first = drawPoints[0]
               if (Math.hypot(snapped.x - first.x, snapped.y - first.y) < 15) {
                  finishDrawing('poly')
                  return
               }
            }
            setDrawPoints(prev => [...prev, snapped])
         }
      }
   }
   const handleMouseMove = (e) => {
      const stage = e.target.getStage()

      if (isPanning.current) {
         e.evt.preventDefault()
         if (isViewLocked) return

         const dx = e.evt.clientX - lastMousePos.current.x
         const dy = e.evt.clientY - lastMousePos.current.y

         const attemptedX = positionRef.current.x + dx
         const attemptedY = positionRef.current.y + dy
         const newPos = clampPosition(attemptedX, attemptedY, scale)

         positionRef.current = newPos
         setPosition(newPos)
         lastMousePos.current = { x: e.evt.clientX, y: e.evt.clientY }

         if (isSyncing) broadcastView(newPos, scale)
      }
      if (ruler && activeTool === 'ruler') {
         const pointer = stage.getRelativePointerPosition()
         setCurrentMousePos(pointer)
         setRuler(prev => ({ ...prev, end: pointer }))
      }
      if (activeTool === 'gallery') {
         if (objectDrawing.active && isMaster) {
            const snapped = getSnappedPosition(stage.getPointerPosition().x, stage.getPointerPosition().y)
            setCurrentMousePos(snapped)
            return
         }
      }
   }
   const handleMouseUp = async (e) => {
      if (isPanning.current) {
         isPanning.current = false
         e.target.getStage().container().style.cursor = getCursorStyle()
      }

      if (activeTool === 'ruler') {
         setRuler(null)
      }
      else if (activeTool === 'gallery') {
         if (objectDrawing.shape === 'rect') {
            const stage = e.target.getStage()
            const end = getSnappedPosition(stage.getPointerPosition().x, stage.getPointerPosition().y)

            await finishDrawing('rect', drawStart, end)

            setDrawStart(null)
            setCurrentMousePos(null)
            return
         }
      }
   }

   const getCenter = (p1, p2) => {
      return {
         x: (p1.clientX + p2.clientX) / 2,
         y: (p1.clientY + p2.clientY) / 2,
      }
   }
   const getDistance = (p1, p2) => {
      return Math.sqrt(Math.pow(p2.clientX - p1.clientX, 2) + Math.pow(p2.clientY - p1.clientY, 2))
   }
   const handleTouchStart = (e) => {
      e.evt.preventDefault() // Impede que a tela do navegador role junto
      checkDeselect(e)

      const touch1 = e.evt.touches[0]
      const touch2 = e.evt.touches[1]

      if (touch1 && touch2) {
         // Iniciou Pinça (2 dedos)
         isPanning.current = true
         lastDist.current = getDistance(touch1, touch2)
         lastMousePos.current = getCenter(touch1, touch2)
      } else if (touch1) {
         // Toque Simples (1 dedo no fundo) = Pan
         const clickedOnEmpty = e.target === e.target.getStage()
         if (clickedOnEmpty) {
            isPanning.current = true
            lastMousePos.current = { x: touch1.clientX, y: touch1.clientY }
         }
      }
   }
   const handleTouchMove = (e) => {
      e.evt.preventDefault()
      const stage = stageRef.current
      const touch1 = e.evt.touches[0]
      const touch2 = e.evt.touches[1]

      if (touch1 && touch2) {
         // --- ZOOM PINÇA (2 DEDOS) ---
         if (isViewLocked && !isMaster) return

         const dist = getDistance(touch1, touch2)
         const point = getCenter(touch1, touch2)

         if (!lastDist.current) lastDist.current = dist

         const oldScale = stage.scaleX()
         let newScale = oldScale * (dist / lastDist.current)
         newScale = Math.max(0.1, Math.min(newScale, 5)) // Limites do Zoom

         // Matemática para dar zoom no centro dos dedos
         const mousePointTo = {
            x: (point.x - stage.x()) / oldScale,
            y: (point.y - stage.y()) / oldScale,
         }

         const newPos = {
            x: point.x - mousePointTo.x * newScale,
            y: point.y - mousePointTo.y * newScale,
         }

         const clampedPos = clampPosition(newPos.x, newPos.y, newScale)

         setScale(newScale)
         setPosition(clampedPos)
         positionRef.current = clampedPos
         lastDist.current = dist
         lastMousePos.current = point

         if (isSyncing) broadcastView(clampedPos, newScale)
         updateMenuPosition()
      }
      else if (touch1 && isPanning.current) {
         // --- ARRASTAR SIMPLES (1 DEDO) ---
         if (isViewLocked) return

         const dx = touch1.clientX - lastMousePos.current.x
         const dy = touch1.clientY - lastMousePos.current.y

         const attemptedX = positionRef.current.x + dx
         const attemptedY = positionRef.current.y + dy
         const newPos = clampPosition(attemptedX, attemptedY, scale)

         positionRef.current = newPos
         setPosition(newPos)
         lastMousePos.current = { x: touch1.clientX, y: touch1.clientY }

         if (isSyncing) broadcastView(newPos, scale)
         updateMenuPosition()
      }
   }
   const handleTouchEnd = () => {
      isPanning.current = false
      lastDist.current = 0
   }
   //#endregion

   //#region --------- GERENCIAMENTO DE DADOS E RENDERIZAÇÃO ---------
   const { mapElements, objectElements, tokenElements, wallElements, dmElements } = useMemo(() => {
      const els = activeScene.elements || []
      return {
         mapElements: els.filter(e => e.layer === 'map'),
         objectElements: els.filter(e => e.layer === 'object' || e.layer === 'prop'),
         tokenElements: els.filter(e => e.layer === 'token'),
         wallElements: els.filter(e => e.layer === 'wall'),
         dmElements: els.filter(e => e.layer === 'dm')
      }
   }, [activeScene.elements])

   useEffect(() => {
      const fetchMyChars = async () => {
         try {
            if (!activeScene?.campaign) return
            const { data } = await api.get(`/characters/my/${activeScene.campaign}`)
            setMyCharacters(data)
         }
         catch (err) {
            console.error(err)
         }
      }
      fetchMyChars()
   }, [activeScene?.campaign])

   const checkIsMyToken = (token) => {
      if (!user) return false
      if (token.type !== 'token') return true
      if (isMaster) return true

      const char = myCharacters.find(c => c._id === token.linkedCharacterId)
      if (char) return true

      return false
   }
   const handleDrop = async (e) => {
      e.preventDefault()
      const type = e.dataTransfer.getData('type')
      if (!isMaster) {
         if (type != 'token') return
      }

      if (!['token', 'asset'].includes(type)) return

      try {
         const stage = stageRef.current
         stage.setPointersPositions(e)
         const pointer = stage.getPointerPosition()
         if (!pointer) return

         let src, name, linkedCharacterId = null, elementType, layer
         let gridW = 1
         let gridH = 1

         if (type === 'token') {
            const charData = JSON.parse(e.dataTransfer.getData('character'))
            src = charData.imageUrl || 'https://placehold.co/70x70?text=?'
            name = charData.name
            linkedCharacterId = charData._id
            elementType = 'token'
            layer = 'token'
         }
         else if (type === 'asset') {
            const assetData = JSON.parse(e.dataTransfer.getData('asset'))
            src = assetData.url
            name = assetData.name
            elementType = 'object'
            layer = 'object'

            gridW = assetData.defaultGridWidth || 1
            gridH = assetData.defaultGridHeight || 1
         }


         const dropX = (pointer.x - stage.x()) / stage.scaleX()
         const dropY = (pointer.y - stage.y()) / stage.scaleY()
         const currentGridSize = activeScene.mapConfig?.gridSize

         const tempImg = new Image()
         tempImg.src = src

         tempImg.onload = async () => {
            let finalW, finalH

            if (type === 'token') {
               if (snapEnabled) {
                  finalW = gridW * currentGridSize
                  finalH = gridH * currentGridSize
               }
               else {
                  const ratio = tempImg.naturalHeight / tempImg.naturalWidth
                  finalW = gridW * currentGridSize
                  finalH = finalW * ratio
               }
            }
            else if (type === 'asset') {
               finalW = gridW * currentGridSize
               finalH = gridH * currentGridSize
            }

            let finalX, finalY

            if (snapEnabled) {
               const col = Math.floor(dropX / currentGridSize)
               const row = Math.floor(dropY / currentGridSize)

               finalX = (col * currentGridSize) + (currentGridSize / 2)
               finalY = (row * currentGridSize) + (currentGridSize / 2)
            }
            else {
               finalX = dropX
               finalY = dropY
            }

            const newElement = {
               type: elementType,
               layer: layer,
               x: finalX,
               y: finalY,
               width: finalW,
               height: finalH,
               src: src,
               linkedCharacterId: linkedCharacterId,
               name: name,
               rotation: 0
            }

            const { data: updatedScene } = await api.post(`/scenes/${activeScene._id}/elements`, newElement)
            onUpdateScene(updatedScene)
         }
      }
      catch (error) {
         console.error("Erro ao soltar token:", error)
      }
   }
   //#endregion

   //#region --------- SISTEMA DE SOMBRAS ---------
   const wallSegments = useMemo(() => {
      if (!isFogEnabled) return []

      let segments = []

      const w = mapWidth
      const h = mapHeight
      segments.push({ a: { x: 0, y: 0 }, b: { x: w, y: 0 } })
      segments.push({ a: { x: w, y: 0 }, b: { x: w, y: h } })
      segments.push({ a: { x: w, y: h }, b: { x: 0, y: h } })
      segments.push({ a: { x: 0, y: h }, b: { x: 0, y: 0 } })

      // B. Converte os elementos 'wall' do banco de dados em linhas
      wallElements.forEach(wall => {
         if (wall.visible === false) return

         if (wall.shapeType === 'poly' && wall.points) {
            for (let i = 0; i < wall.points.length; i += 2) {
               const startX = wall.points[i] + wall.x
               const startY = wall.points[i + 1] + wall.y

               const nextIndex = (i + 2) >= wall.points.length ? 0 : i + 2
               const endX = wall.points[i + 2] + wall.x
               const endY = wall.points[i + 3] + wall.y

               segments.push({
                  a: { x: startX, y: startY },
                  b: { x: endX, y: endY }
               })
            }
         }
      })

      return segments
   }, [wallElements, mapWidth, mapHeight, isFogEnabled])

   const calculateSightPolygon = (originX, originY) => {
      if (!isFogEnabled) return []

      let uniquePoints = []
      wallSegments.forEach(seg => {
         uniquePoints.push(seg.a, seg.b)
      })

      // 2. Lança raios para cada ponto (+ offsets angulares)
      let intersects = []

      uniquePoints.forEach(pt => {
         const angle = Math.atan2(pt.y - originY, pt.x - originX)
         const angles = [angle - 0.0001, angle, angle + 0.0001]

         angles.forEach(a => {
            const dx = Math.cos(a)
            const dy = Math.sin(a)

            const ray = { x: originX, y: originY, angle: a, dx, dy }

            // Encontra a parede mais próxima que esse raio bate
            let closestParams = null

            wallSegments.forEach(segment => {
               const intersection = getRayIntersection(ray, segment)
               if (!intersection) return

               if (!closestParams || intersection.param < closestParams.param) {
                  closestParams = intersection
               }
            })

            if (closestParams) {
               closestParams.angle = a
               intersects.push(closestParams)
            }
         })
      })

      intersects.sort((a, b) => a.angle - b.angle)

      return intersects.flatMap(p => [p.x, p.y])
   }
   useEffect(() => {
      if (!isFogEnabled) {
         setFogShapes([])
         return
      }

      const newShapes = tokenElements.map(token => {
         if (token.visible === false) return null
         if (!checkIsMyToken(token)) return null

         const points = calculateSightPolygon(token.x, token.y)
         return (
            <Line
               key={`vision-${token.id}`}
               points={points}
               closed={true}
               fill="white"
               listening={false}
            />
         )
      })

      setFogShapes(newShapes)
   }, [tokenElements, isFogEnabled, wallSegments, myCharacters, user])
   //#endregion

   //#region --------- SISTEMA DE RENDERER ---------
   const handleElementSelect = useCallback((id) => {
      if (['select', 'gallery'].includes(activeTool) && isMaster) {
         setSelectedIds(prev => {
            if (prev.length === 1 && prev[0] === id) return prev
            return [id]
         })
      }
      else {
         setSelectedIds(prev => {
            if (prev.length === 1 && prev[0] === id) return prev
            return [id]
         })
      }
   }, [activeTool, isMaster])

   const handleDragStart = useCallback((e) => {
      e.target.moveToTop()

      const stage = e.target.getStage()
      const walls = stage.find('.collisor')
      wallCache.current = []
      walls.forEach(group => {
         if (!group.isVisible()) return

         const elementData = activeScene.elements.find(el => el.id === group.id())
         if (elementData && elementData.visible === false) return

         group.getChildren().forEach(segment => {
            wallCache.current.push(getCorners(segment))
         })
      })

      if (hudContainerRef.current) {
         hudContainerRef.current.style.opacity = '0'
         hudContainerRef.current.style.pointerEvents = 'none'
      }
      const id = e.target.attrs.id
      if (!selectedIds.includes(id)) {
         handleElementSelect(id)
      }

      const element = activeScene.elements.find(x => x.id === e.target.attrs.id)
      if (activeTool === 'ruler' && element) {
         setRuler({ start: { x: element.x, y: element.y }, end: { x: element.x, y: element.y } })
      }
   }, [activeTool, activeScene.elements])

   const handleDragMove = useCallback((e) => {
      if (activeTool === 'ruler') {
         setRuler(prev => ({ ...prev, end: { x: e.target.x(), y: e.target.y() } }))
      }
   }, [activeTool])

   const handleDragEnd = useCallback(async (e, element) => {
      setRuler(null)
      const dropX = e.target.x()
      const dropY = e.target.y()
      let newX = dropX
      let newY = dropY

      if (snapEnabled) {
         const col = Math.floor(newX / gridSize)
         const row = Math.floor(newY / gridSize)
         newX = (col * gridSize) + (gridSize / 2)
         newY = (row * gridSize) + (gridSize / 2)
      }

      if (hudContainerRef.current) {
         hudContainerRef.current.style.opacity = '1'
         hudContainerRef.current.style.pointerEvents = 'auto'
         updateMenuPosition()
      }

      try {
         const { data: updatedScene } = await api.put(
            `/scenes/${activeScene._id}/elements/${element.id}`,
            { x: newX, y: newY, rotation: e.target.rotation() }
         )
         onUpdateScene(updatedScene)

         if (socket && !isMaster) {
            socket.emit('gm_change_scene', {
               campaignId: activeScene.campaign,
               scene: updatedScene
            })
         }
      }
      catch (error) {
         console.error("Erro ao mover:", error)
         e.target.to({ x: element.x, y: element.y, duration: 0.2 })
      }
   }, [snapEnabled, gridSize, activeScene._id, onUpdateScene])
   //#endregion

   return (
      <div
         onDragOver={(e) => e.preventDefault()}
         onDrop={handleDrop}
         onContextMenu={(e) => e.preventDefault()}
         className="absolute inset-0 bg-black overflow-hidden"
         style={{ cursor: getCursorStyle() }}
      >

         {/* MAPA */}
         <Stage
            width={window.innerWidth}
            height={window.innerHeight}
            ref={stageRef}
            scaleX={scale}
            scaleY={scale}
            x={position.x}
            y={position.y}

            onWheel={handleWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}

            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
         >
            {/* CAMADA DO MAPA  */}
            <Layer>
               <Rect
                  x={0} y={0}
                  width={mapWidth}
                  height={mapHeight}
                  fill="#d4d4d8"
                  listening={false}
               />

               {/* CAMADA 1: MAPA / CHÃO */}
               <Group>
                  <ElementsGroup
                     elements={mapElements}
                     layerName="map"
                     isMaster={isMaster}
                     activeLayer={activeLayer}
                     activeTool={activeTool}
                     selectedIds={selectedIds}
                     onSelectElement={handleElementSelect}
                     onDragStart={handleDragStart}
                     onDragMove={handleDragMove}
                     onDragEnd={handleDragEnd}
                     checkCollide={checkCollide}
                     gridSize={gridSize}
                     myCharacters={myCharacters}
                     user={user}
                  />
               </Group>

               {/* CAMADA 2: GRID */}
               <Group listening={false}>
                  <GridRenderer
                     width={mapWidth}
                     height={mapHeight}
                     gridSize={gridSize}
                     gridColor={gridColor}
                     gridOpacity={gridOpacity}
                  />
               </Group>

               {/* CAMADA 3: PROPS/OBJETOS */}
               <Group>
                  <ElementsGroup
                     elements={objectElements}
                     layerName="object"
                     // ... passar as mesmas props de cima ...
                     isMaster={isMaster} activeLayer={activeLayer} activeTool={activeTool}
                     selectedIds={selectedIds} onSelectElement={handleElementSelect}
                     onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}
                     checkCollide={checkCollide} gridSize={gridSize} myCharacters={myCharacters} user={user}
                  />
               </Group>

               {/* CAMADA 4: TOKENS */}
               <Group>
                  <ElementsGroup
                     elements={tokenElements}
                     layerName="token"
                     // ... passar as mesmas props ...
                     isMaster={isMaster} activeLayer={activeLayer} activeTool={activeTool}
                     selectedIds={selectedIds} onSelectElement={handleElementSelect}
                     onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}
                     checkCollide={checkCollide} gridSize={gridSize} myCharacters={myCharacters} user={user}
                  />
               </Group>

               {/* CAMADA 5: PAREDES (Oclusão visual sobre tokens) */}
               <Group>
                  <ElementsGroup
                     elements={wallElements}
                     layerName="wall"
                     // ... passar as mesmas props ...
                     isMaster={isMaster} activeLayer={activeLayer} activeTool={activeTool}
                     selectedIds={selectedIds} onSelectElement={handleElementSelect}
                     onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}
                     checkCollide={checkCollide} gridSize={gridSize} myCharacters={myCharacters} user={user}
                  />
               </Group>

               {/* CAMADA 6: DM */}
               {isMaster && (
                  <Group opacity={0.7}>
                     <ElementsGroup
                        elements={dmElements}
                        layerName="dm"
                        // ... props ...
                        isMaster={isMaster} activeLayer={activeLayer} activeTool={activeTool}
                        selectedIds={selectedIds} onSelectElement={handleElementSelect}
                        onDragStart={handleDragStart} onDragMove={handleDragMove} onDragEnd={handleDragEnd}
                        checkCollide={checkCollide} gridSize={gridSize} myCharacters={myCharacters} user={user}
                     />
                  </Group>
               )}

               <Transformer
                  ref={transformerRef}
                  // ... suas props do transformer (boundBoxFunc, keepRatio dinâmico, etc) ...
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
                  keepRatio={(() => {
                     const selected = activeScene.elements.find(element => element.id === selectedIds[0])
                     return selected ? selected.layer === 'token' : true
                  })()}
                  resizeEnabled={isMaster}
                  // ... seu onTransformEnd ...
                  onTransformEnd={async () => {
                     // ... Copie o conteúdo exato do seu onTransformEnd anterior ...
                     const node = transformerRef.current.nodes()[0]
                     if (!node) return
                     const scaleX = node.scaleX(); const scaleY = node.scaleY()
                     node.scaleX(1); node.scaleY(1)
                     const newWidth = Math.max(5, node.width() * scaleX)
                     const newHeight = Math.max(5, node.height() * scaleY)
                     node.width(newWidth); node.height(newHeight)
                     node.offsetX(newWidth / 2); node.offsetY(newHeight / 2)
                     updateMenuPosition()
                     try {
                        const { data: updatedScene } = await api.put(`/scenes/${activeScene._id}/elements/${node.id()}`, {
                           width: newWidth, height: newHeight, rotation: node.rotation(), x: node.x(), y: node.y()
                        })
                        onUpdateScene(updatedScene)
                     } catch (err) { console.error("Erro resize:", err) }
                  }}
                  padding={1}
               />
            </Layer>

            {/* CAMADA DE NÉVOA DE GUERRA */}
            {isFogEnabled && (
               <Layer listening={false}>
                  <FogRenderer
                     width={mapWidth}
                     height={mapHeight}
                     isMaster={isMaster}
                     fogShapes={fogShapes}
                  />
               </Layer>
            )}

            {/* CAMADA DE FERRAMENTAS (Régua, Draw Preview, etc) */}
            <Layer listening={false}>
               {ruler && (
                  <RulerOverlay
                     start={ruler.start}
                     end={ruler.end}
                     gridSize={gridSize}
                  />
               )}
            </Layer>

            <Layer listening={false}>
               {objectDrawing.active && (() => {
                  const config = DRAWING_CONFIG[objectDrawing.type]
                  if (!config) return null

                  const commonProps = {
                     strokePatternImage: config.hasStroke ? drawingPattern : null,
                     fillPatternImage: config.hasFill ? drawingPattern : null,
                     fillPatternScale: previewPatternScale,
                     strokePatternScale: previewPatternScale,
                     strokeWidth: config.forceStrokeWidth ? (objectDrawing.strokeWidth || 20) : 2,
                     stroke: config.forceStrokeWidth ? null : "#4f46e5",
                     opacity: 0.7
                  }

                  return (
                     <Group>
                        {/* RETÂNGULO */}
                        {objectDrawing.shape === 'rect' && drawStart && currentMousePos && (
                           <Rect
                              x={Math.min(drawStart.x, currentMousePos.x)}
                              y={Math.min(drawStart.y, currentMousePos.y)}
                              width={Math.abs(currentMousePos.x - drawStart.x)}
                              height={Math.abs(currentMousePos.y - drawStart.y)}
                              dash={[5, 5]}
                              {...commonProps}
                           />
                        )}

                        {/* POLÍGONO / LINHA */}
                        {objectDrawing.shape === 'poly' && drawPoints.length > 0 && (
                           <>
                              <Line
                                 points={drawPoints.flatMap(p => [p.x, p.y]).concat(currentMousePos ? [currentMousePos.x, currentMousePos.y] : [])}
                                 closed={config.autoClose} // A config decide se fecha ou não!
                                 lineCap="round"
                                 lineJoin="round"
                                 dash={config.hasStroke ? [] : [5, 5]}
                                 {...commonProps}
                              />
                              {/* Pontos de controle */}
                              {drawPoints.map((p, i) => (
                                 <Rect key={i} x={p.x - 3} y={p.y - 3} width={6} height={6}
                                    fill={config.autoClose ? "white" : "red"} stroke="black" strokeWidth={1}
                                 />
                              ))}
                           </>
                        )}
                     </Group>
                  )
               })()}

               {/* PREVIEW CHÃO */}
               {objectDrawing.active && objectDrawing.type === 'floor' && (
                  <Group>
                     {/* Chão Retangular */}
                     {objectDrawing.shape === 'rect' && drawStart && currentMousePos && (
                        <Rect
                           x={Math.min(drawStart.x, currentMousePos.x)}
                           y={Math.min(drawStart.y, currentMousePos.y)}
                           width={Math.abs(currentMousePos.x - drawStart.x)}
                           height={Math.abs(currentMousePos.y - drawStart.y)}

                           // Visual de Chão
                           fillPatternImage={drawingPattern}
                           fillPatternScale={previewPatternScale}
                           stroke="#4f46e5"
                           strokeWidth={1}
                           dash={[5, 5]} // Tracejado para indicar área

                           opacity={0.6}
                        />
                     )}

                     {/* Chão Poligonal */}
                     {objectDrawing.shape === 'poly' && drawPoints.length > 0 && (
                        <>
                           <Line
                              points={drawPoints.flatMap(p => [p.x, p.y]).concat(currentMousePos ? [currentMousePos.x, currentMousePos.y] : [])}

                              // Visual de Chão
                              fillPatternImage={drawingPattern}
                              fillPatternScale={previewPatternScale}
                              stroke="#4f46e5"
                              strokeWidth={1}
                              dash={[5, 5]}
                              closed={true} // Chão fecha o ciclo para preencher

                              opacity={0.6}
                           />
                           {/* Pontos de controle (Bolinhas brancas) */}
                           {drawPoints.map((p, i) => (
                              <Rect key={i} x={p.x - 3} y={p.y - 3} width={6} height={6} fill="white" stroke="black" strokeWidth={1} />
                           ))}
                        </>
                     )}
                  </Group>
               )}

               {/* PREVIEW PAREDE */}
               {objectDrawing.active && objectDrawing.type === 'wall' && (
                  <Group>
                     {/* Parede Retangular (4 muros) */}
                     {objectDrawing.shape === 'rect' && drawStart && currentMousePos && (
                        <Rect
                           x={Math.min(drawStart.x, currentMousePos.x)}
                           y={Math.min(drawStart.y, currentMousePos.y)}
                           width={Math.abs(currentMousePos.x - drawStart.x)}
                           height={Math.abs(currentMousePos.y - drawStart.y)}

                           // Visual de Parede
                           strokePatternImage={drawingPattern}
                           strokePatternScale={previewPatternScale}
                           strokeWidth={objectDrawing.strokeWidth || 20}
                           fillEnabled={false} // Parede não tem preenchimento

                           opacity={0.7}
                        />
                     )}

                     {/* Parede Poligonal (Linha sequencial) */}
                     {objectDrawing.shape === 'poly' && drawPoints.length > 0 && (
                        <>
                           <Line
                              points={drawPoints.flatMap(p => [p.x, p.y]).concat(currentMousePos ? [currentMousePos.x, currentMousePos.y] : [])}

                              // Visual de Parede
                              strokePatternImage={drawingPattern}
                              strokePatternScale={previewPatternScale}
                              strokeWidth={objectDrawing.strokeWidth || 20}

                              lineCap="round"
                              lineJoin="round"
                              closed={false} // Parede nunca fecha sozinha
                              opacity={0.7}
                           />
                           {/* Pontos de controle (Bolinhas vermelhas) */}
                           {drawPoints.map((p, i) => (
                              <Rect key={i} x={p.x - 4} y={p.y - 4} width={8} height={8} fill="red" />
                           ))}
                        </>
                     )}
                  </Group>
               )}
            </Layer>
         </Stage>

         {/* HUD */}
         <div
            ref={hudContainerRef}
            style={{
               position: 'absolute',
               top: 0,
               left: 0,
               display: 'none',
               opacity: 1,
               pointerEvents: 'auto',
               transition: 'opacity 0.2s ease-in-out',
               zIndex: 50
            }}
         >
            {selectedIds.length === 1 && (

               <ElementHUD
                  element={activeScene.elements.find(element => element.id === selectedIds[0])}
                  position={{ x: 0, y: 0 }}
                  isMaster={isMaster}
                  onDelete={handleDeleteSelected}
                  onToggleVisibility={handleToggleVisibility}
                  socket={socket}
               />
            )}
            {selectedIds.length > 1 && (
               <div
                  className="absolute z-50 pointer-events-auto animate-fade-in"
                  style={{ left: menuPos.x, top: menuPos.y }}
               >
                  <button
                     onClick={handleDeleteSelected}
                     className="w-10 h-10 bg-white text-black rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform active:scale-95 border border-gray-300"
                     title="Deletar Seleção"
                  >
                     <FaTrash size={14} />
                  </button>
               </div>
            )}
         </div>
         <div
            className={`absolute bottom-4 right-4 flex gap-2 transition-all
               ${isSidebarOpen ? 'right-97' : 'right-15'}`}
         >
            <div className="bg-black/70 text-white px-3 py-1 rounded text-xs">
               Zoom: {Math.round(scale * 100)}%
            </div>
         </div>
         {isViewLocked && !isMaster && (
            <div className="absolute bg-red-900/5 bottom-5 left-1/2 -translate-x-1/2 text-white/10 px-4 py-2 text-xs font-bold uppercase border border-red-500/10 rounded-full shadow-lg z-40 
                  pointer-events-none animate-pulse">
               <FaVideo className="inline mr-2" /> Câmera Travada
            </div>
         )}

         {showDebug && (
            <DebugMonitor
               data={debugData}
               onClose={() => setShowDebug(false)}
            />
         )}
      </div >
   )
}

export default MapStage