import { createContext, useState, useContext, useMemo } from 'react'
import { AuthContext } from './authContext'

export const CampaignContext = createContext({})

export const CampaignProvider = ({ children }) => {
    const { user } = useContext(AuthContext)
    
    const [socket, setSocket] = useState(null)
    const [activeCampaign, setActiveCampaign] = useState(null)
    const [activeScene, setActiveScene] = useState(null)

    const isMaster = useMemo(() => {
        if (!user || !activeCampaign) return false
        
        return activeCampaign.master?._id === user.id
    }, [user, activeCampaign])

    const value = useMemo(() => ({
        activeCampaign, setActiveCampaign,
        activeScene, setActiveScene,
        socket, setSocket,
        isMaster
    }), [activeCampaign, activeScene, socket, isMaster])


    return (
        <CampaignContext.Provider value={value}>
            {children}
        </CampaignContext.Provider>
    )
}

export const useCampaign = () => {
    return useContext(CampaignContext)
}