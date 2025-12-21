const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({
  model: "gemini-2.5-flash-lite",
  generationConfig: {
    temperature: 0.5,
    topK: 20,
    topP: 0.8,
    maxOutputTokens: 512,
    responseMimeType: "application/json",
  },
});

module.exports = { genAI, model };
