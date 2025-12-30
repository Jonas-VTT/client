import { useState, useMemo } from 'react'
import {
   FaFolder, FaFolderOpen, FaSearch, FaPlus, FaTrash, FaExclamationTriangle,
   FaUser, FaUserSecret, FaScroll, FaDungeon, FaChevronRight
} from 'react-icons/fa'

const TYPE_ICONS = {
   folder: <FaFolder className="text-yellow-500" />,
   pc: <FaUser className="text-green-400" />,
   npc: <FaUserSecret className="text-red-400" />,
   doc: <FaScroll className="text-blue-300" />,
   structure: <FaDungeon className="text-gray-400" />
}
const TYPE_LABELS = {
   pc: 'Personagens (PC)',
   npc: 'NPCs',
   doc: 'Documentos',
   structure: 'Estruturas'
}

const LibraryTab = ({ items = [], folders = [], onCreate, onOpen, onMove, onDelete, isMaster, user }) => {
   const [currentFolder, setCurrentFolder] = useState(null)
   const [searchTerm, setSearchTerm] = useState('')
   const [activeFilters, setActiveFilters] = useState(['pc', 'npc', 'doc', 'structure'])
   const [isGrouped, setIsGrouped] = useState(false)
   const [showCreateMenu, setShowCreateMenu] = useState(false)
   const [dragTarget, setDragTarget] = useState(null)
   const [contextMenu, setContextMenu] = useState(null)
   const [itemToDelete, setItemToDelete] = useState(null)

   const getBreadcrumbs = () => {
      let path = []
      let curr = folders.find(f => f._id === currentFolder)
      while (curr) {
         path.unshift(curr)
         curr = folders.find(f => f._id === curr.parent)
      }
      return path
   }
   const visibleItems = useMemo(() => {
      const localFolders = folders.filter(f => f.parent === currentFolder)
      const userId = user.id

      const localFiles = items.filter(i => {
         const matchesLocation = searchTerm
            ? i.name.toLowerCase().includes(searchTerm.toLowerCase())
            : i.folder === currentFolder

         if (!matchesLocation) return false

         if (isMaster) return true

         const itemOwnerId = i.owner?._id || i.owner
         const isOwner = itemOwnerId === userId

         const isShared = i.sharedWith?.some(member => {
            const memberId = member._id || member
            return memberId === userId
         })

         return isOwner || isShared
      })
      console.log(localFiles)

      const filteredFiles = localFiles.filter(i => activeFilters.includes(i.type))

      if (searchTerm) return { folders: [], files: filteredFiles }
      return { folders: localFolders, files: filteredFiles }
   }, [items, folders, currentFolder, activeFilters, searchTerm])

   const handleDragStart = (e, item, type) => {
      e.dataTransfer.setData('moveId', item._id)
      e.dataTransfer.setData('moveType', type)

      if (type === 'file') {
         e.dataTransfer.setData('type', 'token')
         e.dataTransfer.setData('character', JSON.stringify(item))
      }
   }
   const handleDragOver = (e, folderId) => {
      e.preventDefault() // Necessário para permitir o Drop
      e.stopPropagation()
      if (dragTarget !== folderId) setDragTarget(folderId)
   }
   const handleDrop = (e, targetFolderId) => {
      e.preventDefault()
      e.stopPropagation()
      setDragTarget(null)

      const moveId = e.dataTransfer.getData('moveId')
      const moveType = e.dataTransfer.getData('moveType')

      if (moveId === targetFolderId) return

      if (moveId && onMove) {
         onMove(moveId, moveType, targetFolderId)
      }
   }
   const handleContextMenu = (e, item, isFolder) => {
      e.preventDefault()
      setContextMenu({
         x: e.pageX,
         y: e.pageY,
         item,
         isFolder
      })
   }
   const handleDeleteClick = () => {
      if (!contextMenu) return
      setItemToDelete(contextMenu)
      setContextMenu(null)
   }
   const confirmDelete = () => {
      if (itemToDelete && onDelete) {
         onDelete(itemToDelete.item._id, itemToDelete.isFolder ? 'folder' : 'file')
      }
      setItemToDelete(null)
   }

   const renderItemRow = (item, isFolder = false) => {
      return (
         <div
            key={item._id}
            onClick={() => isFolder ? setCurrentFolder(item._id) : onOpen(item)}
            draggable
            onContextMenu={(e) => handleContextMenu(e, item, isFolder)}
            onDragStart={(e) => handleDragStart(e, item, isFolder ? 'folder' : 'file')}
            onDragOver={(e) => isFolder ? handleDragOver(e, item._id) : null}
            onDragLeave={() => setDragTarget(null)}
            onDrop={(e) => isFolder ? handleDrop(e, item._id) : null}
            className={`
               group flex items-center justify-between p-2 rounded cursor-pointer border border-transparent transition-all
               ${isFolder ? 'h-10' : 'mb-1'}
               ${dragTarget === item._id ? 'bg-indigo-900/50 border-indigo-500' : (isFolder ? 'hover:bg-white/5' : 'hover:bg-gray-800 hover:border-gray-600')}
               /* Destaque visual quando o menu está aberto neste item */
               ${contextMenu?.item._id === item._id ? 'bg-indigo-500/20' : ''}
            `}
         >
            <div className="flex items-center gap-3 overflow-hidden">

               {/* --- ÍCONE / AVATAR (ESQUERDA) --- */}
               {isFolder ? (
                  // Se for pasta, ícone simples
                  <div className="text-xl pl-1">
                     {item._id === currentFolder ? <FaFolderOpen className="text-yellow-500" /> : <FaFolder className="text-yellow-600" />}
                  </div>
               ) : (
                  // Se for arquivo, A BOLINHA DO SCRIPT ANTIGO
                  <div className="bg-gray-700 w-10 h-10 overflow-hidden shrink-0 border border-gray-600 rounded-full flex items-center justify-center">
                     {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                     ) : (
                        // Se não tiver imagem, mostra o ícone do tipo centralizado
                        <div className="text-lg opacity-80">
                           {TYPE_ICONS[item.type]}
                        </div>
                     )}
                  </div>
               )}

               {/* Nome */}
               <span className={`text-sm truncate ${isFolder ? 'text-gray-400 group-hover:text-white' : 'text-gray-200 font-medium group-hover:text-gray-300'}`}>
                  {item.name}
               </span>
            </div>

            {/* --- INDICADOR DIREITO (TRANSPARENTE E CINZA) --- */}
            {isFolder ? (
               <FaChevronRight className="text-gray-600 text-xs mr-2" />
            ) : (
               <div className="opacity-10 text-xl text-gray-400 group-hover:opacity-30 transition-opacity mr-2 grayscale">
                  {TYPE_ICONS[item.type]}
               </div>
            )}
         </div>
      )
   }

   return (
      <div className="flex flex-col h-full bg-[#121214]">
         {/* HEADER: Filtros e Busca */}
         <div className="p-3 border-b border-gray-800 space-y-3">
            <div className="relative">
               <FaSearch className="absolute left-3 top-2.5 text-gray-500 text-xs" />
               <input
                  type="text"
                  placeholder="Buscar..."
                  className="w-full bg-black/50 border border-gray-700 rounded pl-8 pr-2 py-1.5 text-xs text-white focus:border-indigo-500 outline-none"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
               />
            </div>

            <div className="flex justify-between items-center">
               <div className="flex gap-1">
                  {['pc', 'npc', 'doc'].map(type => (
                     <button
                        key={type}
                        onClick={() => setActiveFilters(prev =>
                           prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
                        )}
                        className={`p-1.5 rounded text-xs border transition-all ${activeFilters.includes(type)
                           ? 'bg-gray-700 border-gray-500 text-white'
                           : 'bg-transparent border-gray-800 text-gray-600 hover:border-gray-600'
                           }`}
                        title={TYPE_LABELS[type]}
                     >
                        {TYPE_ICONS[type]}
                     </button>
                  ))}
               </div>

               <button
                  onClick={() => setIsGrouped(!isGrouped)}
                  className={`text-[10px] uppercase font-bold px-2 py-1 rounded border ${isGrouped ? 'bg-indigo-900/50 border-indigo-500 text-indigo-300' : 'border-gray-800 text-gray-500'}`}
               >
                  {isGrouped ? 'Agrupado' : 'Lista'}
               </button>
            </div>
         </div>

         {/* BREADCRUMBS */}
         {!searchTerm && (
            <div className="px-3 py-2 bg-black/20 text-xs flex items-center gap-1 text-gray-500 overflow-x-auto whitespace-nowrap scrollbar-hide">
               <span
                  onClick={() => setCurrentFolder(null)}
                  onDragOver={(e) => handleDragOver(e, null)}
                  onDrop={(e) => handleDrop(e, null)}
                  className={`cursor-pointer hover:text-white flex items-center gap-1 ${currentFolder === null ? 'text-white font-bold' : ''} ${dragTarget === null ? 'text-indigo-400 font-bold' : ''}`}
               >
                  Raiz
               </span>

               {getBreadcrumbs().map(folder => (
                  <div key={folder._id} className="flex items-center gap-1">
                     <FaChevronRight className="text-[8px]" />
                     <span
                        onClick={() => setCurrentFolder(folder._id)}
                        onDragOver={(e) => handleDragOver(e, folder._id)}
                        onDrop={(e) => handleDrop(e, folder._id)}
                        className={`cursor-pointer hover:text-white ${folder._id === currentFolder ? 'text-white font-bold' : ''} ${dragTarget === folder._id ? 'text-indigo-400 font-bold' : ''}`}
                     >
                        {folder.name}
                     </span>
                  </div>
               ))}
            </div>
         )}

         {/* LISTA DE ITENS */}
         <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {isGrouped && !searchTerm ? (
               <div className="space-y-4">
                  {visibleItems.folders.length > 0 && (
                     <div>
                        <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 pl-2 border-b border-gray-800 pb-1">Pastas</h4>
                        {visibleItems.folders.map(f => renderItemRow(f, true))}
                     </div>
                  )}
                  {['pc', 'npc', 'doc', 'structure'].map(type => {
                     const files = visibleItems.files.filter(f => f.type === type)
                     if (files.length === 0) return null
                     return (
                        <div key={type}>
                           <h4 className="text-[10px] text-gray-500 font-bold uppercase tracking-wider mb-1 pl-2 border-b border-gray-800 pb-1 flex items-center gap-2">
                              {TYPE_ICONS[type]} {TYPE_LABELS[type]}
                           </h4>
                           {files.map(f => renderItemRow(f, false))}
                        </div>
                     )
                  })}
               </div>
            ) : (
               <div className="space-y-1">
                  {visibleItems.folders.map(f => renderItemRow(f, true))}
                  {visibleItems.files.map(f => renderItemRow(f, false))}
                  {visibleItems.folders.length === 0 && visibleItems.files.length === 0 && (
                     <div className="text-center text-gray-600 py-10 text-xs italic">Pasta vazia.</div>
                  )}
               </div>
            )}
         </div>

         {/* --- MENU DE CONTEXTO FLUTUANTE --- */}
         {contextMenu && (
            <div
               className="fixed z-50 bg-[#1e1e24] border border-gray-700 rounded shadow-2xl py-1 w-40 animate-fade-in"
               style={{ top: contextMenu.y, left: contextMenu.x }}
               onClick={(e) => e.stopPropagation()}
            >
               <button
                  onClick={handleDeleteClick}
                  className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors"
               >
                  <FaTrash /> Deletar
               </button>
            </div>
         )}

         {/* --- MODAL DE CONFIRMAÇÃO --- */}
         {itemToDelete && (
            <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
               <div className="bg-[#1e1e24] border border-gray-700 p-6 rounded-lg shadow-2xl max-w-sm w-full">
                  <div className="flex items-center gap-3 text-yellow-500 mb-4">
                     <FaExclamationTriangle className="text-2xl" />
                     <h3 className="font-bold text-lg text-white">Tem certeza?</h3>
                  </div>

                  <p className="text-gray-400 text-sm mb-6">
                     Você vai deletar <span className="font-bold text-white">"{itemToDelete.item.name}"</span>.
                     {itemToDelete.isFolder && <span className="block mt-2 text-red-400 text-xs">Atenção: Isso apagará tudo dentro da pasta!</span>}
                  </p>

                  <div className="flex justify-end gap-3">
                     <button
                        onClick={() => setItemToDelete(null)}
                        className="px-4 py-2 text-gray-400 hover:text-white text-xs font-bold uppercase"
                     >
                        Cancelar
                     </button>
                     <button
                        onClick={confirmDelete}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-xs font-bold uppercase shadow-lg"
                     >
                        Deletar
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* FOOTER: Botão Criar */}
         <div className="w-full bottom-0 p-3 border-t border-gray-800 absolute z-20 mt-auto bg-[#121214]">
            {showCreateMenu && (
               // Mudei para bottom-14 para o menu abrir "para cima"
               <div className="absolute bottom-14 left-3 right-3 bg-gray-800 border border-gray-700 rounded-lg shadow-xl overflow-hidden animate-slide-up">
                  {[
                     { id: 'folder', label: 'Nova Pasta', icon: TYPE_ICONS.folder },
                     { id: 'pc', label: 'Novo Personagem', icon: TYPE_ICONS.pc },
                     { id: 'npc', label: 'Novo NPC', icon: TYPE_ICONS.npc },
                     { id: 'doc', label: 'Documento', icon: TYPE_ICONS.doc },
                  ].map(opt => (
                     <button
                        key={opt.id}
                        onClick={() => { onCreate(opt.id, currentFolder); setShowCreateMenu(false) }}
                        className="w-full text-left px-4 py-3 hover:bg-white/5 flex items-center gap-3 text-xs text-gray-300 transition-colors"
                     >
                        {opt.icon} {opt.label}
                     </button>
                  ))}
               </div>
            )}
            <button
               onClick={() => setShowCreateMenu(!showCreateMenu)}
               className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded flex items-center justify-center gap-2 text-xs font-bold uppercase transition-all shadow-lg"
            >
               <FaPlus /> Adicionar...
            </button>
         </div>
      </div>
   )
}

export default LibraryTab