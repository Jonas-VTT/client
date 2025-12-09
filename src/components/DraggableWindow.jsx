import { useState } from 'react'
import { Rnd } from 'react-rnd'
import { FaTimes } from 'react-icons/fa'

const DraggableWindow = ({ title, onClose, children, initialPos = { x: 50, y: 50 }, initialSize = { width: 900, height: 700 }, zIndex = 50, onFocus }) => {
   const [isMinimized, setIsMinimized] = useState(false)
   const [currentSize, setCurrentSize] = useState(initialSize)
   const [currentPos, setCurrentPos] = useState(initialPos)
   const [savedPos, setSavedPos] = useState(null)

   const toggleMinimize = () => {
      const posToSave = currentPos

      if (savedPos) {
         setCurrentPos(savedPos)
      }

      setSavedPos(posToSave)
      setIsMinimized(!isMinimized)
   }

   return (
      <Rnd
         default={{
            x: initialPos.x,
            y: initialPos.y,
            width: initialSize.width,
            height: initialSize.height,
         }}

         size={isMinimized ? { width: 'auto', height: 'auto' } : currentSize}
         position={currentPos}

         onDragStop={(e, d) => {
            setCurrentPos({ x: d.x, y: d.y })
         }}

         onResizeStop={(e, direction, ref, delta, position) => {
            setCurrentSize({
               width: ref.style.width,
               height: ref.style.height,
            })
            setCurrentPos(position)
         }}

         minWidth={isMinimized ? 100 : 300}
         minHeight={isMinimized ? 40 : 200}

         bounds="parent"
         dragHandleClassName="window-header"
         enableResizing={!isMinimized}
         onMouseDown={onFocus}
         className={`bg-gray-900 flex flex-col overflow-hidden border border-gray-600 rounded z-50
         ${isMinimized
               ? 'bg-black/60 border-2 border-dotted border-white/40 opacity-70 backdrop-blur-sm'
               : 'bg-[#121214] border border-gray-600 shadow-2xl'
            }`}
         style={{
            zIndex: zIndex,
            width: isMinimized ? 'fit-content' : undefined,
            height: isMinimized ? 'fit-content' : undefined
         }}
      >
         <div
            onDoubleClick={toggleMinimize}
            className={`window-header bg-gray-800 h-10 flex justify-between items-center select-none p-2 rounded-t border-b border-gray-700 shrink-0 cursor-move
               ${isMinimized ? 'bg-transparent' : 'bg-white/5 border-b border-gray-700'}
            `}
         >
            <span className='text-sm text-gray-200 font-bold truncate pr-2'>{title}</span>
            <div className='flex items-center gap-2'>
               <button
                  onClick={onClose}
                  onMouseDown={(e) => e.stopPropagation()}
                  className='text-gray-400 font-bold px-1 hover:text-gray-300'
               >
                  <FaTimes />
               </button>
            </div>
         </div>

         {!isMinimized && (
            <div className='relative h-full text-white flex-1 overflow-hidden pb-10 custom-scrollbar'>{children}</div>
         )}
      </Rnd>
   )
}

export default DraggableWindow