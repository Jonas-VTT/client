import React from 'react'
import DraggableWindow from './DraggableWindow'

const DebugMonitor = ({ data = {}, onClose }) => {   
   const renderValue = (value) => {
      const type = typeof value

      if (value === null) return <span className="text-gray-500 italic">null</span>
      if (value === undefined) return <span className="text-gray-500 italic">undefined</span>
      
      if (type === 'boolean') {
         return value ? <span className="text-green-400 font-bold">TRUE</span> : <span className="text-red-400 font-bold">FALSE</span>
      }
      
      if (type === 'number') {
         return <span className="text-blue-300 font-mono">{value}</span>
      }
      
      if (type === 'string') {
         return <span className="text-yellow-200">"{value}"</span>
      }

      if (type === 'function') {
         return <span className="text-purple-400 italic">f() {value.name || 'anonymous'}</span>
      }

      if (Array.isArray(value)) {
         return (
            <div className="ml-4 border-l border-gray-700 pl-2">
               <span className="text-gray-400 text-xs">Array [{value.length}]</span>
               {value.length === 0 ? <span className="text-gray-600"> []</span> : (
                  <div className="flex flex-col gap-1 mt-1">
                     {value.map((item, i) => (
                        <div key={i} className="text-xs">
                           <span className="text-gray-500 mr-2">[{i}]</span>
                           {renderValue(item)}
                        </div>
                     ))}
                  </div>
               )}
            </div>
         )
      }

      if (type === 'object') {
         // Evita recursão infinita se tiver referência circular (básico)
         if (Object.keys(value).length === 0) return <span className="text-gray-600">{"{}"}</span>
         
         return (
            <div className="ml-4 border-l border-indigo-900/50 pl-2 mt-1">
               {Object.entries(value).map(([k, v]) => (
                  <div key={k} className="mb-1">
                     <span className="text-indigo-300 font-bold text-xs">{k}: </span>
                     {renderValue(v)}
                  </div>
               ))}
            </div>
         )
      }

      return <span>{String(value)}</span>
   }

   return (
      <DraggableWindow 
         title="🔍 Fluxo de Dados (Debug)" 
         onClose={onClose}
         initialPos={{ x: window.innerWidth - 450, y: 50 }}
         initialSize={{ width: 400, height: 600 }}
         zIndex={9999}
      >
         <div className="p-4 bg-[#09090a] min-h-full font-mono text-sm">
            <div className="text-xs text-gray-500 mb-4 border-b border-gray-800 pb-2">
               Monitorando {Object.keys(data).length} variáveis em tempo real.
            </div>

            <div className="flex flex-col gap-3">
               {Object.entries(data).map(([key, value]) => (
                  <div key={key} className="group hover:bg-white/5 p-2 rounded transition-colors border border-transparent hover:border-gray-700">
                     <div className="flex justify-between items-start mb-1">
                        <span className="text-white font-bold bg-gray-800 px-1 rounded text-xs select-all">
                           {key}
                        </span>
                        <span className="text-[10px] text-gray-600 uppercase font-bold">
                           {Array.isArray(value) ? 'array' : typeof value}
                        </span>
                     </div>
                     <div className="break-all whitespace-pre-wrap">
                        {renderValue(value)}
                     </div>
                  </div>
               ))}
            </div>
         </div>
      </DraggableWindow>
   )
}

export default DebugMonitor