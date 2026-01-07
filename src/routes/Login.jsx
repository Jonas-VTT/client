import { useState, useEffect, useContext } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/authContext'
import api from '../config/api'

const Login = () => {
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  
  const { loginUser } = useContext(AuthContext) 
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      navigate('/home')
    }
  }, [navigate])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      const { data } = await api.post('/auth/login', formData)
      
      loginUser(data.token)
      
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao conectar no servidor')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-500 mb-6 text-center tracking-widest uppercase">
          Acesso Restrito
        </h2>
        
        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded 
              focus:outline-none focus:border-gray-500 transition-colors"
              placeholder="agente@ordem.com"
              required
            />
          </div>

          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Senha</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded focus:outline-none 
              focus:border-gray-500 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 rounded 
            transition-all transform hover:scale-[1.02] cursor-pointer"
          >
            ENTRAR NO SISTEMA
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Ainda não tem credencial?{' '}
          <Link to="/registro" className="text-gray-500 hover:text-gray-400 font-bold">
            Registrar-se
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login