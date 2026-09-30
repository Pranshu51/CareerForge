import api from "../utils/axios"

export const getCurrentUser = async () => {
    try {
        const response = await api.get("/api/me")
        return response.data
    } catch (error) {
        
        return null
    }
}

export const useCoins = async (data)=>{
    try {
        const response = await api.post("/api/auth/use-coins" , data)
        console.log(response.data)
        return response.data
    } catch (error) {
        console.log(error)
        
        throw error;
    }
}