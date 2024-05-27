require('dotenv').config();
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

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
    const completion = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: event.message.text,
      max_tokens: 150,
    });

    // create a echoing text message
    const echo = { type: 'text', text: completion.data.choices[0].text.trim() };

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
