import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../config/api'

const Register = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
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
      const data = await api.post('/auth/register', formData)
      localStorage.setItem('token', data.token)
      localStorage.setItem('user', JSON.stringify(data))
      navigate('/home')
    } catch (err) {
      setError(err.response?.data?.message || 'Erro ao registrar')
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="bg-gray-900 border border-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-gray-500 mb-6 text-center tracking-widest uppercase">
          Nova Credencial
        </h2>

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-200 p-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Nome de Agente</label>
            <input
              type="text"
              name="username"
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Email</label>
            <input
              type="email"
              name="email"
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-gray-500"
              required
            />
          </div>
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Senha</label>
            <input
              type="password"
              name="password"
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 text-white p-3 rounded focus:outline-none focus:border-gray-500"
              required
            />
          </div>

          <button type="submit" className="w-full bg-gray-300 hover:bg-gray-400 text-black font-bold py-3 rounded mt-4 
          cursor-pointer transition-all">
            CRIAR REGISTRO
          </button>
        </form>

        <p className="mt-6 text-center text-gray-500 text-sm">
          Já possui acesso?{' '}
          <Link to="/" className="text-gray-500 hover:text-gray-400 font-bold">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Register