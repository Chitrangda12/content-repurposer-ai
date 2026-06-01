const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const Groq = require("groq-sdk");

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

app.get("/", (req, res) => {
  res.send("ContentCrafter AI Backend is running");
});

app.post("/generate", async (req, res) => {
  try {
    const { content, tone, length, platforms } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const selectedPlatforms =
      platforms && platforms.length > 0
        ? platforms.join(", ")
        : "LinkedIn, Twitter/X, Instagram, Threads";

    const prompt = `
You are an AI content repurposer.

Convert the given content into social media content.

Content:
${content}

Tone: ${tone || "Professional"}
Length: ${length || "Medium"}
Selected platforms: ${selectedPlatforms}

Return ONLY valid JSON.
Do not use markdown.
Do not use trailing commas.
Do not return objects inside arrays.
All array values must be strings only.

Use exactly this JSON structure:

{
  "linkedin": "",
  "twitter": [],
  "instagram": "",
  "threads": [],
  "hooks": [],
  "hashtags": [],
  "scores": {
    "readability": 0,
    "engagement": 0,
    "virality": 0
  },
  "suggestions": []
}
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.4,
    });

    let aiResponse = completion.choices[0].message.content.trim();

    aiResponse = aiResponse
      .replace(/```json/g, "")
      .replace(/```/g, "")
      .trim();

    const firstBrace = aiResponse.indexOf("{");
    const lastBrace = aiResponse.lastIndexOf("}");

    if (firstBrace !== -1 && lastBrace !== -1) {
      aiResponse = aiResponse.substring(firstBrace, lastBrace + 1);
    }

    aiResponse = aiResponse.replace(/,\s*([}\]])/g, "$1");

    let parsedResponse;

    try {
      parsedResponse = JSON.parse(aiResponse);
    } catch (parseError) {
      console.log("JSON PARSE ERROR:", parseError.message);
      console.log("RAW AI RESPONSE:", aiResponse);

      return res.status(500).json({
        success: false,
        message: "AI returned invalid JSON. Please try again.",
      });
    }

    const makeString = (value) => {
      if (!value) return "";
      if (typeof value === "string") return value;
      if (Array.isArray(value)) return value.map(makeString).join("\n");
      if (typeof value === "object") {
        return (
          value.text ||
          value.title ||
          value.description ||
          value.caption ||
          value.content ||
          JSON.stringify(value)
        );
      }
      return String(value);
    };

    const makeArray = (value) => {
      if (!value) return [];
      if (Array.isArray(value)) return value.map(makeString);
      return [makeString(value)];
    };

    const safeResponse = {
      linkedin: makeString(parsedResponse.linkedin),
      twitter: makeArray(parsedResponse.twitter),
      instagram: makeString(parsedResponse.instagram),
      threads: makeArray(parsedResponse.threads),
      hooks: makeArray(parsedResponse.hooks),
      hashtags: makeArray(parsedResponse.hashtags),
      scores: {
        readability: Number(parsedResponse.scores?.readability) || 0,
        engagement: Number(parsedResponse.scores?.engagement) || 0,
        virality: Number(parsedResponse.scores?.virality) || 0,
      },
      suggestions: makeArray(parsedResponse.suggestions),
    };

    res.json({
      success: true,
      data: safeResponse,
    });
  } catch (error) {
    console.log("ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});