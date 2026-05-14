import { type ReactElement } from "react";

const URL_REGEX: RegExp = /(https?:\/\/[^\s]+)/g;

interface MessageTextProps {
  text: string;
}

export const MessageText = ({ text }: MessageTextProps): ReactElement => {
  return (
    <div className="text-[15px] leading-snug whitespace-pre-wrap select-text break-words flex-1 min-w-0">
      {text.split(URL_REGEX).map((part: string, i: number) =>
        part.match(URL_REGEX) ? (
          <a
            key={i}
            href={part}
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-blue-600 hover:text-blue-700 break-all"
          >
            {part}
          </a>
        ) : (
          part
        ),
      )}
    </div>
  );
};
