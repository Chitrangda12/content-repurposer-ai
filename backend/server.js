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
  res.send("Content Repurposer Backend is running");
});

app.post("/generate", async (req, res) => {
  try {
    const { content, tone } = req.body;

    if (!content || content.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Content is required",
      });
    }

    const prompt = `
You are an expert social media content strategist.

Convert the given content into platform-specific social media content.

Tone: ${tone || "Professional"}

Content:
${content}

Return ONLY valid JSON in this exact format. Do not add markdown or extra explanation.

{
  "linkedin": "A professional LinkedIn post",
  "twitter": [
    "Tweet 1",
    "Tweet 2",
    "Tweet 3",
    "Tweet 4",
    "Tweet 5"
  ],
  "instagram": "Instagram caption",
  "hashtags": ["#tag1", "#tag2", "#tag3", "#tag4", "#tag5", "#tag6", "#tag7", "#tag8"]
}
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