// --- Core & Libs ---
import { useEffect, useState, useContext, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { io } from 'socket.io-client'

// --- Config & Context ---
import api from '../config/api'
import { AuthContext } from '../context/authContext'

// ---------------------------------------

// --- Scenes & Game ---
import GameStage from '../components/scenes/GameStage'
import SceneManager from '../components/scenes/SceneManager'

// --- UI & Tools ---
import Toolbar from '../components/Toolbar'
import LayerSidebar from '../components/LayerSidebar'
import LibraryTab from '../components/sidebar/LibraryTab'
import AssetBrowser from '../components/assets/AssetBrowser'

// --- Windows & Sheets ---
import DraggableWindow from '../components/DraggableWindow'
import DocumentEditor from '../components/sheets/DocumentEditor'
import SheetManager from '../components/sheets/SheetManager'

// ---------------------------------------

// --- Icons ---
import { IoChatbubblesSharp } from "react-icons/io5"
import { FaBookQuran, FaImages } from "react-icons/fa6"
import { FaCog, FaCopy, FaSync, FaUserPlus, FaChevronLeft, FaChevronRight, FaBroadcastTower } from "react-icons/fa"

// ---------------------------------------

const Campaign = () => {
   // --- Hooks & Refs Essenciais ---
   const { id: campaignId } = useParams()
   const { user } = useContext(AuthContext)
   const socketRef = useRef(null)

   // --- Dados da Campanha & Socket ---
   const [socket, setSocket] = useState(null)
   const [campaign, setCampaign] = useState(null)
   const [loading, setLoading] = useState(true)
   const [error, setError] = useState('')
   const [inviteCode, setInviteCode] = useState('')
   const [viewingScene, setViewingScene] = useState(null)

   // ---- Variáveis Derivadas (Helpers) ---
   const mestreId = (campaign?.mestre?._id || campaign?.mestre)?.toString()
   const userId = (user?._id || user?.id)?.toString()
   const isMaster = mestreId && userId && mestreId === userId
   const sceneType = campaign?.activeScene?.type
   const isPreviewing = isMaster && viewingScene && campaign?.activeScene && viewingScene._id !== campaign.activeScene._id

   // --- Interface (Layout & Tabs) ---
   const [isSidebarOpen, setIsSidebarOpen] = useState(true)
   const [activeTab, setActiveTab] = useState('chat')

   // --- Ferramentas de Jogo & Cena ---
   const [activeTool, setActiveTool] = useState('select')
   const [activeLayer, setActiveLayer] = useState('token')
   const [isSyncing, setIsSyncing] = useState(false)
   const [isSceneManagerOpen, setIsSceneManagerOpen] = useState(false)
   const [objectDrawing, setObjectDrawing] = useState({
      active: false,
      texture: null,
      type: null,
      shape: 'poly',
      snap: true,
      strokeWidth: 20
   })

   // --- Sistema de Janelas (Fichas) ---
   const [openWindows, setOpenWindows] = useState([])
   const [myCharacters, setMyCharacters] = useState([])
   const [topZIndex, setTopZIndex] = useState(100)

   // --- Galeria & Assets ---
   const [libraryFolders, setLibraryFolders] = useState([])
   const [libraryItems, setLibraryItems] = useState([])
   const [isFullGalleryOpen, setIsFullGalleryOpen] = useState(false)
   const [isQuickGalleryOpen, setIsQuickGalleryOpen] = useState(false)
   const [assetVersion, setAssetVersion] = useState(0)
   const triggerAssetUpdate = () => setAssetVersion(prev => prev + 1)

   useEffect(() => {
      setActiveTool('select')
   }, [viewingScene])
   useEffect(() => {
      const baseUrl = import.meta.env.DEV ? 'http://localhost:3000' : window.location.origin

      const newSocket = io(baseUrl, {
         transports: ['websocket', 'polling'],
         reconnection: true,
         withCredentials: true
      })
      socketRef.current = newSocket
      setSocket(newSocket)

      newSocket.emit('join_campaign', campaignId)
      newSocket.on('scene_updated', (newScene) => {
         setCampaign(prev => ({
            ...prev,
            activeScene: newScene
         }))

         if (!isMaster) {
            setViewingScene(newScene)
         }
         else {
            setViewingScene(prev => prev?._id === newScene._id ? newScene : prev)
         }
      })
      newSocket.on('character_updated', (updatedChar) => {
         setMyCharacters(prev => prev.map(c => c._id === updatedChar._id ? updatedChar : c))
         setLibraryItems(prev => prev.map(i => i._id === updatedChar._id ? updatedChar : i))
         setOpenWindows(prev => prev.map(w =>
            w.id === updatedChar._id ? { ...w, data: updatedChar, title: updatedChar.name } : w
         ))
         console.log(openWindows)
      })
      newSocket.on('force_view', (viewData) => {
         window.dispatchEvent(new CustomEvent('map_force_view', { detail: viewData }))
      })
      newSocket.on('sync_view', (viewData) => {
         window.dispatchEvent(new CustomEvent('map_sync_view', { detail: viewData }))
      })

      return () => {
         newSocket.offAny()
         newSocket.disconnect()
      }
      socketRef.current = null
   }, [campaignId, isMaster])
   useEffect(() => {
      fetchCampaign()
      fetchMyCharacters()
      fetchLibrary()
   }, [campaignId])

   const fetchCampaign = async () => {
      try {
         const { data } = await api.get(`/campaigns/${campaignId}`)
         setCampaign(data)
         setViewingScene(data.activeScene)
      }
      catch (error) {
         console.error('Erro ao buscar campanha', error)
      }
      finally {
         setLoading(false)
      }
   }
   const fetchMyCharacters = async () => {
      try {
         const { data } = await api.get(`/characters/my/${campaignId}`)
         setMyCharacters(Array.isArray(data) ? data : [])
      }
      catch (error) {
         setError('Erro ao buscar personagens: ', error)
         console.error('Erro ao buscar personagens: ', error)
      }
      finally {
         setLoading(false)
      }
   }
   const fetchInvite = async () => {
      try {
         const { data } = await api.get(`/campaigns/${campaignId}/invite`)
         setInviteCode(data.inviteCode)
      } catch (err) { console.error(err) }
   }
   const fetchLibrary = async () => {
      try {
         const { data } = await api.get(`/library/${campaignId}`)
         setLibraryFolders(data.folders)
         setLibraryItems(data.items)
      }
      catch (error) {
         console.error("Erro library:", error)
      }
   }

   const openWindow = (character) => {
      const isOpen = openWindows.find(w => w.id === character._id)

      if (isOpen) {
         bringToFront(character._id)
      } else {
         const newWindow = {
            id: character._id,
            type: 'sheet',
            title: character.name,
            data: character,
            zIndex: topZIndex + 1
         }
         setOpenWindows([...openWindows, newWindow])
         setTopZIndex(prev => prev + 1)
      }
   }
   const closeWindow = (windowId) => {
      setOpenWindows(prev => prev.filter(w => w.id !== windowId))
   }
   const bringToFront = (windowId) => {
      setTopZIndex(prev => prev + 1)
      setOpenWindows(prev => prev.map(w =>
         w.id == windowId ? { ...w, zIndex: topZIndex + 1 } : w
      ))
   }
   const copyToClipboard = () => {
      // Cria o link completo (ajuste a URL base conforme seu deploy ou localhost)
      const link = `${window.location.origin}/join/${inviteCode}`
      navigator.clipboard.writeText(link)
      alert("Link copiado! Mande para seus jogadores.")
   }

   const handleCreateLibraryItem = async (type, folderId) => {
      try {
         // --- CRIAR PASTA ---
         if (type === 'folder') {
            const name = prompt("Nome da nova pasta:")
            if (!name) return

            await api.post('/library/folders', {
               name,
               campaign: campaignId,
               parent: folderId
            })
         }
         // --- CRIAR ITEM (PC, NPC, DOC) ---
         else {
            // Usa a rota de characters, mas passando TYPE e FOLDER
            const payload = {
               campaignId,
               name: `Novo ${type.toUpperCase()}`,
               type: type,      // 'pc', 'npc', 'doc'
               folder: folderId // ID da pasta ou null
            }

            const { data: newItem } = await api.post('/characters', payload)

            // Abre a janela imediatamente
            openWindow(newItem)
         }

         // Atualiza a lista visualmente
         fetchLibrary()

      } catch (error) {
         console.error("Erro ao criar:", error)
         alert("Erro ao criar item.")
      }
   }
   const handleMoveLibraryItem = async (itemId, itemType, targetFolderId) => {
      try {
         // Se arrastou um ARQUIVO (Personagem/Doc)
         if (itemType === 'file') {
            await api.put(`/characters/${itemId}`, { folder: targetFolderId })
         }
         // Se arrastou uma PASTA
         else {
            await api.put(`/library/folders/${itemId}`, { parent: targetFolderId })
         }

         // Atualiza a lista imediatamente
         fetchLibrary()
      } catch (error) {
         console.error("Erro ao mover:", error)
      }
   }
   const handleDeleteLibraryItem = async (itemId, type) => {
      try {
         closeWindow(itemId)

         if (type === 'folder') {
            await api.delete(`/library/folders/${itemId}`)
         } else {
            await api.delete(`/characters/${itemId}`)
         }

         fetchLibrary()
      } catch (error) {
         console.error("Erro ao deletar:", error)
         alert("Erro ao deletar item.")
      }
   }
   const handleSheetUpdate = (updatedChar) => {
      let updatedCharactersList = prev => prev.map(c => c._id === updatedChar._id ? updatedChar : c)

      setMyCharacters(updatedCharactersList)
      setLibraryItems(updatedCharactersList)
      setOpenWindows(prev => prev.map(w =>
         w.id === updatedChar._id ? { ...w, data: updatedChar, title: updatedChar.name } : w
      ))
   }
   const handleActivateScene = async (sceneId) => {
      try {
         const { data: updatedScene } = await api.put(`/scenes/${sceneId}/activate`, {
            campaignId: campaignId
         })

         if (socket) {
            socket.emit('gm_change_scene', {
               campaignId,
               scene: updatedScene
            })
         }

         setCampaign(prev => ({
            ...prev,
            activeScene: updatedScene
         }))

         setIsSceneManagerOpen(false)
      }
      catch (error) {
         console.error("Erro ao ativar cena:", error)
      }
   }
   const handleSceneUpdate = (updatedScene) => {
      setViewingScene(updatedScene)

      if (campaign?.activeScene?._id === updatedScene._id) {
         setCampaign(prev => ({ ...prev, activeScene: updatedScene }))
         if (socket) socket.emit('gm_change_scene', { campaignId, scene: updatedScene })
      }
   }
   const handleSheetDelete = (deletedCharId) => {
      setMyCharacters(prev => prev.filter(char => char._id !== deletedCharId))
      setOpenWindows(prev => prev.filter(win => win.id !== deletedCharId))
   }
   const handleRefreshInvite = async () => {
      if (!confirm("Isso invalidará o link antigo. Continuar?")) return
      try {
         const { data } = await api.post(`/campaigns/${campaignId}/invite/refresh`)
         setInviteCode(data.inviteCode)
      } catch (err) { alert("Erro ao renovar") }
   }
   const handlePreviewScene = async (sceneId) => {
      console.log("Tentando carregar preview da cena ID:", sceneId)
      if (!sceneId) return console.error("ID da cena inválido")
      try {
         const { data: sceneData } = await api.get(`/scenes/${sceneId}`)
         console.log("Dados recebidos da API:", sceneData)
         if (typeof sceneData === 'string' && sceneData.startsWith('<!doctype html>')) {
            console.error("ERRO CRÍTICO: A rota /api/scenes/:id não existe ou falhou.")
            return
         }
         setViewingScene(sceneData)
         setIsSceneManagerOpen(false)
      } catch (error) { console.error("Erro ao carregar preview:", error) }
   }
   const handleBroadcastScene = async () => {
      if (!viewingScene) return

      try {
         console.log(viewingScene)
         const { data: updatedScene } = await api.put(`/scenes/${viewingScene._id}/activate`, {
            campaignId: campaignId
         })

         if (socket) {
            socket.emit('gm_change_scene', {
               campaignId,
               scene: updatedScene
            })
         }

         setCampaign(prev => ({ ...prev, activeScene: updatedScene }))
      } catch (error) { console.error("Erro ao transmitir cena:", error) }
   }

   return (
      <div className='relative bg-gray-950 w-screen h-screen flex overflow-hidden'>

         {/*MAPA (CANVAS)*/}
         <div className='absolute inset-0 z-0'>
            <GameStage
               socket={socket}
               user={user}
               campaignId={campaignId}
               activeScene={viewingScene}
               onSceneUpdate={handleSceneUpdate}
               onActivateScene={handleActivateScene}
               isMaster={isMaster}
               isSidebarOpen={isSidebarOpen}
               activeTool={activeTool}
               isSyncing={isSyncing}
               objectDrawing={objectDrawing}
               activeLayer={activeLayer}
            />
         </div>

         {isPreviewing && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
               <div className="bg-red-900/90 border border-red-500 text-white px-6 py-2 rounded-full shadow-[0_0_20px_rgba(220,38,38,0.5)] flex items-center gap-4">
                  <div className="flex flex-col">
                     <span className="text-[10px] font-bold text-red-300 uppercase tracking-widest">Modo Preview</span>
                     <span className="text-xs font-bold">Editando: {viewingScene.name}</span>
                  </div>

                  <button
                     onClick={handleBroadcastScene}
                     className="bg-white text-red-900 hover:bg-gray-200 px-4 py-1.5 rounded-full text-xs font-bold uppercase flex items-center gap-2 transition-transform hover:scale-105 active:scale-95 shadow-lg"
                  >
                     <FaBroadcastTower /> Transmitir
                  </button>
               </div>
            </div>
         )}

         {/*FERRAMENTAS*/}
         <div className="w-full h-12 flex items-center justify-center gap-4 px-4 mt-5 z-40">
            <Toolbar
               activeTool={activeTool}
               onSelectTool={setActiveTool}
               isMaster={isMaster}
               campaignId={campaignId}

               onOpenScenes={() => setIsSceneManagerOpen(true)}

               isSyncing={isSyncing}
               onToggleSync={() => setIsSyncing(!isSyncing)}
               objectDrawing={objectDrawing}
               setObjectDrawing={setObjectDrawing}
               activeLayer={activeLayer}
               setActiveLayer={setActiveLayer}

               onOpenFullGallery={() => setIsFullGalleryOpen(true)}
               assetVersion={assetVersion}
            />
         </div>

         {/* BARRA DE CAMADAS */}
         {isMaster && (
            <LayerSidebar
               activeLayer={activeLayer}
               setActiveLayer={setActiveLayer}
            />
         )}

         {/*SIDEBAR*/}
         <div
            className={`relative bg-black h-full flex flex-col text-white top-0 right-0 border-l border-gray-800 shadow-xl transition-all z-40
            ${isSidebarOpen ? 'w-120' : 'w-10'}`}
         >
            <button
               onClick={() => setIsSidebarOpen(!isSidebarOpen)}
               className="absolute top-1/2 -left-3 -translate-y-1/2 w-5 h-17 bg-gray-900 border border-gray-700 rounded-2xl flex items-center justify-center 
               cursor-pointer hover:bg-gray-800 text-gray-400 hover:text-white shadow-[-5px_0_10px_rgba(0,0,0,0.5)] transition-colors z-50"
               title={isSidebarOpen ? "Recolher Sidebar" : "Expandir Sidebar"}
            >
               {/* Ícone Vertical (Setinha) */}
               <span className="text-xs font-bold transform whitespace-nowrap">
                  {isSidebarOpen ? <FaChevronRight /> : <FaChevronLeft />}
               </span>
            </button>

            {isSidebarOpen && (
               <div>
                  <div className='flex justify-between border-b border-gray-800'>
                     <button
                        onClick={() => setActiveTab('chat')}
                        className={`w-full flex justify-center py-3 text-sm font-bold transition-all cursor-pointer
                           ${activeTab === 'chat' ? 'bg-gray-800 text-gray-400 border-b-2 border-gray-500' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                        <IoChatbubblesSharp className='text-2xl' />
                     </button>
                     <button
                        onClick={() => setActiveTab('sheets')}
                        className={`w-full flex justify-center py-3 text-sm font-bold transition-all cursor-pointer
                           ${activeTab === 'sheets' ? 'bg-gray-800 text-gray-400 border-b-2 border-gray-500' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                        <FaBookQuran className='text-2xl' />
                     </button>
                     <button
                        onClick={() => { setActiveTab('settings'); fetchInvite() }}
                        className={`w-full flex justify-center py-3 text-sm font-bold transition-all cursor-pointer
                           ${activeTab === 'settings' ? 'bg-gray-800 text-gray-400 border-b-2 border-gray-500' : 'text-gray-500 hover:text-gray-300'}`}
                     >
                        <FaCog className='text-2xl' />
                     </button>
                  </div>

                  <div className='flex-1 overflow-y-auto custom-scrollbar'>
                     {activeTab === 'chat' && (
                        <div className="text-gray-500 text-center mt-10">
                           Chat desconectado.
                        </div>
                     )}

                     {activeTab === 'sheets' && (
                        <LibraryTab
                           items={libraryItems}
                           folders={libraryFolders}
                           onOpen={(item) => openWindow(item)}
                           onCreate={handleCreateLibraryItem}
                           onMove={handleMoveLibraryItem}
                           onDelete={handleDeleteLibraryItem}
                           isMaster={isMaster}
                           user={user}
                        />
                     )}

                     {activeTab === 'settings' && (
                        <div className="flex flex-col gap-6 animate-fade-in">

                           {/* Seção de Convite */}
                           {isMaster && (
                              <div className="bg-gray-900 p-4 rounded border border-gray-800">
                                 <h3 className="text-gray-400 font-bold uppercase text-xs mb-3 flex items-center gap-2">
                                    <FaUserPlus /> Convidar Jogadores
                                 </h3>

                                 <p className="text-gray-500 text-xs mb-2">
                                    Envie este link para seus amigos entrarem automaticamente na campanha.
                                 </p>

                                 <div className="flex gap-2 mb-2">
                                    <div className="flex-1 bg-black border border-gray-700 rounded p-2 text-gray-300 text-xs truncate select-all">
                                       {inviteCode ? `${window.location.origin}/join/${inviteCode}` : 'Carregando...'}
                                    </div>
                                    <button
                                       onClick={copyToClipboard}
                                       className="bg-gray-600 hover:bg-gray-500 text-white p-2 rounded transition-colors"
                                       title="Copiar Link"
                                    >
                                       <FaCopy />
                                    </button>
                                 </div>

                                 <button
                                    onClick={handleRefreshInvite}
                                    className="text-xs text-gray-500 hover:text-red-400 flex items-center gap-1 transition-colors"
                                 >
                                    <FaSync size={10} /> Revogar e Gerar Novo Link
                                 </button>
                              </div>
                           )}

                           {/* Espaço para futuras configs (ex: Deletar Campanha) */}
                           <div className="bg-gray-900 p-4 rounded border border-gray-800 opacity-50">
                              <h3 className="text-gray-400 font-bold uppercase text-xs mb-2">Zona de Perigo</h3>
                              <p className="text-[10px] text-gray-600">Configurações avançadas em breve.</p>
                           </div>

                        </div>
                     )}
                  </div>
               </div>
            )}
         </div>

         {/*JANELAS FLUTUANTES*/}
         {openWindows.map((win) => (
            <DraggableWindow
               key={win.id}
               title={win.title}
               zIndex={win.zIndex}
               onClose={() => closeWindow(win.id)}
               onFocus={() => bringToFront(win.id)}
               initialPos={{ x: 100 + (openWindows.length * 20), y: (openWindows.length * 20) - 8 }}
            >
               {win.data.type === 'doc' && (
                  <DocumentEditor
                     data={win.data}
                     onUpdate={handleSheetUpdate}
                  />
               )}

               {(['pc', 'npc', 'structure'].includes(win.data.type) || !win.data.type) && (
                  <SheetManager
                     character={win.data}
                     system="ordem-paranormal"
                     onUpdate={handleSheetUpdate}
                     onDelete={handleSheetDelete}
                     campaignPlayers={Campaign?.players}
                  />
               )}
            </DraggableWindow>
         ))}

         {/*JANELAS MANEJAMENTO*/}
         {isSceneManagerOpen && (
            <SceneManager
               campaignId={campaignId}
               onClose={() => setIsSceneManagerOpen(false)}
               onActivateScene={handlePreviewScene}
               onUpdateScene={handleSceneUpdate}
            />
         )}
         {isFullGalleryOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
               <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFullGalleryOpen(false)} />

               <div className="relative w-full max-w-6xl h-[85vh] z-50 shadow-2xl animate-fade-in">
                  <AssetBrowser
                     campaignId={campaignId}
                     onClose={() => setIsFullGalleryOpen(false)}
                     onAssetUpdate={triggerAssetUpdate}
                  />
               </div>
            </div>
         )}
      </div>
   )
}

export default Campaign