import { createContext, useState, useEffect, useContext } from 'react'
import { jwtDecode } from 'jwt-decode'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
   const [user, setUser] = useState(null)
   const [loading, setLoading] = useState(true)

   const loginUser = (token) => {
      localStorage.setItem('token', token)
      const decoded = jwtDecode(token)

      setUser({
         id: decoded.id,
         role: decoded.role,
         username: decoded.username,
         email: decoded.email
      })
   }

   const logoutUser = () => {
      localStorage.removeItem('token')
      setUser(null)
   }

   useEffect(() => {
      const token = localStorage.getItem('token')

      if (token) {
         try {
            const decoded = jwtDecode(token)

            if (decoded.exp * 1000 < Date.now()) {
               logoutUser()
            }
            else {
               setUser({
                  id: decoded.id,
                  role: decoded.role,
                  username: decoded.username,
                  email: decoded.email
               })
            }
         }
         catch (error) {
            logoutUser()
         }
      }

      setLoading(false)
   }, [])

   return (
      <AuthContext.Provider value={{ user, loginUser, logoutUser, loading }}>
         {children}
      </AuthContext.Provider>
   )
}

export const useAuth = () => {
   return useContext(AuthContext)
}