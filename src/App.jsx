import { BrowserRouter, Routes, Route } from "react-router-dom"

import PrivateRoute from "./routes/PrivateRoute"
import { AuthProvider } from "./context/authContext"

import Login from "./routes/Login"
import Register from "./routes/Register"
import Home from './routes/Home'
import JoinCampaign from "./routes/JoinCampaign"
import Campaign from "./routes/Campaign"
import Teste from "./routes/Teste"

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/teste" element={<Teste />} />
          <Route path="/" element={<Login />} />
          
          <Route path="/registro" element={<Register />} />

          <Route path="/home" element={<PrivateRoute> <Home /> </PrivateRoute>} />
          <Route path="/join/:code" element={<JoinCampaign />} />
          <Route path="/campaign/:id" element={<PrivateRoute> <Campaign /> </PrivateRoute>} />

        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App