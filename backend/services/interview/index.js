import express from "express"
import dotenv from "dotenv"
import { connectDB } from "./config/db.js"
import interviewRouter from "./routes/interview.route.js"
import dns from "dns"
dns.setServers(["1.1.1.1", "8.8.8.8"])
dotenv.config()

const app = express()

app.use(express.json())

const PORT = process.env.PORT || 6003

app.get("/" , (req,res)=>{
    res.send("Hello from Interview-service")
})


app.use("/",interviewRouter)


app.listen(PORT , ()=>{
    console.log(`Interview-service Started on ${PORT}`)
    connectDB()
})