import { useState } from "react";
import "./App.css";

type AvatarImageProps = {
  src?: string;
  author?: string;
  npub?: string;
};

const AuthorProfile = ({ src, author, npub }: AvatarImageProps) => {
  return (
    <div className="author-info">
      <a href={`https://nostrapp.link/#${npub}`} target="_blank">
        <div>
          {src && (
            <div
              className="author-image"
              style={{
                backgroundImage: `url(${src})`,
              }}
            ></div>
          )}
          {author}
        </div>
      </a>
    </div>
  );
};

export default AuthorProfile;
