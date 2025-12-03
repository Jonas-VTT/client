import { BrowserRouter, Routes, Route } from "react-router-dom"

import PrivateRoute from "./routes/PrivateRoute"
import { AuthProvider } from "./context/authContext"

import Login from "./routes/Login"
import Register from "./routes/Register"
import Home from './routes/Home'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />}/>
          <Route path="/registro" element={<Register />}/>

          <Route path="/home" element={<PrivateRoute> <Home/> </PrivateRoute>}/>
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App