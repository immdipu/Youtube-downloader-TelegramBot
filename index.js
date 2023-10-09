import express from "express";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import { AudioLinkFetcher } from "./youtube.js";
import { AudioDownloader } from "./downloader.js";

dotenv.config();
const app = express();
app.use(express.json());

// const TELEGRAM_PORT = process.env.TELEGRAM_PORT || 3001;

const token = process.env.BOT_TOKEN;
// const options = {
//   webHook: {
//     port: TELEGRAM_PORT,
//   },
// };
const bot = new TelegramBot(token, { polling: true });
// const BASEURL = process.env.BASE_URL;
// bot.setWebHook(`${BASEURL}/bot${token}`);

const inlineKeyboard = [
  [
    { text: "Audio", callback_data: "Audio" },
    { text: "Video", callback_data: "Video" },
  ],
];

// app.post(`/bot${token}`, async (req, res) => {
//   const message = req.body;
//   console.log(message);
//   if (message) {
//     const chatId = message.message.chat.id;
//     const url = message.message.text;

//     if (url === "/start") {
//       return bot.sendMessage(
//         chatId,
//         "Hi there! I'm a YouTube video and audio downloader bot. Send me a YouTube link, and I'll download the video or audio for you. Created by @immdipu. 😊"
//       );
//     }

//     const youtubeRegex =
//       /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/;
//     const match = url.match(youtubeRegex);
//     if (match) {
//       const inlineKeyboard = [
//         [
//           { text: "Audio", callback_data: "Audio" },
//           { text: "Video", callback_data: "Video" },
//         ],
//       ];
//       bot.sendMessage(
//         chatId,
//         "Thanks for sharing a YouTube link! Please select Audio or Video ",
//         {
//           reply_markup: {
//             inline_keyboard: inlineKeyboard,
//           },
//           parse_mode: "HTML",
//         }
//       );
//     } else {
//       bot.sendMessage(chatId, "Please send a valid YouTube link.");
//     }
//   }
// });

bot.onText(
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
  (msg, match) => {
    const chatId = msg.chat.id;

    url = match[0];
    console.log();
    bot.sendMessage(
      chatId,
      "Thanks for sharing a YouTube link! Please select Audio or Video ",
      {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
        parse_mode: "HTML",
      }
    );
  }
);

bot.on("callback_query", async (query) => {
  if (url === undefined) {
    return bot.sendMessage(query.message.chat.id, "No Link found");
  }

  const data = query.data;
  if (data === "Audio") {
    const chatId = query.message.chat.id;
    bot.deleteMessage(chatId, query.message.message_id).then(() => {
      bot.sendMessage(chatId, "Downloading audio...");
    });
    const { title, BestAudioQuality } = await AudioLinkFetcher(url);
    let currentPath = null;

    AudioDownloader(BestAudioQuality, title, chatId, bot)
      .then((filePath) => {
        currentPath = filePath;
      })
      .then(() => {
        bot.sendMessage(chatId, "Audio downloaded and is now uploading...");
      })
      .then(() => {
        bot.sendAudio(chatId, fs.readFileSync(currentPath), {
          title: title,
          caption: title,
        });
      })
      .then(() => {
        fs.unlinkSync(currentPath);
      })
      .catch((error) => {
        console.error("Error downloading audio:", error);
      });
  } else if (data === "Video") {
    bot.sendMessage(query.message.chat.id, "This feature is not available yet");
  }
});

bot.on("message", (msg) => {
  const chatId = msg.chat.id;
  console.log(msg);
  if (msg.text === "/start") {
    return bot.sendMessage(
      chatId,
      "Hi there! I'm a YouTube video and audio downloader bot. Send me a YouTube link, and I'll download the video or audio for you. Created by @immdipu. 😊"
    );
  }

  bot.sendMessage(msg.chat.id, "Please send a YouTube link.");
});

app.listen(3001, () => {
  console.log("server started");
});
