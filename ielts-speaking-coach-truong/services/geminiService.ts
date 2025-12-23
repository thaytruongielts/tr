import { GoogleGenerativeAI, Type } from "@google/generative-ai";
import { SYSTEM_INSTRUCTION } from "../constants";
import { Feedback } from "../types";

// Khởi tạo Google Generative AI với API Key từ biến môi trường
const genAI = new GoogleGenerativeAI(process.env.API_KEY || '');

export const getIELTSEvaluation = async (audioBase64: string, question: string): Promise<Feedback> => {
    const ai = genAI;

    const audioPart = {
        inlineData: {
            mimeType: "audio/webm", // Đảm bảo định dạng này khớp với MediaRecorder của bạn
            data: audioBase64
        }
    };

    const textPart = {
        text: `Question was: "${question}". Please evaluate my audio response.`
    };

    try {
        // Đã cập nhật sang model gemini-2.0-flash để đạt hiệu suất tốt nhất
        const model = ai.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_INSTRUCTION,
        });

        const response = await model.generateContent({
            contents: [{ parts: [audioPart, textPart] }],
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        const result = JSON.parse(response.response.text() || "{}");
        return result as Feedback;
    } catch (error) {
        console.error("Gemini Error:", error);
        throw new Error("Failed to process your speaking response. Please try again.");
    }
};

export const getSecondaryCorrection = async (previousFeedback: Feedback, newAudioBase64: string): Promise<Feedback> => {
    const ai = genAI;

    const audioPart = {
        inlineData: {
            mimeType: "audio/webm",
            data: newAudioBase64
        }
    };

    const textPart = {
        text: `I tried to repeat the 'Improved Version' you suggested: "${previousFeedback.improvedVersion}". How did I do? Compare my new audio with your suggestion and give me updated feedback.`
    };

    try {
        // Đã cập nhật sang model gemini-2.0-flash
        const model = ai.getGenerativeModel({
            model: "gemini-2.0-flash",
            systemInstruction: SYSTEM_INSTRUCTION,
        });

        const response = await model.generateContent({
            contents: [{ parts: [audioPart, textPart] }],
            generationConfig: {
                responseMimeType: "application/json",
            },
        });

        return JSON.parse(response.response.text() || "{}") as Feedback;
    } catch (error) {
        console.error("Gemini Error:", error);
        throw new Error("Failed to correct your practice attempt.");
    }
};
