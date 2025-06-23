
export default function Home() {
  const carouselLength = 50;

  return (
    <main className="work">
      <div className="featured">
        <img
          src="https://random-image-pepebigotes.vercel.app/api/random-image"
          alt=""
        />
      </div>
      <div className="cursor" />
      {/* <div className="carousel">
      </div> */}
      {Array.from({ length: carouselLength }).map((item, index) => {
        return (
          <div className="item" key={index}>
            <img
              src="https://random-image-pepebigotes.vercel.app/api/random-image"
              alt=""
            />
          </div>
        );
      })}
    </main>
  );
}
