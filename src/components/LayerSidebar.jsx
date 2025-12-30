import { 
   FaMap, FaCube, FaUserCircle, FaLayerGroup, FaEyeSlash 
} from 'react-icons/fa'

const LAYERS = [
   { id: 'map', label: 'Mapa & Chão', icon: <FaMap /> },
   { id: 'object', label: 'Objetos & Props', icon: <FaCube /> },
   { id: 'token', label: 'Tokens', icon: <FaUserCircle /> },
   { id: 'wall', label: 'Paredes', icon: <FaLayerGroup /> },
   { id: 'dm', label: 'Mestre (GM)', icon: <FaEyeSlash /> },
]

const LayerSidebar = ({ activeLayer, setActiveLayer }) => {
   return (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-40 animate-fade-in">
         <div className="bg-[#18181b]/90 backdrop-blur-md border border-white/10 p-2 rounded-full shadow-2xl flex flex-col gap-2">
            
            {LAYERS.map((layer) => {
               const isActive = activeLayer === layer.id
               
               return (
                  <button
                     key={layer.id}
                     onClick={() => setActiveLayer(layer.id)}
                     className={`
                        group relative w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200
                        ${isActive 
                           ? 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.6)] scale-110' 
                           : 'text-gray-400 hover:text-white hover:bg-white/10'
                        }
                     `}
                  >
                     {layer.icon}

                     {/* Tooltip Lateral */}
                     <div className="absolute left-full ml-3 bg-black/80 text-white text-[10px] font-bold uppercase px-2 py-1 rounded 
                        opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                        {layer.label}
                     </div>
                  </button>
               )
            })}

         </div>
      </div>
   )
}

export default LayerSidebar