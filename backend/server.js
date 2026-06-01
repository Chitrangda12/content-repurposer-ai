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
        : "LinkedIn, Twitter/X, Instagram";

    const prompt = `
You are an expert social media strategist and AI content repurposer.

Repurpose the given content ONLY for these selected platforms:
${selectedPlatforms}

Content:
${content}

Tone: ${tone || "Professional"}
Length preference: ${length || "Medium"}

STRICT RULES:
1. Return ONLY valid JSON.
2. Do NOT add markdown.
3. Do NOT add explanation.
4. Twitter/X content must go ONLY inside "twitter".
5. Threads content must go ONLY inside "threads".
6. If a platform is not selected, return an empty string or empty array for it.
7. Always include all keys exactly as shown below.

Return JSON in this exact structure:

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

Generate:
- LinkedIn: 1 polished post
- Twitter/X: 5 tweets
- Instagram: 1 caption
- Threads: 3 short conversational posts
- Hooks: 3 viral hooks
- Hashtags: 8 hashtags
- Scores: numbers between 0 and 100
- Suggestions: 3 improvement suggestions
`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.7,
    });

    let aiResponse = completion.choices[0].message.content.trim();

    aiResponse = aiResponse.replace(/```json/g, "").replace(/```/g, "").trim();

    const parsedResponse = JSON.parse(aiResponse);

    res.json({
      success: true,
      data: parsedResponse,
    });
  } catch (error) {
    console.log("ERROR:", error.message);

    res.status(500).json({
      success: false,
      message: "AI generation failed. Please try again.",
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});