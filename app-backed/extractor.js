const { fetch } = require("undici");
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");
const cheerio = require('cheerio');
const { getSubtitles } = require("youtube-caption-extractor");
const OpenAI = require("openai");
const sreeApi = process.env.SREE_API_KEY;
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require("axios");



require("dotenv").config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Extract blog content
async function extractBlogContent(url) {
    const response = await fetch(url);
    const html = await response.text();
    const doc = new JSDOM(html);
    const reader = new Readability(doc.window.document);
    const article = reader.parse();

    return article ? article.textContent : "No content extracted";
}

// Extract YouTube transcript
async function extractYouTubeTranscript(url) {
    const videoId = extractVideoId(url);
    if (!videoId) throw new Error("Invalid YouTube URL");

    try {
        const subtitles = await getSubtitles({ videoID: videoId, lang: "en" });
        if (!subtitles.length) throw new Error("No subtitles found");

        return subtitles.map((entry) => entry.text).join(" ");
    } catch (error) {
        throw new Error("Transcript not available for this video");
    }
}

// Send extracted content to AI
// async function processWithAI(content, prompt) {
//     try {
//         const response = await openai.chat.completions.create({
//             model: "gpt-4o",
//             messages: [
//                 { role: "system", content: "You are an AI assistant helping summarize and analyze content and then generate viral linkedin post from it." },
//                 { role: "user", content: `${prompt}\n\nContent:\n${content}` }
//             ],
//             temperature: 0.7
//         });

//         return response.choices[0].message.content;
//     } catch (error) {
//         throw new Error("Failed to process AI request");
//     }
// }

// // Function to process content with DeepSeek API
// async function processWithDeepSeek(content, prompt) {
//     try {
//         const response = await axios.post(
//             DEEPSEEK_API_URL,
//             {
//                 model: "deepseek-chat", // Replace with the correct model name
//                 messages: [
//                     { role: "system", content: "You are an AI assistant helping summarize and analyze content and then generate viral linkedin post from it." },
//                     { role: "user", content: `${prompt}\n\nContent:\n${content}` }
//                 ],
//                 temperature: 0.7
//             },
//             {
//                 headers: {
//                     'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
//                     'Content-Type': 'application/json'
//                 }
//             }
//         );

//         return response.data.choices[0].message.content;
//     } catch (error) {
//         console.error("DeepSeek API Error:", error.response ? error.response.data : error.message);
//         throw new Error("Failed to process AI request");
//     }
// }


if (!sreeApi) {
    throw new Error("API Key is missing! Ensure `SREE_API_KEY` is set.");
}

// Initialize OpenAI client
const client = new OpenAI({
    baseURL: 'https://api.sree.shop/v1',
    apiKey: sreeApi
});

const detailedprompt = `Summarize the key points of the provided content clearly and concisely.
After the summary, create a compelling LinkedIn post that highlights the main insights and encourages engagement, using a professional tone suitable for a business audience. Make sure the post is relatable, informative, and has a call to action to foster discussion.

## Notes
- Make sure to keep the tone professional yet engaging. 
- The post should have a good hook for attracting readers.
- The summary should not exceed 5 sentences.  
- The LinkedIn post should be concise but comprehensive enough to provoke interest and discussion.`;

// Function to process blog content using AI
async function processWithAI(content) {
    try {
        const prompt = detailedprompt; // Fixed prompt

        const response = await client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'Generate a viral LinkedIn post summarizing this blog.' },
                { role: 'user', content: `${prompt}\n\nContent:\n${content}` }
            ],
            temperature: 0.7
        });

        console.log("AI Response:", JSON.stringify(response, null, 2)); // Debugging

        if (!response.choices || response.choices.length === 0) {
            throw new Error("No response choices from AI.");
        }

        return response.choices[0].message.content;
    } catch (error) {
        console.error("API Error:", error.response?.data || error.message);
        throw new Error(`Failed to process AI request: ${error.message}`);
    }
}



async function extractBlogContentTest(url) {
    try {
        const browser = await puppeteer.launch({ headless: true }); // Run without UI
        const page = await browser.newPage();
        await page.goto(url, { waitUntil: 'networkidle2' });

        // Extract content inside Medium's article tags
        const blogContent = await page.evaluate(() => {
            return document.querySelector('article')?.innerText || "Content not found";
        });

        await browser.close();
        return blogContent.trim();
    } catch (error) {
        console.error("Error extracting content:", error.message);
        throw new Error("Failed to extract blog content");
    }
}

// Apply stealth mode to bypass Medium bot detection
puppeteer.use(StealthPlugin());

async function extractBlogContentSecret(url) {
    try {
        const browser = await puppeteer.launch({ headless: true });
        const page = await browser.newPage();

        // Set a real browser user agent to avoid detection
        await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

        // Go to the page and wait for dynamic content
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

        // Extract blog content (adjust the selector if necessary)
        const blogContent = await page.evaluate(() => {
            const article = document.querySelector('article, div.post-content, section.blog-body'); // Try different selectors
            return article ? article.innerText.trim() : 'Content not found';
        });

        await browser.close();
        return blogContent;
    } catch (error) {
        console.error("❌ Error extracting content:", error.message);
        return "Failed to extract blog content";
    }
}


module.exports = { extractBlogContent, extractYouTubeTranscript, processWithAI, extractBlogContentTest, extractBlogContentSecret };
