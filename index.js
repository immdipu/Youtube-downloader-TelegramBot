const express = require("express");
const dotenv = require("dotenv");
const ytdl = require("@distube/ytdl-core");

const app = express();
dotenv.config();

let url = "https://www.youtube.com/watch?v=MArLl3XbN8Y&ab_channel=LOFI-World";

app.post("/audio", async (req, res) => {
  const { url } = req.body;
  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
  const AudioStream = ytdl(url, {
    filter: (format) => format.hasAudio === true && format.hasVideo === false,
  });
  res.header("content-Disposition", `attachment; filename=${title}.mp3`);
  res.header("Content-Type", "audio/mpeg");
  AudioStream.pipe(res);
});

app.get("/video", async (req, res) => {
  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
  const AudioStream = ytdl(url, {
    filter: (format) => format.hasAudio === true && format.hasVideo === true,
  });
  res.header("content-Disposition", `attachment; filename=${title}.mp4`);
  res.header("Content-Type", "video/mp4");
  AudioStream.pipe(res);
});

app.listen(3000, () => {
  console.log("server started");
});
