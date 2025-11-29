import { BrowserRouter, Routes, Route } from "react-router-dom"

import PrivateRoute from "./routes/PrivateRoute"

import Login from "./routes/Login"
import Register from "./routes/Register"
import Main from './routes/Main'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />}/>
        <Route path="/registro" element={<Register />}/>

        <Route path="/main" element={<PrivateRoute> <Main/> </PrivateRoute>}/>
      </Routes>
    </BrowserRouter>
  )
}

export default App