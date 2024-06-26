require('dotenv').config();
const OpenAI = require('openai-api');

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

const openai = new OpenAI(OPENAI_API_KEY);

const line = require('@line/bot-sdk');
const express = require('express');

// create LINE SDK config from env variables
const config = {
    channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.CHANNEL_SECRET,
};

// create LINE SDK client
const client = new line.Client(config);

// create Express app
const app = express();

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
        // ignore non-text-message event
        return Promise.resolve(null);
    }

    try {
        const gptResponse = await openai.complete({
            engine: 'gpt-3.5-turbo',
            messages: [{
                role: 'user',
                content: event.message.text,
            }],
            maxTokens: 200,
        });

        // create an echoing text message
        const echo = { type: 'text', text: choices.message.content.trim() || '抱歉，我沒有話可說了。' };
        
        // use reply API
        return client.replyMessage(event.replyToken, echo);
    } catch (error) {
            console.error('Error with OpenAI API:', error);
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
