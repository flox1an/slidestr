import "./SlideShow.css";
import useImageLoaded from "../utils/useImageLoaded";

type AvatarImageProps = {
  src?: string;
  author?: string;
  npub?: string;
};

const AuthorProfile = ({ src, author, npub }: AvatarImageProps) => {
  const avatarLoaded = useImageLoaded(src);
  return (
    <div className="author-info">
      <a href={`https://nostrapp.link/#${npub}`} target="_blank">
        <div>
          {avatarLoaded && (
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
