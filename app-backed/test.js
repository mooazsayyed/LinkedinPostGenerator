require('dotenv').config();
const axios = require('axios');

async function testOpenAI() {
    try {
        const response = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o",
                messages: [{ role: "user", content: "Hello, world!" }],
            },
            {
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json"
                }
            }
        );

        console.log("✅ API Response:", response.data);
    } catch (error) {
        console.error("❌ API Request Failed:", error.response ? error.response.data : error.message);
    }
}

testOpenAI();
