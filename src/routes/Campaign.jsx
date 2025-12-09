import { useEffect, useState, useContext } from 'react'
import { useParams } from 'react-router-dom'
import { Stage, Layer, Rect, Text } from 'react-konva'
import api from '../config/api'
import { AuthContext } from '../context/authContext'

import DraggableWindow from '../components/DraggableWindow'
import SheetManager from '../components/sheets/SheetManager'

import { IoChatbubblesSharp } from "react-icons/io5"
import { FaBookQuran } from "react-icons/fa6"

const Campaign = () => {
   const { id: campaignId } = useParams()
   const { user } = useContext(AuthContext)

   const [loading, setLoading] = useState(true)
   const [activeTab, setActiveTab] = useState('chat')
   const [error, setError] = useState('')

   const [myCharacters, setMyCharacters] = useState([])
   const [openWindows, setOpenWindows] = useState([])
   const [topZIndex, setTopZIndex] = useState(100)

   const handleSheetUpdate = (updatedChar) => {
      setMyCharacters(prev => prev.map(c => c._id === updatedChar._id ? updatedChar : c))
      setOpenWindows(prev => prev.map(w =>
         w.id === updatedChar._id ? { ...w, data: updatedChar } : w
      ))
   }
   useEffect(() => {
      fetchMyCharacters()
   }, [campaignId])
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
   const handleSheetDelete = (deletedCharId) => {
      setMyCharacters(prev => prev.filter(char => char._id !== deletedCharId))
      setOpenWindows(prev => prev.filter(win => win.id !== deletedCharId))
   }

   return (
      <div className='relative bg-gray-950 w-screen h-screen flex overflow-hidden'>

         {/*MAPA (CANVAS)*/}
         <div className='absolute inset-0 z-0'>
            <Stage width={window.innerWidth} height={window.innerHeight}>
               <Layer>
                  <Rect x={0} y={0} width={window.innerWidth} height={window.innerHeight} fill="#18181b" />
                  <Text text="Área do Mapa (React-Konva)" x={50} y={50} fill="white" fontSize={24} />
               </Layer>
            </Stage>
         </div>

         {/*FERRAMENTAS*/}
         <div className="absolute w-full h-12 flex items-center justify-center gap-4 px-4 mt-5 z-40">
            <button className="text-3xl p-2 bg-gray-800/30 rounded transition-all cursor-pointer hover:bg-gray-700">👆</button>
            <button className="text-3xl p-2 bg-gray-800/30 rounded transition-all cursor-pointer hover:bg-gray-700">📏</button>
            <button className="text-3xl p-2 bg-gray-800/30 rounded transition-all cursor-pointer hover:bg-gray-700">✏️</button>
         </div>

         {/*SIDEBAR*/}
         <div className='absolute bg-black w-80 h-full flex flex-col text-white top-0 right-0 border-l border-gray-800 shadow-xl z-40'>
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
            </div>
         </div>

         {/*JANELAS FLUTUANTES*/}
         {openWindows.map((win) => (
            <DraggableWindow
               key={win.id}
               title={win.title}
               zIndex={win.zIndex}
               onClose={() => closeWindow(win.id)}
               onFocus={() => bringToFront(win.id)}
               initialPos={{ x: 100 + (openWindows.length * 20), y: 100 + (openWindows.length * 20) }}
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
      </div>
   )
}

export default Campaign