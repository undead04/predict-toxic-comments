import { AppError } from "../error/AppError";

export const extractVideoId = (url: string): string => {
  // Regex này bao quát được hầu hết các định dạng URL của YouTube
  const regex =
    /^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
  const match = url.match(regex);

  if (match && match[1] && match[1].length === 11) {
    return match[1];
  }

  throw new AppError("Invalid YouTube URL format", 400);
};
