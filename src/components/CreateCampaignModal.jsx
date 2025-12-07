import { useState } from 'react'
import api from '../config/api'

const CreateCampaignModal = ({ onClose, onCreated }) => {
   const [formData, setFormData] = useState({
      title: '',
      system: '',
      proceduralMapEnabled: false,
      proceduralMapType: ''
   })
   const [loading, setLoading] = useState(false)
   const [error, setError] = useState('')

   const handleSubmit = async (e) => {
      e.preventDefault()
      setLoading(true)
      setError('')

      try {
         const payload = {
            title: formData.title,
            system: formData.system,
            features: {

               proceduralMap: {
                  enabled: formData.proceduralMapEnabled,
                  config: {
                     theme: formData.proceduralMapEnabled ? formData.proceduralMapType : null
                  }
               }
            }
         }
         await api.post('/campaigns', payload)
         
         onCreated()
         onClose()
      }
      catch (error) {
         setError(error.response?.data?.message || 'Erro ao criar a campanha')
         console.error(error.response?.data?.message || 'Erro ao criar a campanha')
      }
      finally {
         setLoading(false)
      }
   }

   return (
      <div className='fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-5'>
         <div className='relative bg-gray-900 w-full max-w-md p-6 border border-gray-600/60 rounded-lg'>
            <button
               onClick={onClose}
               className='absolute top-4 right-4 text-gray-400 hover:text-white cursor-pointer'>
               x
            </button>

            <p className='text-2xl font-bold text-gray-500 mb-6 uppercase tracking-wider'>Nova Campanha</p>
            {error && <p className="bg-gray-900/20 text-gray-500 text-sm mb-4 p-2 rounded border border-gray-800">{error}</p>}

            <form
               onSubmit={handleSubmit}
               className='space-y-4'
            >
               <div>
                  <label className='block text-sm text-gray-400 mb-1'>Nome da Campanha</label>
                  <input
                     type="text"
                     placeholder="Ex: Operação Carga Viva"
                     onChange={e => setFormData({ ...formData, title: e.target.value })}
                     value={formData.title}
                     required
                     className='bg-gray-800 w-full text-white p-2 border border-gray-700 rounded outline-none focus:border-gray-500'
                  />
               </div>

               <div>
                  <label className='block text-sm text-gray-400 mb-1'>Sistema</label>
                  <select
                     value={formData.system}
                     onChange={e => setFormData({ ...formData, system: e.target.value })}
                     className='bg-gray-800 w-full text-white p-2 border border-gray-700 rounded outline-none'
                  >
                     <option disabled selected value=''> -- Selecione um sistema -- </option>
                     <option value="Ordem Paranormal">Ordem Paranormal</option>
                     <option value="D&D 5e">D&D 5e (não funcional)</option>
                  </select>
               </div>

               <div className='bg-gray-900/20 p-4 border border-gray-700/30 rounded transition-all hover:border-gray-500/50 group'>
                  <p className='text-2xl text-center font-bold uppercase'>Extras</p>
                  <div className='flex justify-between mt-5'>
                     <div>
                        <p className='text-sm text-gray-200 font-bold'>Modo Procedural</p>
                        <p className='text-xs text-gray-400 mt-1'>Gera mapas infinitos automaticamente</p>
                     </div>
                     <label className='relative inline-flex items-center cursor-pointer'>
                        <input
                           type="checkbox"
                           name='proceduralMap'
                           checked={formData.proceduralMapEnabled}
                           onChange={e => setFormData({ ...formData, proceduralMapEnabled: e.target.checked })}
                           className='sr-only peer'
                        />
                        <div className="peer w-11 h-6 bg-gray-700 rounded-full
                        peer-focus:outline-none peer-checked:after:translate-x-full peer-checked:after:border-white 
                        after:content-[''] after:absolute after:top-2.5 after:left-0.5 after:bg-white after:border-gray-300 
                        after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gray-400"></div>
                     </label>
                  </div>
                  {formData.proceduralMapEnabled && (
                     <select
                        value={formData.proceduralMapType}
                        onChange={e => setFormData({ ...formData, proceduralMapType: e.target.value })}
                        className='bg-gray-900 w-full text-white font-bold px-3 py-3 mt-2 border rounded-2xl transition-all hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed'
                     >
                        <option value="backrooms">Backrooms (liminal)</option>
                     </select>
                  )}
               </div>

               <button
                  type="submit"
                  disabled={loading}
                  className='bg-gray-600 w-full text-black font-bold py-3 mt-2 rounded transition-all hover:bg-gray-500 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed'
               >
                  {loading ? 'Criando Campanha...' : 'CRIAR CAMPANHA'}
               </button>
            </form>
         </div>
      </div>
   )
}

export default CreateCampaignModal