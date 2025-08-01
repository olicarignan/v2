export const FeaturedAsset = ({ asset }) => {

  if (asset._modelApiKey === "photo") {
    return <img src={asset.photo.url} alt={asset.photo.alt} />;
  }

  if (asset._modelApiKey === "video") {
    return (
      <video
        src={asset.video.url}
        alt={asset.video.alt}
        loop
        muted
        autoPlay
        playsInline
        preload="auto"
        poster={asset.video.thumbnailUrl}
      />
    );
  }
};
