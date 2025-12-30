import { useState, useEffect } from 'react'
import api from '../../config/api'
import {
   FaFolder, FaFolderOpen, FaFolderPlus, FaImage, FaVideo, FaMap, FaCog, FaRuler, FaEye,
   FaPlus, FaTrash, FaPlay, FaUpload, FaArrowLeft, FaArrowRight, FaTimes
} from 'react-icons/fa'
import { PiSelectionBackgroundFill } from "react-icons/pi"

const SceneManager = ({ campaignId, onClose, onActivateScene, onUpdateScene }) => {
   const [scenes, setScenes] = useState([])
   const [folders, setFolders] = useState([])
   const [currentFolder, setCurrentFolder] = useState(null)
   const [editingScene, setEditingScene] = useState(null)

   const [loading, setLoading] = useState(true)
   const [isCreatingScene, setIsCreatingScene] = useState(false)
   const [moveMode, setMoveMode] = useState(null)

   const [newScene, setNewScene] = useState({ name: '', type: 'map', nextScene: '' })

   useEffect(() => {
      fetchData()
   }, [campaignId])
   const fetchData = async () => {
      setLoading(true)
      try {
         const [scenesRes, foldersRes] = await Promise.all([
            api.get(`/scenes/campaign/${campaignId}`),
            api.get(`/scenes/folders/${campaignId}`)
         ])
         setScenes(scenesRes.data)
         setFolders(foldersRes.data)
      } catch (error) {
         console.error("Erro ao carregar dados:", error)
      } finally {
         setLoading(false)
      }
   }

   const handleCreateFolder = async () => {
      const name = prompt("Nome da nova pasta:")
      if (!name) return
      try {
         await api.post('/scenes/folders', { name, campaign: campaignId, parent: currentFolder })
         fetchData()
      }
      catch (error) {
         console.error("Erro ao criar pasta", error)
      }
   }
   const handleDeleteFolder = async (folderId) => {
      if (!confirm("Deletar pasta? Os arquivos voltarão para a raiz.")) return
      try {
         await api.delete(`/scenes/folders/${folderId}`)
         fetchData()
      }
      catch (error) {
         console.error("Erro ao deletar pasta", error)
      }
   }
   const handleCreateScene = async () => {
      if (!newScene.name || !newScene.type) return alert("Preencha nome e o tipo da cena!")

      try {
         const scenePayload = {
            campaign: campaignId,
            name: newScene.name,
            type: newScene.type,
            folder: currentFolder,

            nextScene: null,
            media: {
               url: '',
               loop: newScene.type !== 'cutscene'
            },
            mapConfig: { mode: 'static' }
         }

         await api.post('/scenes', scenePayload)

         setIsCreatingScene(false)
         setNewScene({ name: '', type: 'map' })
         fetchData()
      }
      catch (error) {
         console.error('Erro ao criar cena: ', error)
      }
   }
   const handleDeleteScene = async (id) => {
      if (!confirm("Deletar este arquivo permanentemente?")) return
      try {
         await api.delete(`/scenes/${id}`)
         fetchData()
      }
      catch (error) {
         console.error("Erro ao deletar cena: ", error)
      }
   }
   const handleMoveScene = async (sceneId, targetFolderId) => {
      try {
         await api.put(`/scenes/${sceneId}`, { folder: targetFolderId })
         setMoveMode(null)
         fetchData()
      }
      catch (error) {
         console.error("Erro ao mover", error)
      }
   }

   const renderConfigPanel = () => {
      if (!editingScene) return null

      const updateEdit = (path, value) => {
         setEditingScene(prev => {
            const newState = { ...prev }
            const keys = path.split('.')
            let currentLevel = newState

            for (let i = 0; i < keys.length - 1; i++) {
               const key = keys[i]
               currentLevel[key] = { ...currentLevel[key] }
               currentLevel = currentLevel[key]
            }

            const lastKey = keys[keys.length - 1]
            currentLevel[lastKey] = value
            
            return newState
         })
      }

      const handleSaveConfig = async () => {
         try {
            const payload = {
               name: editingScene.name,
               mapConfig: editingScene.mapConfig || {}
            }

            const { data: updatedScene } = await api.put(`/scenes/${editingScene._id}`, payload)

            setEditingScene(null)
            fetchData()

            if (updatedScene.isActive && onUpdateScene) {
               onUpdateScene(updatedScene)
            }
         }
         catch (error) {
            console.error("Erro ao salvar config:", error)
            alert("Erro ao salvar configurações.")
         }
      }

      return (
         <div className="flex flex-col h-full animate-fade-in bg-[#121214]">
            {/* Header da Configuração */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-800">
               <button onClick={() => setEditingScene(null)} className="text-gray-400 hover:text-white transition-colors">
                  <FaArrowLeft />
               </button>
               <h3 className="text-lg font-bold text-white uppercase tracking-wider">Configurar Cena</h3>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">

               {/* 1. NOME DA CENA */}
               <div className="bg-white/5 p-4 rounded border border-white/10">
                  <label className="text-xs font-bold text-gray-500 uppercase mb-2 block">Nome do Arquivo</label>
                  <input
                     value={editingScene.name}
                     onChange={e => updateEdit('name', e.target.value)}
                     className="w-full bg-black/40 border border-white/10 rounded p-2 text-white outline-none focus:border-gray-500"
                  />
               </div>

               {/* 2. CONFIGURAÇÕES DE MAPA (Apenas se for tipo 'map') */}
               {editingScene.type === 'map' && (
                  <div className="space-y-6">

                     {/* Grid & Layout */}
                     <div className="bg-white/5 p-4 rounded border border-white/10 space-y-4">
                        <h4 className="text-sm font-bold text-indigo-400 uppercase flex items-center gap-2 border-b border-white/10 pb-2">
                           <FaMap /> Grid & Layout
                        </h4>

                        {/* Controles do tabuleiro */}
                        <div className="flex flex-col justify-between gap-3 mb-3">
                           <h5 className="text-xs font-bold text-gray-400 uppercase">Tabuleiro</h5>

                           <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer">
                              <input
                                 type="checkbox"
                                 checked={editingScene.mapConfig?.mapSize?.limitView ?? true}
                                 onChange={e => updateEdit('mapConfig.mapSize.limitView', e.target.checked)}
                                 className="accent-indigo-500 w-4 h-4"
                              />
                              <span>Limitar Câmera</span>
                           </label>

                           <div className="flex gap-4">
                              <div className="flex-1">
                                 <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Largura (X)</label>
                                 <input
                                    type="number" min="10" max="500"
                                    value={editingScene.mapConfig?.mapSize?.mapWidth || 30}
                                    onChange={e => updateEdit('mapConfig.mapSize.mapWidth', Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-xs text-center"
                                 />
                              </div>

                              <div className="flex items-center pt-4 text-gray-600">x</div>

                              <div className="flex-1">
                                 <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Altura (Y)</label>
                                 <input
                                    type="number" min="10" max="500"
                                    value={editingScene.mapConfig?.mapSize?.mapHeight || 20}
                                    onChange={e => updateEdit('mapConfig.mapSize.mapHeight', Number(e.target.value))}
                                    className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-xs text-center"
                                 />
                              </div>
                           </div>

                           <div>
                              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Tamanho (px)</label>
                              <input
                                 type="number"
                                 value={editingScene.mapConfig?.gridSize || 70}
                                 onChange={e => updateEdit('mapConfig.gridSize', Number(e.target.value))}
                                 className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-xs"
                              />
                           </div>
                        </div>

                        {/* Controles do Grid */}
                        <div className="flex flex-col justify-between gap-3 pt-3 mb-2 border-t border-white/10">
                           <h5 className="text-xs font-bold text-gray-400 uppercase">Grid</h5>
                           <label className="flex items-center gap-2 text-xs text-gray-300 cursor-pointer select-none">
                              <input
                                 type="checkbox"
                                 checked={editingScene.mapConfig?.gridSnap}
                                 onChange={e => updateEdit('mapConfig.gridSnap', e.target.checked)}
                                 className="accent-indigo-500 w-4 h-4"
                              />
                              <span>Snap (Imã)</span>
                           </label>
                           <div className="grid grid-cols-2 gap-4 animate-fade-in">

                              <div>
                                 <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Cor da Linha</label>
                                 <div className="flex gap-2 h-[34px]">
                                    <input
                                       type="color"
                                       value={editingScene.mapConfig?.gridColor || '#000000'}
                                       onChange={e => updateEdit('mapConfig.gridColor', e.target.value)}
                                       className="h-full w-10 bg-transparent border border-white/10 rounded cursor-pointer"
                                    />
                                    <input
                                       type="text"
                                       value={editingScene.mapConfig?.gridColor || '#000000'}
                                       onChange={e => updateEdit('mapConfig.gridColor', e.target.value)}
                                       className="flex-1 bg-black/40 border border-white/10 rounded p-2 text-white text-xs uppercase"
                                    />
                                 </div>
                              </div>
                              <div className="col-span-2">
                                 <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 flex justify-between">
                                    <span>Opacidade</span>
                                    <span>{Math.round((editingScene.mapConfig?.gridOpacity || 0.3) * 100)}%</span>
                                 </label>
                                 <input
                                    type="range" min="0" max="1" step="0.05"
                                    value={editingScene.mapConfig?.gridOpacity || 0.3}
                                    onChange={e => updateEdit('mapConfig.gridOpacity', Number(e.target.value))}
                                    className="w-full accent-indigo-500 h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
                                 />
                              </div>
                           </div>
                        </div>

                     </div>

                     {/* Seção Escala (Metros) */}
                     <div className="bg-white/5 p-4 rounded border border-white/10 space-y-4">
                        <h4 className="text-sm font-bold text-green-400 uppercase flex items-center gap-2 border-b border-white/10 pb-2">
                           <FaRuler /> Escala Real
                        </h4>
                        <div className="flex gap-4">
                           <div className="flex-1">
                              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Distância por Quadrado</label>
                              <input
                                 type="number" step="0.5"
                                 value={editingScene.mapConfig?.distanceScale || 1.5}
                                 onChange={e => updateEdit('mapConfig.distanceScale', Number(e.target.value))}
                                 className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-xs"
                                 placeholder="Ex: 1.5"
                              />
                           </div>
                           <div className="w-24">
                              <label className="text-[10px] uppercase font-bold text-gray-500 mb-1 block">Unidade</label>
                              <input
                                 type="text"
                                 value={editingScene.mapConfig?.distanceUnit || 'm'}
                                 onChange={e => updateEdit('mapConfig.distanceUnit', e.target.value)}
                                 className="w-full bg-black/40 border border-white/10 rounded p-2 text-white text-xs text-center"
                                 placeholder="m, ft..."
                              />
                           </div>
                        </div>
                        <p className="text-[10px] text-gray-500 italic">
                           Isso define quanto vale cada "passo" ou quadrado para cálculo de movimento.
                        </p>
                     </div>

                  </div>
               )}
            </div>

            {/* Footer com Botões */}
            <div className="mt-4 pt-4 border-t border-gray-800 flex justify-end gap-3">
               <button
                  onClick={() => setEditingScene(null)}
                  className="px-4 py-2 text-gray-400 hover:text-white text-xs font-bold uppercase transition-colors"
               >
                  Cancelar
               </button>
               <button
                  onClick={handleSaveConfig}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-2 rounded text-xs font-bold uppercase shadow-lg transition-colors"
               >
                  Salvar Alterações
               </button>
            </div>
         </div>
      )
   }

   const visibleFolders = folders.filter(f => f.parent === (currentFolder || null))
   const visibleScenes = scenes.filter(s => s.folder === currentFolder)

   return (
      <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/10 backdrop-blur-xs p-4 animate-fade-in">
         <div className="bg-[#121214] w-full max-w-5xl h-[85vh] rounded-lg border border-gray-700 flex flex-col shadow-2xl overflow-hidden">

            {/* --- HEADER --- */}
            <div className="flex justify-between items-center p-4 border-b border-gray-800 bg-white/5">
               <div className="flex items-center gap-3">
                  {currentFolder && (
                     <button
                        onClick={() => setCurrentFolder(null)}
                        className="text-gray-400 hover:text-white p-2 rounded hover:bg-white/10 transition-colors"
                        title="Voltar"
                     >
                        <FaArrowLeft />
                     </button>
                  )}

                  {/* Breadcrumb / Título */}
                  <h2 className="text-xl font-bold text-white flex items-center gap-2 select-none">
                     {currentFolder
                        ? <><FaFolderOpen className="text-gray-500" /> {folders.find(f => f._id === currentFolder)?.name}</>
                        : <><FaFolder className='text-gray-500 ml-10' /> Meus Arquivos</>
                     }
                  </h2>
               </div>
               <button onClick={onClose} className="text-gray-400 hover:text-white hover:bg-red-500/20 p-2 rounded transition-colors"><FaTimes /></button>
            </div>

            <div className="flex flex-1 overflow-hidden">

               {/* --- ÁREA PRINCIPAL --- */}
               <div className="flex-1 p-6 overflow-y-auto custom-scrollbar bg-[#09090a] relative">
                  {editingScene ? (
                     renderConfigPanel()
                  ) : (
                     <>
                        {/* Toolbar */}
                        {!isCreatingScene ? (
                           <div className="flex gap-2 mb-6">
                              <button onClick={() => setIsCreatingScene(true)} className="bg-gray-600 hover:bg-gray-500 text-white px-4 py-2 rounded text-xs font-bold uppercase flex gap-2 items-center transition-colors shadow-lg shadow-gray-500/20">
                                 <FaPlus /> Novo Arquivo
                              </button>

                              {/* Só permite criar pasta na raiz (se for sistema de 1 nível) */}
                              {currentFolder === null && (
                                 <button onClick={handleCreateFolder} className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-xs font-bold uppercase flex gap-2 items-center transition-colors border border-gray-600">
                                    <FaFolderPlus /> Nova Pasta
                                 </button>
                              )}
                           </div>
                        ) : null}

                        {/* LOADING */}
                        {loading && <div className="text-center py-10 text-gray-500">Carregando seus arquivos...</div>}

                        {/* --- MODO DE CRIAÇÃO (FORMULÁRIO) --- */}
                        {isCreatingScene && (
                           <div className="bg-white/5 border border-gray-700 p-6 rounded-lg max-w-lg mx-auto mb-6 animate-slide-down">
                              <h3 className="text-white font-bold mb-4 border-b border-gray-700 pb-2">Adicionar Novo Arquivo</h3>

                              <div className="space-y-4">
                                 <input
                                    placeholder="Nome da Cena (Ex: Caverna Escura)"
                                    className="w-full bg-black/50 border border-gray-600 rounded p-2 text-white text-sm focus:border-indigo-500 outline-none"
                                    value={newScene.name}
                                    onChange={e => setNewScene({ ...newScene, name: e.target.value })}
                                 />

                                 <div className="flex gap-2">
                                    {['map', 'background', 'cutscene'].map(type => (
                                       <button
                                          key={type}
                                          onClick={() => setNewScene({ ...newScene, type })}
                                          className={`flex-1 py-2 text-xs font-bold uppercase rounded border transition-all
                                          ${newScene.type === type
                                                ? 'bg-gray-600 border-gray-500 text-white'
                                                : 'bg-transparent border-gray-600 text-gray-400 hover:border-gray-400'}
                                       `}
                                       >
                                          {type === 'map' ? 'Mapa' : type === 'background' ? 'Background' : 'Cutscene'}
                                       </button>
                                    ))}
                                 </div>

                                 <div className="flex gap-2 mt-4">
                                    <button
                                       onClick={() => setIsCreatingScene(false)}
                                       className="flex-1 py-2 text-gray-400 text-xs font-bold uppercase hover:text-white"
                                    >
                                       Cancelar
                                    </button>
                                    <button
                                       onClick={handleCreateScene}
                                       className="flex-1 bg-gray-600 hover:bg-gray-500 disabled:opacity-50 disabled:cursor-wait text-white py-2 rounded text-xs font-bold uppercase shadow-lg"
                                    >
                                       Criar Cena
                                    </button>
                                 </div>
                              </div>
                           </div>
                        )}

                        {/* --- GRID DE ARQUIVOS --- */}
                        {!isCreatingScene && !loading && (
                           <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 content-start">

                              {/* 1. PASTAS (Visible Folders) */}
                              {visibleFolders.map(folder => (
                                 <div
                                    key={folder._id}
                                    onClick={() => { if (moveMode) handleMoveScene(moveMode, folder._id); else { setCurrentFolder(folder._id) } }}
                                    className={`
                                    group relative bg-[#1c1c1f] border border-white/5 p-4 rounded-lg flex flex-col items-center justify-center gap-2 
                                    cursor-pointer transition-all aspect-square hover:bg-white/10 hover:shadow-xl hover:-translate-y-1
                                    ${moveMode ? 'animate-pulse border-gray-500 border-2' : ''}
                                 `}
                                 >
                                    <FaFolder className="text-5xl text-yellow-600 group-hover:text-yellow-400 transition-colors drop-shadow-md" />
                                    <span className="text-xs text-gray-300 font-bold truncate w-full text-center px-2">{folder.name}</span>

                                    {/* Delete Pasta */}
                                    {!moveMode && (
                                       <button
                                          onClick={(e) => { e.stopPropagation(); handleDeleteFolder(folder._id) }}
                                          className="absolute top-2 right-2 text-gray-600 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1"
                                       >
                                          <FaTrash size={10} />
                                       </button>
                                    )}

                                    {moveMode && <span className="text-[10px] text-white uppercase font-bold">Mover para cá</span>}
                                 </div>
                              ))}

                              {/* 2. CENAS (Visible Scenes) */}
                              {visibleScenes.map(scene => (
                                 <div
                                    key={scene._id}
                                    className={`group relative bg-black border rounded-lg overflow-hidden flex flex-col transition-all aspect-square 
                                    hover:-translate-y-1 hover:shadow-xl
                                    ${scene.isActive ? 'border-gray-500 shadow-[0_0_15px_rgba(34,97,94,0.3)]' : 'border-gray-800 hover:border-gray-500'}
                                    ${moveMode === scene._id ? 'opacity-50 ring-2 ring-gray-500' : ''}
                                 `}
                                 >
                                    {/* Botões */}
                                    <div className="absolute top-1 w-full flex justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-1">
                                       <button
                                          onClick={() => onActivateScene(scene._id)}
                                          title="Ativar no Palco"
                                          className="text-green-500 hover:text-green-300 hover:bg-green-500/10 p-1 rounded"
                                       >
                                          <FaPlay size={10} />
                                       </button>

                                       <button
                                          onClick={() => setMoveMode(scene._id)}
                                          title="Mover de pasta"
                                          className="text-blue-500 hover:text-blue-300 hover:bg-blue-500/10 p-1 rounded"
                                       >
                                          <FaArrowRight size={10} />
                                       </button>

                                       <button
                                          onClick={() => handleDeleteScene(scene._id)}
                                          title="Deletar"
                                          className="text-red-500 hover:text-red-300 hover:bg-red-500/10 p-1 rounded"
                                       >
                                          <FaTrash size={10} />
                                       </button>

                                       <button
                                          onClick={(e) => {
                                             e.stopPropagation()
                                             setEditingScene({
                                                ...scene,
                                                mapConfig: {
                                                   gridEnabled: true,
                                                   gridSize: 70,
                                                   ...scene.mapConfig
                                                }
                                             })
                                          }}
                                          title="Configurações"
                                          className="text-gray-400 hover:text-white hover:bg-white/10 p-1 rounded"
                                       >
                                          <FaCog size={10} />
                                       </button>
                                    </div>

                                    {/* Preview Imagem/Video */}
                                    <div className="flex-1 relative overflow-hidden bg-gray-900">
                                       {scene.media?.url && (
                                          scene.type === 'video'
                                             ? <video src={scene.media.url} className="w-full h-full object-cover opacity-60" />
                                             : <img src={scene.media.url} className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity" alt={scene.name} />
                                       )}
                                       <div className="absolute top-1 w-full h-full flex items-center justify-center text-gray-500">
                                          {scene.type === 'map' && <FaMap className="drop-shadow-md text-2xl" />}
                                          {scene.type === 'background' && <PiSelectionBackgroundFill className="drop-shadow-md text-2xl" />}
                                          {scene.type === 'cutscene' && <FaVideo className="drop-shadow-md text-2xl" />}
                                       </div>
                                    </div>

                                    {/* Footer com Ações */}
                                    <div className="h-10 bg-[#1c1c1f] flex justify-between items-center px-3 border-t border-white/5">
                                       <span className={`text-[10px] font-bold truncate max-w-[60%] ${scene.isActive ? 'text-gray-100' : 'text-gray-400'}`}>
                                          {scene.name}
                                       </span>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        )}

                        {/* Estado Vazio */}
                        {!loading && !isCreatingScene && visibleFolders.length === 0 && visibleScenes.length === 0 && (
                           <div className="flex flex-col items-center justify-center h-64 text-gray-600 opacity-50">
                              <FaFolderOpen size={48} className="mb-2" />
                              <p className="text-sm">Esta pasta está vazia.</p>
                           </div>
                        )}

                        {/* BARRA FLUTUANTE DE "MOVENDO..." */}
                        {moveMode && (
                           <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-gray-600 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-4 z-50 animate-bounce-in border border-gray-400">
                              <div className="flex flex-col">
                                 <span className="text-xs font-bold uppercase">Movendo arquivo...</span>
                                 <span className="text-[10px] opacity-80">Selecione uma pasta ou a raiz</span>
                              </div>

                              <div className="h-6 w-px bg-white/30"></div>

                              {currentFolder && (
                                 <button
                                    onClick={() => handleMoveScene(moveMode, null)}
                                    className="text-xs font-bold hover:bg-white/20 px-2 py-1 rounded transition-colors"
                                 >
                                    Mover para Raiz
                                 </button>
                              )}

                              <button
                                 onClick={() => setMoveMode(null)}
                                 className="bg-black/20 hover:bg-black/40 p-1 rounded-full"
                              >
                                 <FaTimes size={12} />
                              </button>
                           </div>
                        )}
                     </>
                  )}


               </div>
            </div>
         </div>
      </div>
   )
}

export default SceneManager