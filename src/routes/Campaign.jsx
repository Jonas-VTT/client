import { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import api from '../config/api'
import { io } from 'socket.io-client'
import { AuthContext } from '../context/authContext'

import DraggableWindow from '../components/DraggableWindow'
import SheetManager from '../components/sheets/SheetManager'
import SceneManager from '../components/scenes/SceneManager'
import GameStage from '../components/scenes/GameStage'

import { IoChatbubblesSharp } from "react-icons/io5"
import { FaBookQuran, FaImages } from "react-icons/fa6"
import { FaCog, FaCopy, FaSync, FaUserPlus, FaChevronLeft, FaChevronRight } from "react-icons/fa"

const Campaign = () => {
   const [socket, setSocket] = useState(null)
   const { id: campaignId } = useParams()
   const { user } = useContext(AuthContext)
   const [campaign, setCampaign] = useState(null)
   const mestreId = (campaign?.mestre?._id || campaign?.mestre)?.toString()
   const userId = (user?._id || user?.id)?.toString()
   const isMaster = mestreId && userId && mestreId === userId

   const [loading, setLoading] = useState(true)
   const [error, setError] = useState('')
   const [activeTab, setActiveTab] = useState('chat')
   const [activeTool, setActiveTool] = useState('select')
   const [isSidebarOpen, setIsSidebarOpen] = useState(true)

   const [myCharacters, setMyCharacters] = useState([])
   const [openWindows, setOpenWindows] = useState([])
   const [topZIndex, setTopZIndex] = useState(100)
   const [inviteCode, setInviteCode] = useState('')

   const [isSceneManagerOpen, setIsSceneManagerOpen] = useState(false)
   const sceneType = campaign?.activeScene?.type

   useEffect(() => {
      setActiveTool('select')
   }, [campaign?.activeScene?._id])
   useEffect(() => {
      const newSocket = io('http://localhost:3000')
      setSocket(newSocket)

      newSocket.emit('join_campaign', campaignId)
      newSocket.on('scene_updated', (newScene) => {
         setCampaign(prev => ({
            ...prev,
            activeScene: newScene
         }))
      })

      return () => {
         newSocket.disconnect()
      }
   }, [campaignId])
   useEffect(() => {
      fetchCampaign()
      fetchMyCharacters()
   }, [campaignId])

   const fetchCampaign = async () => {
      try {
         const { data } = await api.get(`/campaigns/${campaignId}`)
         setCampaign(data)
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

   const handleCreateCharacter = async () => {
      try {
         const { data: newChar } = await api.post('/characters', { campaignId })
         setMyCharacters([...myCharacters, newChar])
         openWindow(newChar)
      }
      catch (error) {
         setError('Erro ao criar personagem novo')
         console.error('Erro ao criar:', error)
      }
   }
   const handleSheetUpdate = (updatedChar) => {
      setMyCharacters(prev => prev.map(c => c._id === updatedChar._id ? updatedChar : c))
      setOpenWindows(prev => prev.map(w =>
         w.id === updatedChar._id ? { ...w, data: updatedChar } : w
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
      setCampaign(prev => ({
         ...prev,
         activeScene: updatedScene
      }))

      if (socket) {
         socket.emit('gm_change_scene', {
            campaignId,
            scene: updatedScene
         })
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

   const renderToolbar = () => {
      return (
         <div className="absolute top-0 left-0 w-full h-12 flex items-center justify-center gap-4 px-4 mt-5 z-40 pointer-events-none">
            <div className="flex gap-4 pointer-events-auto transition-all duration-300">

               {/* --- FERRAMENTAS DE MAPA */}
               {sceneType === 'map' && (
                  <>
                     <button
                        onClick={() => setActiveTool('select')}
                        title="Selecionar"
                        className={`text-xl p-3 rounded transition-all cursor-pointer shadow-lg border border-white/10 hover:scale-105
                           ${activeTool === 'select' ? 'bg-gray-600 text-white' : 'bg-gray-600/40 text-gray-400 hover:bg-gray-500/40'}
                        `}
                     >
                        👆
                     </button>

                     <button
                        onClick={() => setActiveTool('ruler')}
                        title="Régua (Medir Distância)"
                        className={`text-xl p-3 rounded transition-all cursor-pointer shadow-lg border border-white/10 hover:scale-105
                           ${activeTool === 'ruler' ? 'bg-gray-600 text-white' : 'bg-gray-600/40 text-gray-400 hover:bg-gray-500/40'}
                        `}
                     >
                        📏
                     </button>

                     <button
                        onClick={() => setActiveTool('draw')}
                        title="Desenhar"
                        className={`text-xl p-3 rounded transition-all cursor-pointer shadow-lg border border-white/10 hover:scale-105
                           ${activeTool === 'draw' ? 'bg-gray-600 text-white' : 'bg-gray-600/40 text-gray-400 hover:bg-gray-700/40'}
                        `}
                     >
                        ✏️
                     </button>
                  </>
               )}

               {/* --- FERRAMENTAS DE BACKGROUND --- */}
               {sceneType === 'background' && (
                  <></>
               )}

               {/* --- FERRAMENTAS DE CUTSCENE --- */}
               {sceneType === 'cutscene' && (
                  <></>
               )}

               {isMaster && sceneType === 'map' && (<div className='bg-white/20 w-px h-auto mx-2'></div>)}

               {/* --- CONTROLES DO MESTRE --- */}
               {isMaster && (
                  <>
                     <button
                        onClick={() => setIsSceneManagerOpen(true)}
                        title='Gerenciar Cenas'
                        className='bg-gray-600/40 text-xl text-white flex items-center justify-center p-3 px-4 border border-white/10 rounded transition-all cursor-pointer hover:bg-gray-500/40 hover:scale-105 shadow-lg animate-fade-in'
                     >
                        <FaImages />
                     </button>
                  </>
               )}
            </div>
         </div>
      )
   }

   return (
      <div className='relative bg-gray-950 w-screen h-screen flex overflow-hidden'>

         {/*MAPA (CANVAS)*/}
         <div className='absolute inset-0 z-0'>
            <GameStage
               socket={socket}
               user={user}
               campaignId={campaignId}
               activeScene={campaign?.activeScene}
               onSceneUpdate={handleSceneUpdate}
               onActivateScene={handleActivateScene}
               isMaster={isMaster}
               isSidebarOpen={isSidebarOpen}
            />
         </div>

         {/*FERRAMENTAS*/}
         <div className="w-full h-12 flex items-center justify-center gap-4 px-4 mt-5 z-40">
            {renderToolbar()}
         </div>

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

                  <div className='flex-1 overflow-y-auto p-4 custom-scrollbar'>
                     {activeTab === 'chat' && (
                        <div className="text-gray-500 text-center mt-10">
                           Chat desconectado.
                        </div>
                     )}

                     {activeTab === 'sheets' && (
                        <div className="flex flex-col gap-4">
                           <button
                              onClick={handleCreateCharacter}
                              className='w-full bg-gray-600 text-white font-bold py-2 rounded transition-all cursor-pointer hover:bg-gray-500'
                           >
                              + Novo Personagem
                           </button>

                           <div className='space-y-2'>
                              <p className='text-xs text-gray-500 font-bold uppercase tracking-wider'>Meus personagens</p>
                              {myCharacters.length === 0 && <p className="text-sm text-gray-600 italic">Nenhum personagem.</p>}

                              {myCharacters.map(char => (
                                 <div
                                    key={char._id}
                                    draggable="true"
                                    onDragStart={(e) => {
                                       e.dataTransfer.setData('type', 'token')
                                       e.dataTransfer.setData('character', JSON.stringify(char))
                                    }}
                                    onClick={() => openWindow(char)}
                                    className="bg-gray-800/50 flex items-center gap-3 p-2 border border-transparent rounded cursor-pointer transition-all hover:bg-gray-800 hover:border-gray-600 group"
                                 >
                                    <div className="bg-gray-700 w-10 h-10 overflow-hidden shrink-0 border border-gray-600 rounded-full ">
                                       {char.imageUrl ? (
                                          <img src={char.imageUrl} alt={char.name} className="w-full h-full object-cover" />
                                       ) : (
                                          <div className="w-full h-full text-gray-500 text-xs flex items-center justify-center">?</div>
                                       )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                       <p className="text-gray-200 font-medium truncate group-hover:text-gray-300">{char.name}</p>
                                    </div>
                                 </div>
                              ))}
                           </div>
                        </div>
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
               {win.type === 'sheet' && (
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

         {/*JANELA MANEJAMENTO DE CENAS*/}
         {isSceneManagerOpen && (
            <SceneManager
               campaignId={campaignId}
               onClose={() => setIsSceneManagerOpen(false)}
               onActivateScene={handleActivateScene}
            />
         )}
      </div>
   )
}

export default Campaign