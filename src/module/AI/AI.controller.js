import fetch from "node-fetch"; // npm i node-fetch
import dotenv from "dotenv";
import { AppError } from "../../utils/AppError.js";
import { catchError } from "../../utils/catchError.js";

dotenv.config();
const GROQ_KEY = process.env.GROQ_API_KEY;
if (!GROQ_KEY) throw new Error("GROQ_API_KEY missing in .env");

// ------------------ Helper function ------------------
async function callGroqChat(prompt) {
  const response = await fetch("https://api.groq.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.0,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq API error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function callGroqAudio(fileName, fileBuffer) {
  const formData = new FormData();
  formData.append("model", "whisper-large-v3-turbo");
  formData.append("file", new Blob([fileBuffer]), fileName);

  const response = await fetch("https://api.groq.ai/v1/audio/transcriptions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_KEY}`,
    },
    body: formData,
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Groq Audio API error: ${response.status} - ${text}`);
  }

  const data = await response.json();
  return data.text;
}

// ------------------ Text Analysis ------------------
export const analyzeText = catchError(async (req, res, next) => {
  const { text } = req.body;
  if (!text) return next(new AppError("Text is required", 400));

  const prompt = `
حلل الجملة التالية من حيث البيانات المالية فقط.
ارجع JSON array بصيغة:
[
  {"amount": <number|null>, "category": "<food|transport|shopping|bills|other>", "place": "<optional>", "type": "<expense|income>"}
]
الجملة: "${text}"
`;

  try {
    const textOut = await callGroqChat(prompt);
    const start = textOut.indexOf("[");
    const end = textOut.lastIndexOf("]");
    const parsed = JSON.parse(textOut.substring(start, end + 1));

    res.status(200).json({ message: "Text analyzed successfully", text, analysis: parsed });
  } catch (err) {
    return next(new AppError("Text analysis failed: " + err.message, 500));
  }
});

// ------------------ Voice Analysis ------------------
export const analyzeVoice = catchError(async (req, res, next) => {
  if (!req.file || !req.file.buffer) return next(new AppError("Audio file is required", 400));

  try {
    // 1) Speech-to-text
    const text = await callGroqAudio(req.file.originalname || "audio.webm", req.file.buffer);

    // 2) Analyze extracted text
    const prompt = `
حلل الجملة التالية من حيث البيانات المالية فقط.
ارجع JSON array بصيغة:
[
  {"amount": <number|null>, "category": "<food|transport|shopping|bills|other>", "place": "<optional>", "type": "<expense|income>"}
]
الجملة: "${text}"
`;

    const textOut = await callGroqChat(prompt);
    const start = textOut.indexOf("[");
    const end = textOut.lastIndexOf("]");
    const parsed = JSON.parse(textOut.substring(start, end + 1));

    res.status(200).json({ message: "Voice analyzed successfully", text, analysis: parsed });
  } catch (err) {
    return next(new AppError("Voice analysis failed: " + err.message, 500));
  }
});
