'use client'

import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { useRef, useState, useEffect, useLayoutEffect, useCallback } from "react";
import ResizeObserver from "resize-observer-polyfill";
import { ReactLenis, useLenis } from "lenis/react";

import { elementsOverlap } from '@/utils/elementsOverlap';

import { getPropData } from '@/utils/propData';
import { getHome } from '@/utils/queries';

export default function Home({home}) {
  const scrollRef = useRef(null);
  const ghostRef = useRef(null);
  const itemRefs = useRef([]);
  const cursorRef = useRef(null);

  const [scrollRange, setScrollRange] = useState(0);
  const [viewportW, setViewportW] = useState(0);
  const [yProgress, setYProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lastItemWidth, setLastItemWidth] = useState(0);
  const [paddingRight, setPaddingRight] = useState(0);
  const [progress, setProgress] = useState(0);

  const lenis = useLenis(
    ({ scroll, limit }) => {
      setProgress(scroll / limit);
    },
    [viewportW]
  );

  useLayoutEffect(() => {
    setLastItemWidth(itemRefs.current[itemRefs.current.length - 1].offsetWidth);
  }, [itemRefs]);

  useLayoutEffect(() => {
    scrollRef.current && setScrollRange(scrollRef.current.scrollWidth);
  }, [scrollRef, paddingRight]);

  const onResize = useCallback(
    (entries) => {
      for (let entry of entries) {
        setViewportW(entry.contentRect.width);
        setPaddingRight(entry.contentRect.width - lastItemWidth);
      }
    },
    [lastItemWidth]
  );

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => onResize(entries));
    resizeObserver.observe(ghostRef.current);
    return () => resizeObserver.disconnect();
  }, [onResize]);

  useLayoutEffect(() => {
    const cursor = cursorRef.current.getBoundingClientRect();
    const items = itemRefs.current;
    for (let i = 0; i < items.length; i++) {
      const item = items[i].getBoundingClientRect();
      if (elementsOverlap(item, cursor)) {
        requestAnimationFrame(() => setActiveIndex(i));
      }
    }
  }, [cursorRef, yProgress]);

  const scrollTo = (itemIndex) => {
    const item = itemRefs.current[itemIndex];
    if (item) {
      const offset = item.offsetLeft;
      // console.log((100*offset) / (-scrollRange + viewportW)/100)
      // lenis.scrollTo(offset, {
      //   lock: false,
      //   immediate: true,
      //   axis: "y",
      // });
      // scrollYProgress.set((100*offset) / (-scrollRange + viewportW - 16)/100 * -1);
      transform.set(-offset + 16);
    }
  };

  const { scrollYProgress } = useScroll({
    target: lenis,
    axis: "y",
  });

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    requestAnimationFrame(() => setYProgress(latest));
  });

  const transform = useTransform(
    scrollYProgress,
    [0, 1],
    [0, -scrollRange + viewportW]
  );

  console.log(yProgress)
  console.log(progress)

  return (
    <main className="work">
      <div className="scroll-container">
        <motion.div
          ref={scrollRef}
          style={{ x: transform.current, paddingRight: paddingRight - 16 }}
          transition={{ duration: 0 }}
          className="work__container"
        >
          <motion.div
            className="featured"
            style={{ left: -transform.current + 16 }}
          >
            <img src={home.assets[activeIndex].url} alt={home.assets[activeIndex].alt} />
          </motion.div>
          <motion.div
            className="cursor"
            ref={cursorRef}
            style={{ x: -transform.current }}
          />
          {home.assets.map((asset, index) => {
            return (
              <div
                className={`item${index === activeIndex ? " active" : ""}`}
                key={asset.id}
                ref={(el) => (itemRefs.current[index] = el)}
                onClick={() => scrollTo(index)}
              >
                <img src={asset.url} alt={asset.alt} />
              </div>
            );
          })}
        </motion.div>
      </div>
      <div
        ref={ghostRef}
        style={{ height: scrollRange + paddingRight, pointerEvents: "none" }}
        className="ghost"
      />
    </main>
  );
}

export const getStaticProps = async () => {

  const home = await getPropData(getHome);

  return {
    props: {
      ...home
    },
  };

}