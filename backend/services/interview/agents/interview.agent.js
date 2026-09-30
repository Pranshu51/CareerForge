import llm from "../config/llm.js"
import hrInterviewPrompt from "../prompts/hrInterviewPrompt.js"
import technicalInterviewPrompt from "../prompts/technicalInterviewPrompt.js"

export const interviewAgent = async (data) => {
    let response

    try {
        const prompt = data.type?.toLowerCase() === "hr"
            ? hrInterviewPrompt(data)
            : technicalInterviewPrompt(data)

        response = await llm.invoke(prompt)

        const cleaned = String(response.content)
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim()

        // AI kabhi extra text laga deta hai, isliye sirf [ ... ] wala hissa lete hain
        const start = cleaned.indexOf("[")
        const end = cleaned.lastIndexOf("]")
        const jsonText = start !== -1 && end !== -1
            ? cleaned.slice(start, end + 1)
            : cleaned

        const questions = JSON.parse(jsonText)

        if (!Array.isArray(questions) || questions.length === 0) {
            throw new Error("AI did not return a list of questions")
        }

        return questions
    } catch (error) {
        console.log("Interview Agent Error:", error.message)
        console.log("LLM raw output:", response?.content)

        throw new Error("Failed to generate interview questions: " + error.message)
    }
}