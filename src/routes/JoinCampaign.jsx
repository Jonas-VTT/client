import { useEffect, useState, useContext } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../config/api' // ajuste o caminho
import { AuthContext } from '../context/authContext'

const JoinCampaign = () => {
   const { code } = useParams()
   const navigate = useNavigate()
   const { user } = useContext(AuthContext)
   const [status, setStatus] = useState('Verificando convite...')

   useEffect(() => {
      // Se não estiver logado, manda pro login (guardando onde ele queria ir)
      if (!user) {
         // O ideal seria salvar o link no localStorage pra redirecionar depois do login
         localStorage.setItem('redirectAfterLogin', `/join/${code}`)
         navigate('/') // ou /login
         return
      }

      const join = async () => {
         try {
            const { data } = await api.post('/campaigns/join', { inviteCode: code })
            
            setStatus("Sucesso! Entrando na mesa...")
            
            // Espera 1 segundinho pra ele ler e redireciona pra campanha
            setTimeout(() => {
               navigate(`/campaign/${data.campaignId}`)
            }, 1000)

         } catch (error) {
            setStatus("Erro: " + (error.response?.data?.message || "Convite inválido."))
         }
      }
      join()
   }, [code, user, navigate])

   return (
      <div className="h-screen bg-[#121214] flex items-center justify-center text-white flex-col gap-4">
         <h2 className="text-2xl font-bold animate-pulse">🚀 Viajando para a Campanha...</h2>
         <p className="text-gray-400">{status}</p>
      </div>
   )
}

export default JoinCampaign