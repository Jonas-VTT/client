import { navigate } from 'react-router-dom'

const PrivateRoute = ({ children }) => {
   const token = localStorage.getItem('token')
   console.log(token)
   
   if (!token) {
      return <navigate to='/' />
   }
   return children
}

export default PrivateRoute