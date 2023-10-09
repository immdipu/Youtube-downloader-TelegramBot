import axios from "axios";
import fs from "fs";

const bytesToMegabytes = (bytes) => {
  return (bytes / (1024 * 1024)).toFixed(2);
};

let progressMessageId = null;

const AudioDownloader = async (audioLink, name, chatId, bot) => {
  const filePath = `./${name}.mp3`;

  try {
    const response = await axios.get(audioLink, {
      responseType: "stream", // Use stream to receive data incrementally
    });

    if (response.status !== 200) {
      throw new Error(
        `Failed to fetch the audio file. Status: ${response.status}`
      );
    }

    const totalSizeBytes = parseInt(response.headers["content-length"], 10);
    const totalSizeMB = bytesToMegabytes(totalSizeBytes);

    let downloadedSizeBytes = 0;

    const writer = fs.createWriteStream(filePath);

    response.data.on("data", (chunk) => {
      downloadedSizeBytes += chunk.length;
      const downloadedSizeMB = bytesToMegabytes(downloadedSizeBytes);
      const percentage = ((downloadedSizeBytes / totalSizeBytes) * 100).toFixed(
        2
      );
      console.log(
        `Downloaded: ${downloadedSizeMB}/${totalSizeMB} MB (${percentage}%)`
      );
      // Send progress update to the Telegram bot
      sendProgressUpdate(chatId, parseFloat(percentage), bot);
    });

    response.data.pipe(writer);

    await new Promise((resolve) => {
      writer.on("finish", resolve);
    });

    console.log(`Audio downloaded`);
    return filePath;
  } catch (error) {
    console.error("Error downloading audio:", error);
    throw error;
  }
};

const sendProgressUpdate = async (chatId, percentage, bot) => {
  try {
    if (!progressMessageId) {
      // If progress message doesn't exist, send a new one
      const message = await bot.sendMessage(
        chatId,
        `Downloading: ${percentage.toFixed(2)}%`
      );
      progressMessageId = message.message_id;
    } else {
      await bot.editMessageText(`Downloading: ${percentage.toFixed(2)}%`, {
        chat_id: chatId,
        message_id: progressMessageId,
      });
    }
  } catch (error) {
    console.error("Error sending progress update:", error);
  }
};

export { AudioDownloader };
