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
        // 檢查 OpenAI 回應是否為字串並且不為空
        const messageContent = completion.choices[0]?.message?.content?.trim() || 'Sorry, I have no response for that.';
        
        console.log('Message to send to LINE:', messageContent);
    
        // 檢查 event.replyToken 是否存在並有效
        if (!event.replyToken) {
            throw new Error('Invalid or missing replyToken');
        }
        console.log('ReplyToken:', event.replyToken);
    
        // 構建回應訊息
        const echo = { type: 'text', text: messageContent };
    
        // 使用數組格式傳遞訊息
        return client.replyMessage(event.replyToken, [echo]);
    } catch (error) {
        console.error('Error with OpenAI or LINE API:', error.response ? error.response.data : error.message);
        // 向使用者回傳錯誤訊息
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
