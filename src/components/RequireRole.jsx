import { useContext } from "react"
import { AuthContext } from "../context/authContext"

const RequireRole = ({ children, roles }) => {
   const { user } = useContext(AuthContext)

   if (!user || !roles.includes(user.role)) {
      return null
   }

   return children
}

export default RequireRole