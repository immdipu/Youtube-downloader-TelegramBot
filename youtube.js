import ytdl from "ytdl-core";

const AudioLinkFetcher = async (url) => {
  const info = await ytdl.getInfo(url);
  const title = info.videoDetails.title.replace(/[^\w\s]/gi, "");
  const formats = info.formats;
  const AudioFormat = formats.filter(
    (format) => format.hasAudio === true && format.hasVideo === false
  );

  const BestAudioQuality = AudioFormat[0].url;
  return {
    title,
    BestAudioQuality,
  };
};

export { AudioLinkFetcher };
