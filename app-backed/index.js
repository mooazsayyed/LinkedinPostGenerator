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
app.post('/process/blog', async (req, res) => {
    try {
        console.log("Received request:", req.body);

        const { url } = req.body;  // Only accept `url`, no `prompt`

        if (!url) {
            console.error("Missing URL");
            return res.status(400).json({ error: "Missing URL" });
        }

        console.log("Extracting blog content from URL:", url);
        const blogContent = await extractBlogContentSecret(url);
        console.log("Extracted blog content:", blogContent);

        console.log("Processing content with SREE API...");
        const processedContent = await processWithAI(blogContent); // No prompt argument
        console.log("Processed content:", processedContent);

        res.json({ success: true, processedContent });
    } catch (error) {
        console.error("Error processing request:", error.message);
        res.status(500).json({ error: "Failed to process", details: error.message });
    }
});


app.get('/extract/blog', async (req, res) => {
    try {
        console.log("Received request for blog extraction:", req.query);

        const { url } = req.query;

        if (!url) {
            console.error("❌ Missing URL parameter in request");
            return res.status(400).json({ error: "Missing URL parameter", success: false });
        }

        console.log("Extracting blog content from URL:", url);

        // Timeout handling
        const extractionTimeout = setTimeout(() => {
            console.error(`⏱️ Extraction operation timed out for URL: ${url}`);
            throw new Error("Extraction operation timed out after 30 seconds");
        }, 30000);

        let blogContent;

        // ✅ Try Playwright first
        try {
            blogContent = await extractMediumContent(url);
            console.log("✅ Successfully extracted with Playwright");
        } catch (playwrightError) {
            console.error(`⚠️ Playwright extraction failed: ${playwrightError.message}`);

            // Fallback to cheerio
            try {
                blogContent = await extractContentWithCheerio(url);
                console.log("✅ Successfully extracted with Cheerio fallback");
            } catch (cheerioError) {
                console.error(`❌ Cheerio fallback also failed: ${cheerioError.message}`);
                throw new Error("Failed to extract content with both Playwright and Cheerio");
            }
        }

        clearTimeout(extractionTimeout);

        if (!blogContent || blogContent.length === 0) {
            console.error(`⚠️ Empty content extracted from URL: ${url}`);
            return res.status(422).json({ error: "No content could be extracted from URL", success: false });
        }

        console.log(`✅ Successfully extracted ${blogContent.length} characters of content`);
        res.json({ success: true, blogContent });

    } catch (error) {
        console.error(`❌ Error processing /extract/blog request for ${req.query.url || 'unknown URL'}`);
        console.error("Full error:", error);

        // Determine appropriate status code
        let statusCode = 500;
        if (error.message.includes("ENOTFOUND") || error.message.includes("404")) {
            statusCode = 404;
        } else if (error.message.includes("timeout")) {
            statusCode = 408;
        }

        res.status(statusCode).json({
            error: "Failed to extract blog content",
            details: error.message,
            success: false
        });
    }
});
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
