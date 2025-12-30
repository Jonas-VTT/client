import { useState, useEffect, useRef } from 'react'
import api from '../../config/api'
import {
   FaFolder, FaFolderOpen, FaFolderPlus, FaTrash, FaMap, FaCube, FaTh, FaUserCircle, FaBolt,
   FaArrowLeft, FaCloudUploadAlt, FaPen, FaTimes, FaLayerGroup, FaCheckSquare, FaSquare, FaDungeon
} from 'react-icons/fa'

const ASSET_TYPES = {
   map: { label: 'Mapa', icon: <FaMap /> },
   prop: { label: 'Prop/Objeto', icon: <FaCube /> },
   wall: { label: 'Parede', icon: <FaLayerGroup /> },
   floor: { label: 'Piso', icon: <FaTh /> },
   token: { label: 'Personagem', icon: <FaUserCircle /> },
   fx: { label: 'Efeito', icon: <FaBolt /> },
   structure: { label: 'Estrutura', icon: <FaDungeon /> }
}

const AssetBrowser = ({ campaignId, onClose, onAssetUpdate }) => {
   const fileInputRef = useRef(null)

   const [folders, setFolders] = useState([])
   const [assets, setAssets] = useState([])
   const [currentFolder, setCurrentFolder] = useState(null)
   const [loading, setLoading] = useState(true)
   const [activeFilters, setActiveFilters] = useState(Object.keys(ASSET_TYPES))
   const [formMode, setFormMode] = useState(null)
   const [formData, setFormData] = useState({
      id: null, name: '', type: 'prop', file: null, preview: '',
      defaultGridWidth: 1, defaultGridHeight: 1, isTiled: false
   })

   useEffect(() => {
      fetchData()
   }, [campaignId])

   const fetchData = async () => {
      setLoading(true)
      try {
         const [resFolders, resAssets] = await Promise.all([
            api.get(`/assets/folders/${campaignId}`),
            api.get(`/assets/${campaignId}`)
         ])
         setFolders(resFolders.data)
         setAssets(resAssets.data)
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
   }

   const getAssetUrl = (url) => {
      if (!url) return ''

      if (url.startsWith('blob:') || url.startsWith('http')) return url

      if (import.meta.env.DEV) {
         return `http://localhost:3000${url}`
      }

      return url
   }

   const handleFileSelect = (e) => {
      const file = e.target.files[0]
      if (file) {
         setFormData(prev => ({
            ...prev,
            file: file,
            preview: URL.createObjectURL(file),
            name: prev.name || file.name.split('.')[0]
         }))
      }
   }
   const handleCreateFolder = async () => {
      const name = prompt("Nome da nova pasta:")
      if (!name) return
      try {
         const { data } = await api.post('/assets/folders', {
            name,
            campaign: campaignId,
            parent: currentFolder
         })
         setFolders([...folders, data])
      } catch (err) { alert("Erro ao criar pasta") }
   }
   const handleDeleteAsset = async (id) => {
      if (!confirm("Deletar este arquivo?")) return
      try {
         await api.delete(`/assets/${id}`)
         setAssets(prev => prev.filter(a => a._id !== id))
         if (onAssetUpdate) onAssetUpdate()
      }
      catch (err) { alert("Erro ao deletar") }
   }
   const handleDeleteFolder = async (id) => {
      if (!confirm("Deletar pasta? O conteúdo irá para a raiz.")) return
      try {
         await api.delete(`/assets/folders/${id}`)
         setFolders(prev => prev.filter(f => f._id !== id))
         fetchData()
         if (onAssetUpdate) onAssetUpdate()
      }
      catch (err) {
         alert("Erro ao deletar pasta")
      }
   }
   const handleEditStart = (asset) => {
      setFormMode('edit')
      setFormData({
         id: asset._id,
         name: asset.name,
         type: asset.type,
         file: null,
         preview: getAssetUrl(asset.url),
         defaultGridWidth: asset.defaultGridWidth || 1,
         defaultGridHeight: asset.defaultGridHeight || 1,
         isTiled: asset.isTiled || false
      })
   }
   const handleSubmit = async () => {
      if (!formData.name) return alert("Digite um nome!")
      if (formMode === 'create' && !formData.file) return alert("Selecione um arquivo!")

      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('type', formData.type)
      payload.append('campaignId', campaignId)
      payload.append('defaultGridWidth', formData.defaultGridWidth)
      payload.append('defaultGridHeight', formData.defaultGridHeight)
      payload.append('isTiled', formData.isTiled)
      if (currentFolder) payload.append('folderId', currentFolder)
      if (formData.file) payload.append('file', formData.file)

      try {
         if (formMode === 'create') {
            const { data } = await api.post('/assets', payload)
            setAssets([data, ...assets])
         }
         else {
            const { data } = await api.put(`/assets/${formData.id}`, payload)
            setAssets(prev => prev.map(a => a._id === data._id ? data : a))
         }
         if (onAssetUpdate) onAssetUpdate()
         setFormMode(null)
         setFormData({
            id: null, name: '', type: 'prop', file: null, preview: '',
            defaultGridWidth: 1, defaultGridHeight: 1, isTiled: false
         })
      }
      catch (err) {
         alert("Erro ao salvar")
      }
   }
   const handleMoveAsset = async (assetId, targetFolderId) => {
      try {
         await api.put(`/assets/${assetId}`, { folderId: targetFolderId })

         setAssets(prev => prev.map(a =>
            a._id === assetId ? { ...a, folder: targetFolderId } : a
         ))
         if (onAssetUpdate) onAssetUpdate()
      }
      catch (err) {
         console.error("Erro ao mover asset:", err)
      }
   }

   const toggleFilter = (key) => {
      setActiveFilters(prev =>
         prev.includes(key)
            ? prev.filter(k => k !== key)
            : [...prev, key]
      )
   }
   const selectAllFilters = () => setActiveFilters(Object.keys(ASSET_TYPES))
   const deselectAllFilters = () => setActiveFilters([])
   const visibleFolders = folders.filter(f => f.parent === currentFolder)
   const visibleAssets = assets.filter(a => {
      const inFolder = a.folder === currentFolder
      const matchesFilter = activeFilters.includes(a.type)
      return inFolder && matchesFilter
   })
   const currentFolderObj = folders.find(f => f._id === currentFolder)

   return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
         <div className="bg-[#121214] w-full max-w-6xl h-[85vh] rounded-lg border border-gray-700 flex shadow-2xl overflow-hidden font-sans select-none">

            {/* SIDEBAR DE FILTROS */}
            <div className="w-48 bg-[#09090a] border-r border-gray-800 p-4 flex flex-col gap-2">
               <div className="flex justify-between items-end mb-2 border-b border-gray-800 pb-2">
                  <h3 className="text-gray-500 text-xs font-bold uppercase">Filtrar por</h3>

                  {/* Botões de Controle Rápido */}
                  <div className="flex gap-2">
                     <button
                        onClick={selectAllFilters}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 font-bold uppercase cursor-pointer"
                        title="Selecionar Todos"
                     >
                        Todos
                     </button>

                     <button
                        onClick={deselectAllFilters}
                        className="text-[10px] text-gray-500 hover:text-red-400 font-bold uppercase cursor-pointer"
                        title="Limpar Seleção"
                     >
                        Nada
                     </button>
                  </div>
               </div>

               {Object.entries(ASSET_TYPES).map(([key, info]) => {
                  const isActive = activeFilters.includes(key)

                  return (
                     <button
                        key={key}
                        onClick={() => toggleFilter(key)}
                        className={`flex items-center justify-between px-3 py-2 rounded text-xs font-bold uppercase transition-all border border-transparent
                           ${isActive
                              ? 'bg-indigo-600 text-white shadow-lg'
                              : 'text-gray-500 hover:bg-white/5 hover:border-gray-700'
                           }
                        `}
                     >
                        <div className="flex items-center gap-3">
                           {info.icon}
                           {info.label.split('/')[0]} {/* Pega só a primeira parte do nome para caber */}
                        </div>

                        {/* Indicador de Checkbox (Visual) */}
                        <div className={`w-2 h-2 rounded-full ${isActive ? 'bg-white' : 'bg-gray-700'}`} />
                     </button>
                  )
               })}
            </div>

            {/* ÁREA PRINCIPAL */}
            <div className="flex-1 flex flex-col bg-[#121214]">

               {/* HEADER */}
               <div className="h-14 border-b border-gray-800 flex items-center justify-between px-4 bg-white/5">
                  <div className="flex items-center gap-3">
                     {currentFolder && (
                        <button onClick={() => setCurrentFolder(currentFolderObj?.parent || null)} className="text-gray-400 hover:text-white"><FaArrowLeft /></button>
                     )}
                     <h2 className="text-white font-bold flex items-center gap-2">
                        {currentFolder ? <><FaFolderOpen className="text-yellow-600" /> {currentFolderObj.name}</> : "Galeria de Artes"}
                     </h2>
                  </div>
                  <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-red-500/20 p-2 rounded"><FaTimes /></button>
               </div>

               {/* CONTEÚDO SCROLLÁVEL */}
               <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">

                  {/* --- FORMULÁRIO / ARQUIVOS --- */}
                  {formMode ? (
                     <div className="bg-black/40 border border-gray-700 rounded-lg p-6 max-w-4xl mx-auto animate-fade-in mb-6 flex gap-6">

                        {/* --- COLUNA 1: VISUALIZADOR DE GRID --- */}
                        <div className="flex-1 flex flex-col gap-2">
                           <h4 className="text-xs text-gray-500 font-bold uppercase">Pré-visualização (Grid)</h4>

                           {/* Container do Grid */}
                           <div className="flex-1 bg-[#0f0f10] border border-gray-700 rounded overflow-hidden relative flex items-center justify-center min-h-[300px]"
                              style={{
                                 backgroundImage: `linear-gradient(to right, #333 1px, transparent 1px), linear-gradient(to bottom, #333 1px, transparent 1px)`,
                                 backgroundSize: '40px 40px'
                              }}
                           >
                              {/* O Objeto no Grid */}
                              {formData.preview && (
                                 <div
                                    style={{
                                       width: `${formData.defaultGridWidth * 40}px`,
                                       height: `${formData.defaultGridHeight * 40}px`,
                                       transition: 'all 0.3s ease',
                                       backgroundImage: formData.isTiled ? `url(${formData.preview})` : 'none',
                                       backgroundSize: formData.isTiled ? '40px 40px' : 'cover',
                                       backgroundRepeat: 'repeat',
                                    }}
                                    className="border-2 border-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.3)] relative"
                                 >
                                    {!formData.isTiled && (
                                       <img src={formData.preview} className="w-full h-full object-fill" />
                                    )}
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] text-indigo-300 font-bold whitespace-nowrap">
                                       {formData.defaultGridWidth}x{formData.defaultGridHeight} Grid
                                    </div>
                                 </div>
                              )}
                           </div>
                           <p className="text-[10px] text-gray-500 text-center">Cada quadrado representa 1 espaço no mapa.</p>
                        </div>

                        {/* --- COLUNA 2: CAMPOS --- */}
                        <div className="w-72 flex flex-col gap-4">
                           <h3 className="text-white font-bold border-b border-gray-700 pb-2">
                              {formMode === 'create' ? 'Novo Arquivo' : 'Editar Arquivo'}
                           </h3>

                           <div onClick={() => fileInputRef.current.click()} className="cursor-pointer text-xs text-indigo-400 hover:underline">
                              {formMode === 'create' ? 'Selecionar Arquivo...' : 'Trocar Arquivo...'}
                           </div>
                           <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} />

                           <div>
                              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Nome</label>
                              <input value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white text-sm outline-none focus:border-indigo-500" />
                           </div>

                           <div>
                              <label className="text-[10px] text-gray-500 font-bold uppercase block mb-1">Tipo</label>
                              <div className="grid grid-cols-2 gap-2">
                                 {Object.entries(ASSET_TYPES).map(([key, info]) => (
                                    <button key={key} onClick={() => setFormData({ ...formData, type: key })} className={`px-2 py-1.5 rounded text-[10px] font-bold uppercase border transition-all flex items-center gap-1 ${formData.type === key ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-gray-700 text-gray-400'}`}>
                                       {info.icon} {info.label.split('/')[0]}
                                    </button>
                                 ))}
                              </div>
                           </div>

                           {/* Configurações de Grid */}
                           <div className="bg-white/5 p-3 rounded border border-gray-700">
                              <label className="text-[10px] text-gray-400 font-bold uppercase block mb-2">Dimensões do Grid</label>
                              <div className="flex gap-2 mb-3">
                                 <div className="flex-1">
                                    <span className="text-[9px] text-gray-500 block mb-1">Largura</span>
                                    <input
                                       type="number" step="0.5" min="0.5"
                                       value={formData.defaultGridWidth}
                                       onChange={e => setFormData({ ...formData, defaultGridWidth: parseFloat(e.target.value) })}
                                       className="w-full bg-black border border-gray-600 rounded p-1 text-white text-center"
                                    />
                                 </div>
                                 <div className="flex items-center text-gray-600 pt-4">x</div>
                                 <div className="flex-1">
                                    <span className="text-[9px] text-gray-500 block mb-1">Altura</span>
                                    <input
                                       type="number" step="0.5" min="0.5"
                                       value={formData.defaultGridHeight}
                                       onChange={e => setFormData({ ...formData, defaultGridHeight: parseFloat(e.target.value) })}
                                       className="w-full bg-black border border-gray-600 rounded p-1 text-white text-center"
                                    />
                                 </div>
                              </div>

                              <button
                                 onClick={() => setFormData(prev => ({ ...prev, isTiled: !prev.isTiled }))}
                                 className={`w-full flex items-center justify-center gap-2 p-2 rounded text-xs font-bold uppercase border transition-all
                                    ${formData.isTiled ? 'bg-indigo-900/50 border-indigo-500 text-indigo-200' : 'bg-black border-gray-700 text-gray-500'}
                                 `}
                              >
                                 {formData.isTiled ? <FaCheckSquare /> : <FaSquare />}
                                 Repetir Textura (Tiling)
                              </button>
                           </div>

                           <div className="flex justify-end gap-2 mt-auto">
                              <button onClick={() => setFormMode(null)} className="px-3 py-2 text-gray-400 text-xs font-bold uppercase">Cancelar</button>
                              <button onClick={handleSubmit} className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded text-xs font-bold uppercase shadow-lg">Salvar</button>
                           </div>
                        </div>

                     </div>
                  ) : (
                     <>
                        {/* BARRA DE AÇÕES (Só aparece se não estiver editando) */}
                        <div className="flex gap-2 mb-6">
                           <button
                              onClick={() => {
                                 setFormMode('create')
                                 setFormData({ id: null, name: '', type: 'prop', file: null, preview: '' })
                              }}
                              className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded text-xs font-bold uppercase flex gap-2 items-center shadow-lg"
                           >
                              <FaCloudUploadAlt /> Upload
                           </button>
                           <button onClick={handleCreateFolder} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-xs font-bold uppercase flex gap-2 items-center border border-gray-600">
                              <FaFolderPlus /> Nova Pasta
                           </button>
                        </div>

                        {/* GRID DE ARQUIVOS */}
                        <div className="grid grid-cols-6 gap-4 content-start">
                           {/* PASTAS */}
                           {visibleFolders.map(folder => (
                              <div
                                 key={folder._id}
                                 onClick={() => setCurrentFolder(folder._id)}
                                 onDragOver={(e) => e.preventDefault()}
                                 onDrop={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    const assetId = e.dataTransfer.getData('assetId')
                                    if (assetId) handleMoveAsset(assetId, folder._id)
                                 }}
                                 className="group relative bg-[#1c1c1f] border border-white/5 p-3 rounded-lg flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 aspect-square"
                              >
                                 <FaFolder className="text-4xl text-yellow-600 group-hover:text-yellow-400 drop-shadow-md" />
                                 <span className="text-[10px] text-gray-300 font-bold truncate w-full text-center">{folder.name}</span>
                                 <button onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder._id) }} className="absolute top-1 right-1 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 p-1"><FaTrash size={10} /></button>
                              </div>
                           ))}

                           {/* ASSETS */}
                           {visibleAssets.map(asset => {
                              const isFullCover = asset.type === 'map' || asset.type === 'texture'
                              return (
                                 <div
                                    key={asset._id}
                                    draggable={true}
                                    onDragStart={(e) => {
                                       e.dataTransfer.setData('type', 'asset')
                                       e.dataTransfer.setData('asset', JSON.stringify({ ...asset, url: getAssetUrl(asset.url) }))
                                       e.dataTransfer.setData('assetId', asset._id)
                                    }}
                                    className="group relative bg-black border border-gray-800 rounded-lg overflow-hidden cursor-grab active:cursor-grabbing hover:border-gray-500 aspect-square flex flex-col"
                                 >
                                    <div className="flex-1 relative overflow-hidden flex items-center justify-center bg-[#09090a]">
                                       {asset.type === 'video'
                                          ? <video src={getAssetUrl(asset.url)} className="w-full h-full object-cover opacity-80" />
                                          : <img src={getAssetUrl(asset.url)} className={`w-full h-full opacity-80 group-hover:opacity-100 transition-opacity ${isFullCover ? 'object-cover' : 'object-contain p-2'}`} />
                                       }
                                       <div className="absolute top-1 left-1 bg-black/60 text-white p-1 rounded backdrop-blur-sm text-[10px]">{ASSET_TYPES[asset.type]?.icon}</div>
                                    </div>
                                    <div className="h-7 bg-[#1c1c1f] flex items-center px-2 border-t border-white/5">
                                       <span className="text-[9px] font-bold text-gray-400 truncate w-full">{asset.name}</span>
                                    </div>
                                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                       <button onClick={(e) => { e.stopPropagation(); handleEditStart(asset) }} className="bg-black/50 hover:bg-blue-500 text-white p-1.5 rounded"><FaPen size={8} /></button>
                                       <button onClick={(e) => { e.stopPropagation(); handleDeleteAsset(asset._id) }} className="bg-black/50 hover:bg-red-500 text-white p-1.5 rounded"><FaTrash size={8} /></button>
                                    </div>
                                 </div>
                              )
                           })}
                        </div>
                     </>
                  )}

                  {!loading && visibleFolders.length === 0 && visibleAssets.length === 0 && !formMode && (
                     <div className="flex flex-col items-center justify-center h-40 text-gray-600 opacity-50">
                        <FaFolderOpen size={32} className="mb-2" />
                        <p className="text-xs">Pasta vazia.</p>
                     </div>
                  )}
               </div>
            </div>
         </div>
      </div>
   )
}

export default AssetBrowser