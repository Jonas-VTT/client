import { useState, useEffect } from 'react'
import api from '../../config/api'

const DocumentEditor = ({ data, onUpdate }) => {
   const [content, setContent] = useState(data.content || '')
   const [saving, setSaving] = useState(false)

   // Auto-Save: Salva 1 segundo após parar de digitar
   useEffect(() => {
      const timer = setTimeout(async () => {
         if (content !== (data.content || '')) {
            setSaving(true)
            try {
               const { data: updated } = await api.put(`/characters/${data._id}`, { content })
               onUpdate(updated)
            } catch (err) { console.error(err) }
            finally { setSaving(false) }
         }
      }, 1000)
      return () => clearTimeout(timer)
   }, [content, data._id]) // Dependências ajustadas

   return (
      <div className="h-full flex flex-col bg-[#1e1e24] text-white overflow-hidden">
         <div className="p-2 bg-black/20 text-xs text-gray-500 flex justify-between shrink-0">
            <span>Editando: {data.name}</span>
            <span className={saving ? "text-yellow-500" : "text-green-500"}>
               {saving ? 'Salvando...' : 'Salvo'}
            </span>
         </div>
         <textarea
            className="flex-1 bg-transparent p-4 outline-none resize-none text-sm font-mono leading-relaxed custom-scrollbar"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva aqui o conteúdo do documento..."
            spellCheck={false}
         />
      </div>
   )
}

export default DocumentEditor