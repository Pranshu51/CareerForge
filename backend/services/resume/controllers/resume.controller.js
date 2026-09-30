// pdf  ---->  pdf Storage  ---> text ---> llm ---> agent ---> promt ---> data ---> save mongoDb ---> redis -->pdf delete ---> resume data ( score , missing skills , recommen.)

import redis from "../../../shared/redis/redis.js";
import { resumeAgent } from "../agents/resume.agent.js";
import extractText from "../config/pdf.js";
import Resume from "../models/resume.model.js";
import fs from "fs"

// uploaded PDF ko safely delete karta hai (file na ho to crash nahi hota)
const removeFile = (file) => {
    try {
        if (file && file.path && fs.existsSync(file.path)) {
            fs.unlinkSync(file.path)
        }
    } catch (err) {
        console.log("File delete error:", err.message)
    }
}

// LLM kabhi kabhi ```json ... ``` ya extra text laga deta hai, usse JSON nikalta hai
const parseAiJson = (text) => {
    const cleaned = String(text).replace(/```json|```/gi, "").trim()
    const start = cleaned.indexOf("{")
    const end = cleaned.lastIndexOf("}")

    if (start === -1 || end === -1) {
        throw new Error("AI did not return valid JSON: " + cleaned.slice(0, 200))
    }

    return JSON.parse(cleaned.slice(start, end + 1))
}


// Schema mein arrays [String] hain, lekin LLM kabhi objects bhej deta hai.
// Ye unko strings mein badal deta hai taaki Mongoose cast error na de.
const toStr = (v) => {
    if (v === null || v === undefined) return ""
    if (typeof v === "string") return v
    if (typeof v === "object") {
        return Object.values(v)
            .map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x)))
            .filter(Boolean)
            .join(" - ")
    }
    return String(v)
}

const toStrArray = (arr) => {
    if (!Array.isArray(arr)) return arr ? [toStr(arr)] : []
    return arr.map(toStr).filter(Boolean)
}

const normalizeResumeData = (d = {}) => ({
    name: toStr(d.name),
    email: toStr(d.email),
    phone: toStr(d.phone),
    summary: toStr(d.summary),
    suggestedRole: toStr(d.suggestedRole),
    score: Number(d.score) || 0,
    skills: toStrArray(d.skills),
    projects: toStrArray(d.projects),
    education: toStrArray(d.education),
    experience: toStrArray(d.experience),
    strengths: toStrArray(d.strengths),
    weaknesses: toStrArray(d.weaknesses),
    missingSkills: toStrArray(d.missingSkills),
    recommendations: toStrArray(d.recommendations),
})


export const uploadResume = async (req, res) => {
    // file ko try ke bahar rakha hai taaki catch mein bhi mil sake
    const file = req.file;

    try {
        if (!file) {
            return res.status(400).json({
                success: false,
                message: "Resume PDF is required"
            })
        }

        const userId = req.headers["x-user-id"];

        if (!userId) {
            removeFile(file)
            return res.status(400).json({
                success: false,
                message: "UserId is required"
            })
        }

        const resumeText = await extractText(file.path)

        const aiResponse = await resumeAgent(resumeText)

        const resumeData = normalizeResumeData(parseAiJson(aiResponse))

        let resume = await Resume.findOne({ userId })

        if (resume) {
            Object.assign(resume, {
                ...resumeData,
                extractedText: resumeText
            })
            await resume.save()
        } else {
            resume = await Resume.create({
                userId,
                extractedText: resumeText,
                ...resumeData
            })
        }

        await redis.set(`resume:${userId}`, JSON.stringify(resume));

        removeFile(file)

        return res.status(200).json({
            success: true,
            message: "Resume analyzed successfully",
            data: resume
        })

    } catch (error) {
        console.log("Resume upload error:", error)

        removeFile(file)

        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}


export const getResume = async (req, res) => {
    try {
        const userId = req.headers["x-user-id"];

        const cache = await redis.get(`resume:${userId}`)

        if (cache) {
            return res.status(200).json({
                success: true,
                source: "redis",
                data: JSON.parse(cache)
            })
        }

        const resume = await Resume.findOne({ userId })

        if (!resume) {
            return res.status(404).json({
                success: false,
                message: "resume not found"
            })
        }

        await redis.set(`resume:${userId}`, JSON.stringify(resume));

        return res.status(200).json({
            success: true,
            source: "mongoDb",
            data: resume
        })

    } catch (error) {
        console.log(error)
        return res.status(500).json({
            success: false,
            message: error.message,
        })
    }
}