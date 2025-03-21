const { fetch } = require("undici");
const { Readability } = require("@mozilla/readability");
const { JSDOM } = require("jsdom");
const cheerio = require('cheerio');
const { getSubtitles } = require("youtube-caption-extractor");
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const axios = require("axios");
const { OpenAI } = require('openai');  // Ensure proper import
const { chromium } = require('playwright');
const ytdl = require('ytdl-core');  // For downloading audio
const ffmpeg = require('fluent-ffmpeg');  // For audio processing
const fs = require('fs');
const speech = require('@google-cloud/speech');  // Google Speech-to-Text API

require('dotenv').config();
const sreeApi = process.env.SREE_API_KEY;

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
const ytdlp = require('yt-dlp-exec');
const { path: ffmpegPath } = require('@ffmpeg-installer/ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

const TMP_AUDIO_FILE = '/tmp/audio.mp3';  // Define the temporary audio file path

async function convertYouTubeAudioToText(url) {
    console.log("🔊 Converting YouTube audio to text...");

    try {
        // ✅ Step 1: Use yt-dlp to download audio
        console.log(`⏬ Downloading audio from ${url}...`);
        await ytdlp(url, {
            output: TMP_AUDIO_FILE,
            format: "bestaudio",
            extractAudio: true,
            audioFormat: "mp3"
        });

        console.log(`✅ Audio saved to ${TMP_AUDIO_FILE}`);

        // ✅ Step 2: Transcribe audio with Google Speech-to-Text
        const client = new speech.SpeechClient();
        const audioBytes = fs.readFileSync(TMP_AUDIO_FILE).toString('base64');

        const request = {
            audio: { content: audioBytes },
            config: {
                encoding: 'MP3',
                sampleRateHertz: 16000,
                languageCode: 'en-US'
            }
        };

        const [response] = await client.recognize(request);
        const transcription = response.results.map(result => result.alternatives[0].transcript).join('\n');

        console.log("✅ Transcription completed successfully");

        // ✅ Clean up temporary file
        fs.unlinkSync(TMP_AUDIO_FILE);  // Delete temporary audio file

        return transcription;

    } catch (error) {
        console.error("❌ Failed to convert YouTube audio to text:", error.message);

        // Ensure the temporary file is deleted in case of error
        if (fs.existsSync(TMP_AUDIO_FILE)) {
            fs.unlinkSync(TMP_AUDIO_FILE);
        }

        throw new Error("Audio transcription failed");
    }
}



//Using google speect to text api
async function convertAudioToText(audioFilePath) {
    const audio = {
        content: fs.readFileSync(audioFilePath).toString('base64'),
    };

    const config = {
        encoding: 'MP3',
        sampleRateHertz: 16000,
        languageCode: 'en-US',
    };

    const request = {
        audio: audio,
        config: config,
    };

    try {
        const [response] = await client.recognize(request);
        const transcription = response.results
            .map((result) => result.alternatives[0].transcript)
            .join(' ');

        console.log("✅ Transcription completed.");
        return transcription;

    } catch (error) {
        console.error("❌ Speech-to-Text conversion failed:", error.message);
        throw new Error("Failed to convert audio to text");
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
    apiKey: process.env.SREE_API_KEY
});

const detailedprompt = `You are an Linkedin expert helping summarize and analyze content and then generate viral linkedin post from it.`;

// Function to process blog content using AI
async function processWithAI(content) {
    try {
        const detailedprompt = `
        You are an Linkedin expert helping summarize and analyze content and then generate viral linkedin post from it.`;

        console.log("Sending request to SREE API...");

        const response = await client.chat.completions.create({
            model: 'gpt-4o',
            messages: [
                { role: 'system', content: 'Generate a viral LinkedIn post summarizing this blog.' },
                { role: 'user', content: `${detailedprompt}\n\nContent:\n${content}` }
            ],
            temperature: 0.7
        });

        console.log("Full Response:", JSON.stringify(response, null, 2));

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

async function extractMediumContent(url) {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    await page.goto(url, { waitUntil: 'networkidle' });

    // Extract content dynamically
    const content = await page.evaluate(() => {
        const article = document.querySelector('article') || document.querySelector('.postArticle-content');
        return article ? article.innerText.trim() : 'Content not found';
    });

    await browser.close();
    return content;
}

async function extractContent(url) {
    try {
        const { data } = await axios.get(url);
        const $ = cheerio.load(data);

        // Extract article content
        const content = $('article').text().trim() || $('.postArticle-content').text().trim();

        return content || 'Content not found';
    } catch (error) {
        console.error('Error:', error.message);
        return 'Failed to extract content';
    }
}


module.exports = { convertYouTubeAudioToText, convertAudioToText, extractYouTubeTranscript, extractContent, extractBlogContent, extractYouTubeTranscript, processWithAI, extractBlogContentTest, extractBlogContentSecret, extractMediumContent };
