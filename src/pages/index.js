import gsap from 'gsap';
import { useGSAP } from "@gsap/react";
import { Observer, ScrollTrigger, ScrollToPlugin } from "gsap/all";

export default function Home() {
  const carouselLength = 50;

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);

    const wrapper = document.querySelector(".work");

    function getScrollAmount() {
      let horizontalWidth = wrapper.scrollWidth;
      return -(horizontalWidth - window.innerWidth);
    }

    ScrollTrigger.create({
      trigger: '.cursor',
      start: "center center",
      endTrigger: ".item:last-of-type",
      end: "center center",
      markers: true,
    })
  })

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
