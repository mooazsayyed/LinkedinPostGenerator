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
const fs = require('fs');
const speech = require('@google-cloud/speech');  // Google Speech-to-Text API
const { exec } = require('child_process');
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const FireCrawlApp = require('@mendable/firecrawl-js').default;  // Convert import to require
const { YoutubeTranscript } = require('youtube-transcript');


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

/**
 * Extract transcript from a YouTube video
 * @param {string} url - The YouTube video URL
 * @returns {Promise<string>} The video transcript
 */
async function extractYouTubeTranscript(url) {
    try {
        console.log("🎥 Processing YouTube URL:", url);

        // Extract video ID from URL
        const videoId = extractVideoId(url);
        if (!videoId) {
            throw new Error("Invalid YouTube URL");
        }

        console.log("🔍 Fetching transcript for video ID:", videoId);

        // Get transcript using youtube-transcript
        const transcripts = await YoutubeTranscript.fetchTranscript(videoId);

        if (!transcripts || transcripts.length === 0) {
            throw new Error("No transcript available for this video");
        }

        // Combine all transcript parts with proper formatting
        const formattedTranscript = transcripts
            .map(part => part.text)
            .join(' ')
            .replace(/\s+/g, ' ')  // Remove extra spaces
            .trim();

        console.log("✅ Transcript extracted successfully");
        console.log("📝 Transcript preview:", formattedTranscript.slice(0, 150) + "...");

        return formattedTranscript;

    } catch (error) {
        console.error("❌ Failed to extract transcript:", error.message);

        // If transcript fails, try audio extraction as fallback
        console.log("🔄 Attempting fallback to audio extraction...");
        try {
            const audioTranscript = await convertYouTubeAudioToText(url);
            console.log("✅ Successfully extracted audio transcript");
            return audioTranscript;
        } catch (audioError) {
            console.error("❌ Audio extraction also failed:", audioError.message);
            throw new Error(`Failed to extract content: ${error.message}`);
        }
    }
}
const TMP_AUDIO_FILE = '/tmp/audio.mp3';  // Temporary audio file path

// Set FFmpeg path
const ffmpeg = require('fluent-ffmpeg');
ffmpeg.setFfmpegPath(ffmpegPath);

async function convertYouTubeAudioToText(url) {
    console.log("🔊 Converting YouTube audio to text...");

    try {
        // ✅ Step 1: Use yt-dlp to download audio
        console.log(`⏬ Downloading audio from ${url}...`);

        await new Promise((resolve, reject) => {
            exec(`yt-dlp -x --audio-format mp3 -o "${TMP_AUDIO_FILE}" ${url}`, (error, stdout, stderr) => {
                if (error) {
                    console.error(`❌ yt-dlp download failed: ${error.message}`);
                    return reject(new Error("Failed to download audio"));
                }
                console.log(`✅ Audio downloaded successfully`);
                resolve();
            });
        });

        // ✅ Step 2: Transcribe audio with Google Speech-to-Text
        console.log(`📝 Transcribing audio...`);

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
        const transcription = response.results
            .map(result => result.alternatives[0].transcript)
            .join('\n');

        console.log("✅ Transcription completed successfully");

        // ✅ Clean up temporary file
        fs.unlinkSync(TMP_AUDIO_FILE);  // Delete temporary audio file
        console.log(`🗑️ Temporary file removed`);

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
// Initialize Beta API client
const betaClient = new OpenAI({
    baseURL: 'https://beta.sree.shop/v1',
    apiKey: process.env.BETA_API_KEY  // Use your Beta API key from env variables
});

// Function to process blog content using Beta API
async function processWithBetaAI(content) {
    try {
        const detailedPrompt = `
        You are a LinkedIn expert helping summarize and analyze content, then generating a viral LinkedIn post from it.
        `;

        console.log("🚀 Sending request to Beta SREE API...");

        const response = await betaClient.chat.completions.create({
            model: 'o3-mini',  // Beta model
            messages: [
                { role: 'system', content: 'Generate a viral LinkedIn post summarizing this blog.' },
                { role: 'user', content: `${detailedPrompt}\n\nContent:\n${content}` }
            ],
            temperature: 0.7
        });

        console.log("✅ Full Response:", JSON.stringify(response, null, 2));

        if (!response.choices || response.choices.length === 0) {
            throw new Error("No response choices from Beta AI.");
        }

        return response.choices[0].message.content;

    } catch (error) {
        console.error("❌ Beta API Error:", error.response?.data || error.message);
        throw new Error(`Failed to process Beta AI request: ${error.message}`);
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






























// Here is where actual working will start

/**
 * Process content with OpenRouter AI to generate a LinkedIn post
 * @param {string} content - The blog content to process
 * @param {string} model - The AI model to use (optional)
 * @returns {Promise<Object>} The AI response
 */
async function processWithOpenRouter(content, model = "qwen/qwen3-0.6b-04-28:free") {
    if (!content) {
        throw new Error("Content is required for processing");
    }

    try {
        const openai = new OpenAI({
            baseURL: "https://openrouter.ai/api/v1",
            apiKey: process.env.OPENROUTER_API_KEY,
            defaultHeaders: {
                "HTTP-Referer": process.env.SITE_URL || "http://localhost:3000",
                "X-Title": process.env.SITE_NAME || "LinkedInPostGenerator",
            },
        });

        console.log("🤖 Sending request to OpenRouter API...");
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    "role": "system",
                    "content": `You are a LinkedIn expert who creates viral posts. Follow these guidelines:
                    1. Create engaging, professional content
                    2. Use appropriate emojis sparingly
                    3. Format for maximum readability with clear paragraphs
                    4. Include ONLY 2-3 most relevant hashtags at the end
                    5. Keep hashtags simple and directly related to the main topic
                    6. Do not use excessive or repetitive hashtags
                    7. Focus on quality of content over quantity of hashtags`
                },
                {
                    "role": "user",
                    "content": `Create a viral LinkedIn post from this content. Remember to use only 2-3 relevant hashtags:\n\n${content}`
                }
            ],
            temperature: 0.7,
        });

        if (!completion?.choices?.[0]?.message) {
            throw new Error("Invalid response format from OpenRouter");
        }

        console.log("✅ Successfully generated LinkedIn post");
        return completion;

    } catch (error) {
        console.error("❌ OpenRouter API Error:", error.message);
        throw new Error(`Failed to process OpenRouter request: ${error.message}`);
    }
}

// async function main() {
//     const completion = await processWithOpenRouter("What is the meaning of life?");
//     console.log(completion.content);
// }

// Install with npm install @mendable/firecrawl-js

/**
 * Scrapes content from a given URL using FireCrawl
 * @param {string} url - The URL to scrape
 * @param {Object} options - Optional configuration for scraping (defaults to markdown format)
 * @returns {Promise<Object>} The scraped content
 */
async function scrapeUrlWithFireCrawl(url, options = { formats: ["markdown"] }) {
    try {
        const app = new FireCrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

        if (!url) {
            throw new Error("URL is required");
        }

        console.log(`🔍 Scraping content from: ${url}`);
        const scrapeResult = await app.scrapeUrl(url, options);
        console.log("✅ Content scraped successfully");

        return scrapeResult;
    } catch (error) {
        console.error("❌ FireCrawl Error:", error.message);
        throw new Error(`Failed to scrape URL: ${error.message}`);
    }
}

/**
 * Extracts content from blog posts efficiently without using a browser
 * @param {string} url - The URL of the blog to extract content from
 * @param {Object} options - Optional configuration for content extraction
 * @param {string[]} options.selectors - Custom CSS selectors to target content (optional)
 * @param {boolean} options.includeMetadata - Whether to include title, author, date (optional)
 * @returns {Promise<Object>} The extracted content and metadata
 */
async function extractBlogContentEfficient(url, options = {}) {
    const defaultSelectors = [
        'article', // Most common blog article container
        '.post-content',
        '.entry-content',
        '.blog-post',
        '.article-content',
        '.blog-content',
        'main[role="main"]',
        '[itemprop="articleBody"]',
        '.content-area'
    ];

    const selectors = options.selectors || defaultSelectors;

    try {
        console.log(`🔍 Fetching content from: ${url}`);
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });

        const $ = cheerio.load(data);
        let content = '';
        let metadata = {};

        // Try each selector until we find content
        for (const selector of selectors) {
            const element = $(selector);
            if (element.length > 0) {
                content = element.first().text().trim();
                break;
            }
        }

        // Extract metadata if requested
        if (options.includeMetadata) {
            metadata = {
                title: $('meta[property="og:title"]').attr('content') ||
                    $('title').text() ||
                    $('h1').first().text(),
                description: $('meta[property="og:description"]').attr('content') ||
                    $('meta[name="description"]').attr('content'),
                author: $('meta[name="author"]').attr('content') ||
                    $('.author').first().text() ||
                    $('[rel="author"]').first().text(),
                date: $('meta[property="article:published_time"]').attr('content') ||
                    $('time').attr('datetime') ||
                    $('.date').first().text()
            };
        }

        // Clean up the content
        content = content
            .replace(/\s+/g, ' ')           // Replace multiple spaces with single space
            .replace(/\n\s*\n/g, '\n\n')    // Replace multiple newlines with double newline
            .trim();

        if (!content) {
            throw new Error('No content found with the provided selectors');
        }

        console.log("✅ Content extracted successfully");
        return {
            content,
            ...(options.includeMetadata && { metadata }),
            url
        };

    } catch (error) {
        console.error("❌ Extraction Error:", error.message);
        throw new Error(`Failed to extract blog content: ${error.message}`);
    }
}

module.exports = {
    processWithBetaAI,
    convertYouTubeAudioToText,
    convertAudioToText,
    extractYouTubeTranscript,
    extractContent,
    extractBlogContent,
    extractYouTubeTranscript,
    processWithAI,
    extractBlogContentTest,
    extractBlogContentSecret,
    extractMediumContent,
    processWithOpenRouter,
    scrapeUrlWithFireCrawl,
    extractBlogContentEfficient
};
