import gsap from 'gsap';
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from 'gsap/dist/ScrollTrigger';

import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  useMotionValueEvent,
} from "motion/react";

import { useRef, useState, useLayoutEffect, useCallback } from "react";

import ResizeObserver from "resize-observer-polyfill";

export default function Home() {
  const carouselLength = 50;

  const scrollRef = useRef(null);
  const ghostRef = useRef(null);

  const [scrollRange, setScrollRange] = useState(0);
  const [viewportW, setViewportW] = useState(0);
  const [yProgress, setYProgress] = useState(0);

  useGSAP(() => {
    gsap.registerPlugin(ScrollTrigger);
  }, []);

  useLayoutEffect(() => {
    scrollRef.current && setScrollRange(scrollRef.current.scrollWidth);
  }, [scrollRef]);

  const onResize = useCallback((entries) => {
    for (let entry of entries) {
      setViewportW(entry.contentRect.width);
    }
  }, []);

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => onResize(entries));
    resizeObserver.observe(ghostRef.current);
    return () => resizeObserver.disconnect();
  }, [onResize]);

  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    setYProgress(latest)
  });

  const transform = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -scrollRange + viewportW]
  );

  return (
    <main className="work">
      <div className="scroll-container">
        <motion.div
          ref={scrollRef}
          style={{ x: transform.current }}
          className="work__container"
        >
          <motion.div className="featured" style={{ left: -transform.current + 16 }}>
            {/* <h1>{scrollYProgress.current}</h1> */}
            <img
              src="https://random-image-pepebigotes.vercel.app/api/random-image"
              alt=""
            />
          </motion.div>
          <motion.div className="cursor" style={{ x: -transform.current }} />
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
        </motion.div>
      </div>
      <div ref={ghostRef} style={{ height: scrollRange }} className="ghost" />
    </main>
  );
}
