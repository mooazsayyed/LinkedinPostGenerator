const express = require("express");
const cors = require('cors');
const axios = require('axios'); // For making HTTP requests to DeepSeek API
// const openai = require('openai'); // Import OpenAI API
const app = express();
const { extractBlogContentEfficient, scrapeUrlWithFireCrawl, processWithOpenRouter, processWithBetaAI, convertYouTubeAudioToText, convertAudioToText, extractContent, extractMediumContent, extractBlogContent, extractYouTubeTranscript, processWithAI, extractBlogContentTest, extractBlogContentSecret } = require("./extractor");


require('dotenv').config(); // Load .env file

// Enable CORS for all routes
app.use(cors());
app.use(express.json()); // Ensure JSON request bodies are parsed




const PORT = 3000;

app.use(express.json());  // Ensure JSON parsing middleware is added

//will be using this one
// Extract & process YouTube transcript with AI
app.post("/process/youtube", async (req, res) => {
    try {
        console.log("📥 Incoming request to /process/youtube");
        const { url } = req.body;

        if (!url) {
            console.error("❌ Validation error: Missing YouTube URL");
            return res.status(400).json({
                success: false,
                error: "YouTube URL is required"
            });
        }

        console.log("🎥 Processing URL:", url);

        // Extract transcript using our improved function
        let content;
        try {
            content = await extractYouTubeTranscript(url);

            if (!content) {
                throw new Error("No content extracted from video");
            }

            console.log("✅ Content extracted successfully");
            console.log("📝 Content preview:", content.slice(0, 100) + "...");

        } catch (extractError) {
            console.error("❌ Content extraction failed:", extractError.message);
            throw new Error(`Failed to extract video content: ${extractError.message}`);
        }

        // Process with OpenRouter
        console.log("🤖 Processing content with OpenRouter...");
        const aiResponse = await processWithOpenRouter(content);

        if (!aiResponse?.choices?.[0]?.message?.content) {
            throw new Error("Invalid AI response format");
        }

        const linkedInPost = aiResponse.choices[0].message.content;
        console.log("✅ LinkedIn post generated:", linkedInPost.slice(0, 100) + "...");

        // Return success response with the LinkedIn post and metadata
        res.json({
            success: true,
            data: {
                linkedInPost,
                metadata: {
                    model: aiResponse.model,
                    provider: aiResponse.provider,
                    usage: aiResponse.usage,
                    source: {
                        type: 'youtube',
                        url: url
                    }
                }
            }
        });

    } catch (error) {
        console.error("❌ Error during YouTube processing:", error.message);
        res.status(500).json({
            success: false,
            error: "Failed to process YouTube content",
            details: error.message
        });
    }
});

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

        // Try FireCrawl first
        try {
            console.log("🔍 Attempting to extract content with FireCrawl...");
            const scrapeResult = await scrapeUrlWithFireCrawl(url);

            if (scrapeResult && scrapeResult.content) {
                content = scrapeResult.content;
                console.log("✅ Content extracted with FireCrawl:", content.slice(0, 100) + "...");
            } else {
                throw new Error("No content found with FireCrawl");
            }
        } catch (fireCrawlError) {
            console.warn("⚠️ FireCrawl extraction failed:", fireCrawlError.message);

            // Fallback to efficient extraction
            try {
                console.log("🔁 Falling back to efficient extraction...");
                const extractResult = await extractBlogContentEfficient(url, { includeMetadata: true });

                if (!extractResult || !extractResult.content) {
                    throw new Error("No content found with efficient extraction");
                }

                content = extractResult.content;
                console.log("✅ Content extracted efficiently:", content.slice(0, 100) + "...");
            } catch (extractError) {
                console.error("❌ All extraction methods failed");
                throw new Error(`Failed to extract content: ${extractError.message}`);
            }
        }

        if (!content) {
            throw new Error("No content extracted from any method");
        }

        // Process with OpenRouter instead of SREE API
        console.log("🤖 Processing content with OpenRouter...");
        const aiResponse = await processWithOpenRouter(content);

        if (!aiResponse?.choices?.[0]?.message?.content) {
            throw new Error("Invalid AI response format");
        }

        const linkedInPost = aiResponse.choices[0].message.content;
        console.log("✅ LinkedIn post generated:", linkedInPost.slice(0, 100) + "...");

        // Return success response with the LinkedIn post and metadata
        res.json({
            success: true,
            data: {
                linkedInPost,
                metadata: {
                    model: aiResponse.model,
                    provider: aiResponse.provider,
                    usage: aiResponse.usage
                }
            }
        });

    } catch (error) {
        console.error("❌ Error during blog processing:", error.message);
        res.status(500).json({
            success: false,
            error: "Failed to process blog content",
            details: error.message
        });
    }
});





// // Extract & process YouTube transcript with AI
// app.post("/process/youtube", async (req, res) => {
//     const { url } = req.body;

//     console.log("📥 Incoming request to /process/youtube");
//     console.log("Received URL:", url);

//     if (!url) {
//         console.error("❌ Validation error: Missing YouTube URL");
//         return res.status(400).json({ error: "YouTube URL is required" });
//     }

//     try {
//         let content;

//         console.log("🔍 Attempting to extract transcript...");

//         try {
//             // ✅ Primary method: Extract transcript
//             content = await extractYouTubeTranscript(url);
//             if (content) {
//                 console.log("✅ Transcript extracted successfully:", content.slice(0, 100) + "...");
//             } else {
//                 throw new Error("No transcript found");
//             }

//         } catch (error) {
//             console.warn("⚠️ Transcript extraction failed:", error.message);

//             try {
//                 console.log("🔁 Falling back to speech-to-text...");
//                 content = await convertAudioToText(url);  // Fallback 1 (audio)

//                 if (content) {
//                     console.log("✅ Audio transcription completed:", content.slice(0, 100) + "...");
//                 } else {
//                     throw new Error("No audio content extracted");
//                 }

//             } catch (fallbackError) {
//                 console.warn("⚠️ First audio transcription failed:", fallbackError.message);

//                 console.log("🔁 Trying secondary fallback...");
//                 content = await convertYouTubeAudioToText(url);  // Fallback 2 (secondary audio transcription)

//                 if (!content) {
//                     throw new Error("No content available from any method");
//                 }

//                 console.log("✅ Secondary audio transcription succeeded:", content.slice(0, 100) + "...");
//             }
//         }

//         console.log("🤖 Processing content with AI...");
//         const aiResponse = await processWithAI(content);
//         console.log("✅ AI response received:", aiResponse.slice(0, 100) + "...");

//         res.json({ aiResponse });

//     } catch (error) {
//         console.error("❌ Error during processing:", error.message);
//         res.status(500).json({
//             error: "Failed to process YouTube content",
//             details: error.message
//         });
//     }
// });


app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
