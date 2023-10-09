import express from "express";
import dotenv from "dotenv";
import TelegramBot from "node-telegram-bot-api";
import fs from "fs";
import axios from "axios";
import fetch from "node-fetch";
import { AudioLinkFetcher } from "./youtube.js";
import { AudioDownloader } from "./downloader.js";

dotenv.config();
const app = express();

const token = process.env.BOT_TOKEN;

const bot = new TelegramBot(token, { polling: true });

let url;

const inlineKeyboard = [
  [
    { text: "Audio", callback_data: "Audio" },
    { text: "Video", callback_data: "Video" },
  ],
];

bot.onText(
  /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]+)/,
  (msg, match) => {
    const chatId = msg.chat.id;
    if (match[0] === undefined) {
      return bot.sendMessage(chatId, "Please send a valid YouTube link");
    }
    url = match[0];
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

  if (msg.text === "/help") {
    return bot.sendMessage(
      chatId,
      "Send a YouTube link and I'll download the video or audio for you. Created by @immdipu. 😊"
    );
  }

  if (msg.text === "/about") {
    return bot.sendMessage(chatId, "Created by @immdipu. 😊");
  }

  if (msg.entities === undefined) {
    bot.sendMessage(chatId, "please send a valid YouTube link");
  }
});

app.listen(3000, () => {
  console.log("server started");
});
