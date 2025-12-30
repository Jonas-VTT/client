// --- Core & Libs ---
import { useEffect, useState } from 'react'

// ---------------------------------------

// --- UI & Tools ---
import AssetTopBar from '../components/assets/AssetTopBar'

// ---------------------------------------

// --- Icons ---
import {
   FaMousePointer, FaRuler, FaPen, FaCrosshairs, FaFolderOpen,
   FaVideo, FaImages, FaLock, FaUnlock
} from 'react-icons/fa'
import { MdControlCamera } from "react-icons/md"

// ---------------------------------------

const TOOLS = [
   { id: 'select', label: 'Selecionar (V)', icon: <FaMousePointer />, shortcut: 'v', masterOnly: false },
   { id: 'ruler', label: 'Régua (M)', icon: <FaRuler />, shortcut: 'm', masterOnly: false },
   { id: 'draw', label: 'Desenhar (B)', icon: <FaPen />, shortcut: 'b', masterOnly: false },
   { id: 'ping', label: 'Ping (X)', icon: <FaCrosshairs />, shortcut: 'x', masterOnly: false },

   { divider: true },

   { id: 'director', label: 'Diretor (C)', icon: <FaVideo />, shortcut: 'c', masterOnly: true },
   { id: 'scenes', label: 'Cenas (S)', icon: <FaImages />, shortcut: 's', masterOnly: true, action: true },
   { id: 'gallery', label: 'Galeria (G)', icon: <FaFolderOpen />, shortcut: 'g', masterOnly: true },
]

// ---------------------------------------

const Toolbar = ({ 
   activeTool, onSelectTool, isMaster, campaignId, 
   activeLayer, setActiveLayer,
   onOpenScenes,onOpenFullGallery, isSyncing, onToggleSync,
   objectDrawing, setObjectDrawing,
   assetVersion
}) => {
   useEffect(() => {
      const handleKeyDown = (e) => {
         if (e.target.matches('input, textarea, [contenteditable]')) return

         const key = e.key.toLowerCase()

         if (key === 'l' && activeTool == 'director') {
            onToggleSync()
            return
         }

         const tool = TOOLS.find(t => t.shortcut === key)

         if (tool) {
            if (tool.masterOnly && !isMaster) return

            if (tool.action) {
               if (tool.id === 'scenes') onOpenScenes()
            }
            else {
               onSelectTool(tool.id)
            }
         }
      }

      window.addEventListener('keydown', handleKeyDown)
      return () => window.removeEventListener('keydown', handleKeyDown)
   }, [onSelectTool, isMaster, onOpenScenes, activeTool, onToggleSync])

   return (
      <>
         {/* FERRAMENTAS */}
         <div className="group absolute top-5 left-1/2 -translate-x-1/2 bg-[#18181b]/90 border border-white/10 rounded-full px-4 py-2 flex items-center gap-2 shadow-2xl
         backdrop-blur-md z-50 transition-all hover:border-white/30">
            {TOOLS.map((tool, index) => {
               if (tool.divider) return isMaster ? <div key={index} className="w-px h-6 bg-white/20 mx-1" /> : null
               if (tool.masterOnly && !isMaster) return null

               const isActive = activeTool === tool.id

               return (
                  <button
                     key={tool.id}
                     onClick={() => {
                        if (tool.action) {
                           if (tool.id === 'scenes') onOpenScenes()
                        }
                        else {
                           onSelectTool(tool.id)
                        }
                     }}
                     title={tool.label}
                     className={`
                        relative p-2.5 rounded-full text-lg transition-all duration-90 outline-none
                        ${isActive
                           ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110'
                           : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }
                        ${isActive && activeTool == 'draw' &&
                        'bg-red-600 shadow-none'
                        }
                     `}
                  >
                     {tool.icon}
                     <div className='absolute bg-gray-800/20 bottom-0 right-0 flex items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100'>
                        <span className='h-min leading-none text-gray-500 text-[10px] font-mono px-1.5 py-1'>
                           {tool.shortcut?.toUpperCase()}
                        </span>
                     </div>
                  </button>
               )
            })}
         </div >

         {/* FERRAMENTAS SECUNDÁRIAS */}
         {isMaster && activeTool === 'director' && (
            <div className="group absolute top-10 left-1/2 -translate-x-1/2 bg-[#18181b]/60 flex items-center gap-2 px-4 py-2 pt-12 border border-white/10 rounded-b-xl shadow-2xl
                           backdrop-blur-md z-40 transition-all hover:border-white/30">
               <button
                  onClick={onToggleSync}
                  title='Cinematic (L)'
                  className={`
                        relative p-2.5 rounded-full text-lg transition-all duration-90 outline-none
                        ${isSyncing
                        ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)] scale-110'
                        : 'text-gray-400 hover:text-white hover:bg-white/10'
                     }
                     `}
               >
                  <MdControlCamera />

                  <div className='absolute bg-gray-800/20 bottom-0 right-0 flex items-center justify-center rounded-full transition-all opacity-0 group-hover:opacity-100'>
                     <span className='h-min leading-none text-gray-500 text-[10px] font-mono px-1.5 py-1'>
                        L
                     </span>
                  </div>
               </button>
            </div>
         )}
         {isMaster && activeTool === 'gallery' && (
            <AssetTopBar
               campaignId={campaignId}
               onOpenFullGallery={onOpenFullGallery}
               objectDrawing={objectDrawing}
               setObjectDrawing={setObjectDrawing}
               assetVersion={assetVersion}
               activeLayer={activeLayer}
               setActiveLayer={setActiveLayer}
            />
         )}
      </>
   )
}

export default Toolbar