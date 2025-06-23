export default function Home() {
  const carouselLength = 50;

  return (
    <main className="work">
      <div className="featured">
        <img src="https://placehold.co/500" alt="" />
      </div>
      <div className="carousel">
        {Array.from({ length: carouselLength }).map((item) => {
          return (
            <div className="item">
              <img src="https://placehold.co/500" alt="" />
            </div>
          );
        })}
      </div>
    </main>
  );
}
