import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./configs/db.js"
import billingRouter from "./routes/billing.route.js"
import dns from "dns"
dns.setServers(["1.1.1.1", "8.8.8.8"])

dotenv.config()

const app = express()
app.use(express.json())

const PORT = process.env.PORT || 6005

app.get("/",(req,res)=>{
    res.send("Hello from Billing-service")
})

app.use("/",billingRouter)

app.listen(PORT , ()=>{
    console.log(`Billing-service Started on ${PORT}`)
    connectDB()
    
})