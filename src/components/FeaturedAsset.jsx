export const FeaturedAsset = ({ asset }) => {
  if (asset.format === "jpg") {
    return <img src={asset.url} alt={asset.alt} />;
  }

  if (asset.format === "mp4") {
    return <video src={asset.url} alt={asset.alt} loop muted autoPlay playsInline />;
  }
};
