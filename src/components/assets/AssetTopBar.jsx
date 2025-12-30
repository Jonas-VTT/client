import { useState, useEffect } from 'react'
import api from '../../config/api'
import {
   FaFolder, FaArrowLeft, FaExternalLinkAlt, FaVideo,
   FaMap, FaCube, FaLayerGroup, FaTh, FaUserCircle, FaBolt,
   FaPaintBrush, FaSquare, FaDrawPolygon, FaTimes, FaMagnet, FaArrowsAltH
} from 'react-icons/fa'

const ASSET_TYPES = {
   map: { icon: <FaMap /> },
   prop: { icon: <FaCube /> },
   wall: { icon: <FaLayerGroup /> },
   floor: { icon: <FaTh /> },
   token: { icon: <FaUserCircle /> },
   fx: { icon: <FaBolt /> },
}

const AssetTopBar = ({ campaignId, onOpenFullGallery, objectDrawing, setObjectDrawing, assetVersion }) => {
   const [folders, setFolders] = useState([])
   const [assets, setAssets] = useState([])
   const [currentFolder, setCurrentFolder] = useState(null)
   const [loading, setLoading] = useState(true)

   useEffect(() => {
      fetchData()
   }, [campaignId, assetVersion])

   const fetchData = async () => {
      try {
         const [resFolders, resAssets] = await Promise.all([
            api.get(`/assets/folders/${campaignId}`),
            api.get(`/assets/${campaignId}`)
         ])
         setFolders(resFolders.data)
         setAssets(resAssets.data)
         setLoading(false)
      } catch (err) { console.error(err) }
   }

   const getAssetUrl = (url) => {
      if (!url) return ''
      if (url.startsWith('blob:') || url.startsWith('http')) return url
      if (import.meta.env.DEV) return `http://localhost:3000${url}`
      return url
   }

   const handleMoveAsset = async (assetId, targetFolderId) => {
      try {
         await api.put(`/assets/${assetId}`, { folderId: targetFolderId })
         setAssets(prev => prev.map(a =>
            a._id === assetId ? { ...a, folder: targetFolderId } : a
         ))
      } catch (err) { console.error(err) }
   }

   // ---------------------------
   
   // BARRA DE DESENHO
   if (objectDrawing?.active) {
      return (
         <div className="absolute top-20 left-1/2 -translate-x-1/2 w-auto bg-[#18181b]/90 
            backdrop-blur-md border-2 border-white/10 rounded-full py-2 px-4 z-30 shadow-2xl
            animate-slide-down flex items-center gap-6 hover:border-white/30"
         >
            {/* Preview da Textura Selecionada */}
            <div className="flex items-center gap-3 border-r border-white/10 pr-6">
               <div className="w-10 h-10 rounded border border-gray-500 overflow-hidden relative">
                  <img
                     src={getAssetUrl(objectDrawing.texture)}
                     className="w-full h-full object-cover"
                     alt="Textura"
                  />
                  <div className="absolute inset-0 ring-inset ring-2 ring-indigo-500"></div>
               </div>
            </div>

            {/* Ferramentas de Forma */}
            <div className="flex gap-2">
               {objectDrawing.type == 'floor' && (
                  <button
                     onClick={() => setObjectDrawing(prev => ({ ...prev, shape: 'rect' }))}
                     className={`flex flex-col items-center justify-center w-8 h-8 rounded border transition-all
                        ${objectDrawing.shape === 'rect'
                           ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-110'
                           : 'bg-black/40 border-gray-700 text-gray-400 hover:text-white hover:bg-white/10'
                        }`}
                     title="Retângulo"
                  >
                     <FaSquare size={18} />
                  </button>
               )}

               <button
                  onClick={() => setObjectDrawing(prev => ({ ...prev, shape: 'poly' }))}
                  className={`flex flex-col items-center justify-center w-8 h-8 rounded border transition-all
                     ${objectDrawing.shape === 'poly'
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg scale-110'
                        : 'bg-black/40 border-gray-700 text-gray-400 hover:text-white hover:bg-white/10'
                     }`}
                  title="Polígono (Personalizado)"
               >
                  <FaDrawPolygon size={18} />
               </button>
            </div>

            {objectDrawing.type == 'wall' && (
               <div className="flex items-center gap-2 border-l border-white/10 pl-4 h-full">
                  <div className="text-gray-500 text-[10px] uppercase font-bold flex flex-col items-center">
                     <FaArrowsAltH size={12} className="mb-1" />
                     <span>{objectDrawing.strokeWidth}px</span>
                  </div>
                  <input
                     type="range"
                     min="5"
                     max="100"
                     step="5"
                     value={objectDrawing.strokeWidth}
                     onChange={(e) => setObjectDrawing(prev => ({ ...prev, strokeWidth: Number(e.target.value) }))}
                     className="w-24 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-indigo-500"
                     title="Espessura da Parede"
                  />
               </div>
            )}
            
            {/* Snap */}
            <div className="flex items-center">
               <button
                  onClick={() => setObjectDrawing(prev => ({ ...prev, snap: !prev.snap }))}
                  className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all
                     ${objectDrawing.snap 
                        ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]' 
                        : 'bg-black/40 border-gray-600 text-gray-500 hover:text-white'
                     }`}
                  title={objectDrawing.snap ? "Snap Ligado" : "Snap Desligado"}
               >
                  <FaMagnet size={18} />
               </button>
            </div>

            {/* Botão Sair / Voltar */}
            <div className="border-l border-white/10 pl-6">
               <button
                  onClick={() => setObjectDrawing({ active: false, type:null, texture: null, shape: 'poly' })}
                  className="w-10 h-10 bg-gray-900/50 hover:bg-gray-600 border border-gray-700 rounded-full flex items-center justify-center text-white transition-all shadow-lg hover:rotate-90"
                  title="Cancelar / Voltar"
               >
                  <FaTimes />
               </button>
            </div>
         </div>
      )
   }

   // ---------------------------

   const visibleFolders = folders.filter(f => f.parent === currentFolder)
   const visibleAssets = assets.filter(a => a.folder === currentFolder)
   const currentFolderObj = folders.find(f => f._id === currentFolder)

   return (
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[90vw] max-w-4xl bg-[#18181b]/80 
         backdrop-blur-md border border-white/10 rounded-xl shadow-2xl py-3 px-4 z-30 
         animate-slide-down flex items-center gap-4 transition-all"
      >

         {/* BOTÃO VOLTAR / NOME DA PASTA */}
         <div
            onDragOver={(e) => currentFolder && e.preventDefault()}
            onDrop={(e) => {
               if (!currentFolder) return
               e.preventDefault()
               const assetId = e.dataTransfer.getData('assetId')
               if (assetId) handleMoveAsset(assetId, currentFolderObj?.parent || null)
            }}
            className="flex items-center gap-2 border-r border-white/10 pr-4 min-w-[120px]"
         >
            {currentFolder ? (
               <button
                  onClick={() => setCurrentFolder(currentFolderObj?.parent || null)}
                  className="w-10 h-10 bg-gray-700/50 hover:bg-gray-600 rounded-full flex items-center justify-center text-white transition-colors"
                  title="Voltar"
               >
                  <FaArrowLeft />
               </button>
            ) : (
               <div className="w-10 h-10 flex items-center justify-center text-gray-500">
                  <FaFolder />
               </div>
            )}
            <div className="flex flex-col justify-center overflow-hidden">
               <span className="text-[10px] uppercase font-bold text-gray-500">Pasta</span>
               <span className="text-xs font-bold text-white truncate max-w-[80px]">
                  {currentFolder ? currentFolderObj.name : 'Raiz'}
               </span>
            </div>
         </div>

         {/* ÁREA DE SCROLL HORIZONTAL (ASSETS) */}
         <div className="flex-1 flex gap-2 overflow-x-auto pb-1 custom-scrollbar min-h-[60px] items-center">

            {loading && <span className="text-xs text-gray-500">Carregando...</span>}

            {!loading && visibleFolders.length === 0 && visibleAssets.length === 0 && (
               <span className="text-xs text-gray-600 italic px-4">Pasta vazia</span>
            )}

            {/* Renderiza Pastas */}
            {visibleFolders.map(folder => (
               <button
                  key={folder._id}
                  onClick={() => setCurrentFolder(folder._id)}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                     e.preventDefault()
                     const assetId = e.dataTransfer.getData('assetId')
                     if (assetId) handleMoveAsset(assetId, folder._id)
                  }}
                  className="flex flex-col items-center justify-center min-w-[60px] h-[60px] bg-black/40 hover:bg-white/10 rounded border border-white/5 transition-colors gap-1"
               >
                  <FaFolder className="text-yellow-600 text-xl" />
                  <span className="text-[9px] text-gray-300 truncate w-full px-1 text-center">{folder.name}</span>
               </button>
            ))}

            {/* Renderiza Assets (Draggable) */}
            {visibleAssets.map(asset => (
               <div
                  key={asset._id}
                  draggable={true}
                  onDragStart={(e) => {
                     e.dataTransfer.setData('type', 'asset')
                     e.dataTransfer.setData('asset', JSON.stringify({
                        ...asset,
                        url: getAssetUrl(asset.url)
                     }))
                     e.dataTransfer.setData('assetId', asset._id)
                  }}
                  className="group relative min-w-[60px] h-[60px] bg-black rounded overflow-hidden border border-gray-700 hover:border-indigo-500 cursor-grab active:cursor-grabbing transition-all"
                  title={asset.name}
               >
                  {asset.type === 'video' ? (
                     <video src={getAssetUrl(asset.url)} className="w-full h-full object-cover opacity-70 group-hover:opacity-100" />
                  ) : (
                     <img src={getAssetUrl(asset.url)} className="w-full h-full object-cover opacity-70 group-hover:opacity-100" draggable={false} />
                  )}

                  {/* Ícone do Tipo */}
                  <div className="absolute top-0.5 left-0.5 bg-black/60 text-white p-0.5 rounded text-[8px]">
                     {ASSET_TYPES[asset.type]?.icon}
                  </div>

                  {(asset.type === 'floor' || asset.type === 'wall') && (
                     <div className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button
                           onClick={(e) => {
                              e.stopPropagation()
                              let drawingShape = ''
                              if (asset.type == 'wall') {
                                 drawingShape = 'poly'
                              }
                              else if (asset.type == 'floor') {
                                 drawingShape = 'rect'
                              }
                              setObjectDrawing({
                                 active: true,
                                 type: asset.type,
                                 texture: getAssetUrl(asset.url),
                                 shape: drawingShape,
                                 tilesX: asset.defaultGridWidth || 1,
                                 tilesY: asset.defaultGridHeight || 1,
                                 snap: true,
                                 strokeWidth: 20 
                              })
                           }}
                           className="w-8 h-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full flex items-center justify-center shadow-lg transform hover:scale-110 transition-all cursor-pointer"
                           title="Pintar Chão com esta Textura"
                        >
                           <FaPaintBrush size={12} />
                        </button>
                     </div>
                  )}
               </div>
            ))}
         </div>

         {/* BOTÃO EXPANDIR (ABRIR GALERIA COMPLETA) */}
         <div className="border-l border-white/10 pl-4">
            <button
               onClick={onOpenFullGallery}
               className="flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-white transition-colors"
               title="Abrir Gerenciador Completo"
            >
               <div className="w-8 h-8 bg-indigo-600/20 hover:bg-indigo-600 rounded flex items-center justify-center transition-colors">
                  <FaExternalLinkAlt size={12} />
               </div>
               <span className="text-[8px] font-bold uppercase">Expandir</span>
            </button>
         </div>

      </div>
   )
}

export default AssetTopBar