const express = require("express");
const cors = require('cors');
const axios = require('axios'); // For making HTTP requests to DeepSeek API
// const openai = require('openai'); // Import OpenAI API
const app = express();
const { convertYouTubeAudioToText, convertAudioToText, extractContent, extractMediumContent, extractBlogContent, extractYouTubeTranscript, processWithAI, extractBlogContentTest, extractBlogContentSecret } = require("./extractor");


require('dotenv').config(); // Load .env file

// Enable CORS for all routes
app.use(cors());
app.use(express.json()); // Ensure JSON request bodies are parsed




const PORT = 3000;

// // Extract & process blog content with AI
// app.post('/process/blog', async (req, res) => {
//     try {
//         console.log("Received request:", req.body); // Log request payload

//         const { url, prompt } = req.body;

//         if (!url || !prompt) {
//             console.error("Missing URL or prompt");
//             return res.status(400).json({ error: "Missing URL or prompt" });
//         }

//         // Simulate AI processing or API call
//         console.log("Processing request for URL:", url);
//         console.log("Prompt:", prompt);

//         // If AI processing fails, throw an error
//         throw new Error("Simulated AI processing failure");

//         res.json({ success: true, message: "Processing started" });
//     } catch (error) {
//         console.error("Error processing request:", error.message);
//         res.status(500).json({ error: "Failed to process", details: error.message });
//     }
// });
app.use(express.json());  // Ensure JSON parsing middleware is added

// Extract & process YouTube transcript with AI
app.post("/process/youtube", async (req, res) => {
    const { url } = req.body;

    console.log("📥 Incoming request to /process/youtube");
    console.log("Received URL:", url);

    if (!url) {
        console.error("❌ Validation error: Missing YouTube URL");
        return res.status(400).json({ error: "YouTube URL is required" });
    }

    try {
        let content;

        console.log("🔍 Attempting to extract transcript...");

        try {
            content = await extractYouTubeTranscript(url);  // Primary method (transcript)
            console.log("✅ Transcript extracted successfully:", content ? content.slice(0, 100) + "..." : "No transcript found");

        } catch (error) {
            console.warn("⚠️ Transcript extraction failed:", error.message);

            console.log("🔁 Falling back to speech-to-text...");
            content = await convertYouTubeAudioToText(url);  // Fallback method (audio)

            console.log("✅ Audio transcription completed:", content ? content.slice(0, 100) + "..." : "No content extracted");
        }

        if (!content) {
            throw new Error("No content available from transcript or audio");
        }

        console.log("🤖 Processing content with AI...");
        const aiResponse = await processWithAI(content);
        console.log("✅ AI response received:", aiResponse ? aiResponse.slice(0, 100) + "..." : "No AI response");

        res.json({ aiResponse });

    } catch (error) {
        console.error("❌ Error during processing:", error.message);
        res.status(500).json({
            error: "Failed to process YouTube content",
            details: error.message
        });
    }
});




// Updated /process/blog endpoint
// Extract & process blog content with AI
app.post('/process/blog', async (req, res) => {
    try {
        console.log("📥 Incoming request to /process/blog");
        console.log("Received request:", req.body);

        const { url } = req.body;

        if (!url) {
            console.error("❌ Missing URL");
            return res.status(400).json({ error: "Missing URL" });
        }

        let content;

        console.log("🔍 Attempting to extract content with Cheerio...");

        try {
            // ✅ Primary method: Cheerio
            content = await extractContent(url);
            if (content) {
                console.log("✅ Content extracted with Cheerio:", content.slice(0, 100) + "...");
            } else {
                throw new Error("No content found with Cheerio");
            }

        } catch (error) {
            console.warn("⚠️ Cheerio extraction failed:", error.message);

            try {
                console.log("🔁 Falling back to Playwright...");
                content = await extractMediumContent(url);  // Fallback 1

                if (content) {
                    console.log("✅ Content extracted with Playwright:", content.slice(0, 100) + "...");
                } else {
                    throw new Error("No content found with Playwright");
                }

            } catch (fallbackError) {
                console.warn("⚠️ Playwright extraction failed:", fallbackError.message);

                console.log("🔁 Trying Puppeteer as last resort...");
                content = await extractBlogContentSecret(url);  // Fallback 2

                if (!content) {
                    throw new Error("No content found with any extraction method");
                }

                console.log("✅ Content extracted with Puppeteer:", content.slice(0, 100) + "...");
            }
        }

        if (!content) {
            throw new Error("No content extracted from any method");
        }

        console.log("🤖 Processing content with AI...");
        const processedContent = await processWithAI(content);
        console.log("✅ AI response received:", processedContent.slice(0, 100) + "...");

        res.json({ success: true, processedContent });

    } catch (error) {
        console.error("❌ Error during blog extraction:", error.message);
        res.status(500).json({
            error: "Failed to process blog content",
            details: error.message
        });
    }
});


// Extract & process YouTube transcript with AI
app.post("/process/youtube", async (req, res) => {
    const { url } = req.body;

    console.log("📥 Incoming request to /process/youtube");
    console.log("Received URL:", url);

    if (!url) {
        console.error("❌ Validation error: Missing YouTube URL");
        return res.status(400).json({ error: "YouTube URL is required" });
    }

    try {
        let content;

        console.log("🔍 Attempting to extract transcript...");

        try {
            // ✅ Primary method: Extract transcript
            content = await extractYouTubeTranscript(url);
            if (content) {
                console.log("✅ Transcript extracted successfully:", content.slice(0, 100) + "...");
            } else {
                throw new Error("No transcript found");
            }

        } catch (error) {
            console.warn("⚠️ Transcript extraction failed:", error.message);

            try {
                console.log("🔁 Falling back to speech-to-text...");
                content = await convertAudioToText(url);  // Fallback 1 (audio)

                if (content) {
                    console.log("✅ Audio transcription completed:", content.slice(0, 100) + "...");
                } else {
                    throw new Error("No audio content extracted");
                }

            } catch (fallbackError) {
                console.warn("⚠️ First audio transcription failed:", fallbackError.message);

                console.log("🔁 Trying secondary fallback...");
                content = await convertYouTubeAudioToText(url);  // Fallback 2 (secondary audio transcription)

                if (!content) {
                    throw new Error("No content available from any method");
                }

                console.log("✅ Secondary audio transcription succeeded:", content.slice(0, 100) + "...");
            }
        }

        console.log("🤖 Processing content with AI...");
        const aiResponse = await processWithAI(content);
        console.log("✅ AI response received:", aiResponse.slice(0, 100) + "...");

        res.json({ aiResponse });

    } catch (error) {
        console.error("❌ Error during processing:", error.message);
        res.status(500).json({
            error: "Failed to process YouTube content",
            details: error.message
        });
    }
});


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
