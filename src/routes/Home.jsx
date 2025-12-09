import { useState, useEffect, useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/authContext'
import RequireRole from '../components/RequireRole'
import api from '../config/api'

import CreateCampaignModal from '../components/CreateCampaignModal'

const Home = () => {
   const [campaigns, setCampaigns] = useState([])
   const [showModal, setShowModal] = useState(false)

   const { user, logoutUser } = useContext(AuthContext)
   const navigate = useNavigate()

   useEffect(() => {
      fetchCampaigns()
   }, [])

   const fetchCampaigns = async () => {
      try {
         const { data } = await api.get('/campaigns')
         setCampaigns(data)
      }
      catch (error) {
         console.error('Erro ao buscar campanhas: ', error)
      }
   }

   //TEMPORÁRIO
   const handleLogout = () => {
      logoutUser()
      navigate('/')
   }
   const handleEnterCampaign = (campaignId) => {
      navigate(`/campaign/${campaignId}`)
   }

   return (
      <div className='min-h-screen bg-gray-950 text-white font-sans'>
         {/*NAVBAR TEMPORÁRIA*/}
         <nav className='bg-gray-900 flex justify-between py-4 px-4'>
            <p>JONAS VTT</p>
            <div className='flex items-center gap-4'>
               <span>{user?.username}</span>
               <span className="ml-2 px-2 py-1 bg-zinc-800 rounded text-xs uppercase">
                  {user?.role}
               </span>
               <button
                  onClick={handleLogout}
                  className='text-sm font-bold cursor-pointer'>
                  SAIR
               </button>
            </div>
         </nav>

         <main className='p-8 max-w-7xl mx-auto'>
            <div className='flex items-center gap-10 mb-8'>
               <p className='text-3xl font-bold text-white'>Campanhas</p>
               <RequireRole roles={['mestre', 'admin']}>
                  <button
                     onClick={() => setShowModal(true)}
                     className='bg-gray-600 text-black font-bold px-6 py-2 rounded transition-all hover:scale-105 hover:bg-gray-500'>
                     + NOVA CAMPANHA
                  </button>
               </RequireRole>
            </div>

            <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
               {campaigns.length == 0 ? (
                  <div className='col-span-full text-gray-500 text-center py-20 border-2 border-dashed border-gray-800 rounded'>Você não pertence a nenhuma campanha.</div>
               ) : (
                  campaigns.map((camp) => (
                     <div key={camp._id} className='bg-gray-900 p-6 border border-gray-800 rounded-lg transition-all hover:border-gray-600/50 cursor-pointer group'>
                        <div className='flex justify-between items-start mb-4'>
                           <p className='text-xl font-bold transition-all group-hover:text-gray-500'>{camp.title}</p>
                           {camp.features?.proceduralMap?.enabled && (
                              <span className="bg-gray-900/50 text-gray-500 text-xs px-2 py-1 rounded border border-gray-700/50">
                                 Mapa Procedural
                              </span>
                           )}
                        </div>

                        <p className='text-gray-400 text-sm mb-4'>Sistema: {camp.system}</p>

                        <div className='flex justify-between items-center mt-4 pt-4 border-t border-gray-800'>
                           <span className='text-xs text-gray-500'>Mestre: {user?._id == camp.mestre ? 'Você' : camp.mestre}</span>
                           <button 
                              onClick={() => handleEnterCampaign(camp._id)}
                              className='text-gray-600 font-bold text-sm hover:underline'>
                                 ENTRAR
                              </button>
                        </div>
                     </div>
                  ))
               )}
            </div>

         </main>

         {showModal && (
            <CreateCampaignModal
               onClose={() => setShowModal(false)}
               onCreated={fetchCampaigns}
            />
         )}
      </div>
   )
}

export default Home