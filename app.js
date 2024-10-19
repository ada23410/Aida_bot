const { messagingApi } = require('@line/bot-sdk');
const MessagingApiClient = messagingApi.MessagingApiClient;
const express = require('express');
const dotenv = require('dotenv');
const OpenAI = require("openai");

dotenv.config();

// create LINE SDK client
const client = new MessagingApiClient({
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,  // 從環境變數中讀取 Token
});

// create OpenAI API client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,  // 使用 OpenAI API 的金鑰
});

// create Express app
const app = express();
app.use(express.json()); // 解析 JSON 請求體

// register a webhook handler with middleware
app.post('/callback', (req, res) => {
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
        const completion = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                { role: "system", content: "You are a helpful assistant." },
                { role: "user", content: event.message.text }
            ],
            max_tokens: 200,
        });
    
        // 檢查 OpenAI 的回應是否存在，避免空值
        const messageContent = completion.choices[0]?.message?.content?.trim();
    
        if (typeof messageContent !== 'string') {
            console.error('OpenAI response is not a string:', messageContent);
            throw new Error('Invalid OpenAI response format.');
        }

        console.log('OpenAI response:', completion);
        console.log('Message to send to LINE:', messageContent);
        // 建立回應訊息，確保結構正確
        const echo = { type: 'text', text: messageContent };
    
        // 使用 reply API 回應，確認傳入的是 array 格式
        return client.replyMessage(event.replyToken, [echo]);
    } catch (error) {
        console.error('Error with OpenAI API or LINE API:', error.response ? error.response.data : error.message);
        // 回傳錯誤訊息給使用者
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
