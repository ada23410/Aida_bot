require('dotenv').config();
const OpenAI = require('openai'); // 確保引用正確
const line = require('@line/bot-sdk');
const express = require('express');

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create OpenAI API client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY, // 讀取 API 金鑰
});

// create Express app
const app = express();
app.use(express.json()); // 解析 JSON 請求體

// register a webhook handler with middleware
app.post('/callback', line.middleware(config), (req, res) => {
    Promise
    .all(req.body.events.map(handleEvent))
    .then((result) => res.json(result))
    .catch((err) => {
        console.error(err);
        res.status(500).end();
    });
});

// event handler
async function handleEvent(event) {
    if (event.type !== 'message' || event.message.type !== 'text') {
        // 忽略非文字訊息事件
        return Promise.resolve(null);
    }

    try {
        const gptResponse = await openai.chat.completions.create({
            model: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: event.message.text,
            }],
            max_tokens: 200,
        });

        // 回傳訊息
        const echo = { type: 'text', text: gptResponse.choices[0].message.content.trim() || '抱歉，我沒有話可說了。' };
        
        // 使用 reply API 回應
        return client.replyMessage(event.replyToken, [echo]);
    } catch (error) {
        console.error('Error with OpenAI API:', error.response ? error.response.data : error.message);
        return client.replyMessage(event.replyToken, {
            type: 'text',
            text: 'Sorry, there was an error processing your request.',
        });
    }
}

// listen on port
const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`listening on ${port}`);
});
