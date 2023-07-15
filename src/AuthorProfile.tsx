import { useState } from "react";
import "./App.css";

type AvatarImageProps = {
  src?: string;
  author?: string;
  npub?: string;
};

const AuthorProfile = ({ src, author, npub }: AvatarImageProps) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div className="author-info">
      <a href={`https://nostrapp.link/#${npub}`} target="_blank">
        <div>
          {src && (
            <img
              style={{
                opacity: imageLoaded ? 1 : 0,
              }}
              onLoad={() => setImageLoaded(true)}
              src={src}
              alt={author}
              width={64}
              height={64}
            ></img>
          )}
          {author}
        </div>
      </a>
    </div>
  );
};

export default AuthorProfile;
