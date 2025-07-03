import {
  motion,
  useScroll,
  useTransform,
  useMotionValueEvent,
} from "motion/react";
import { useRef, useState, useLayoutEffect, useCallback } from "react";
import ResizeObserver from "resize-observer-polyfill";

import { getPropData } from '@/utils/propData';
import { getHome } from '@/utils/queries';

export default function Home({home}) {

  const scrollRef = useRef(null);
  const ghostRef = useRef(null);
  const itemRefs = useRef([]);

  const [scrollRange, setScrollRange] = useState(0);
  const [viewportW, setViewportW] = useState(0);
  const [yProgress, setYProgress] = useState(0);
  const [activeAsset, setActiveAsset] = useState(home.assets[0]);
  const [lastItemWidth, setLastItemWidth] = useState(0);
  const [paddingRight, setPaddingRight] = useState(0);

  useLayoutEffect(() => {
    setLastItemWidth(itemRefs.current[itemRefs.current.length - 1].offsetWidth);
  }, [itemRefs]);

  useLayoutEffect(() => {
    scrollRef.current && setScrollRange(scrollRef.current.scrollWidth);
  }, [scrollRef, paddingRight]);

  const onResize = useCallback((entries) => {

    for (let entry of entries) {
      // console.log(entry.contentRect);
      setViewportW(entry.contentRect.width);
      setPaddingRight(entry.contentRect.width - lastItemWidth);
    }
  }, [lastItemWidth]);

  useLayoutEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => onResize(entries));
    resizeObserver.observe(ghostRef.current);
    return () => resizeObserver.disconnect();
  }, [onResize]);

  const { scrollYProgress } = useScroll();

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    requestAnimationFrame(() => setYProgress(latest))
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
          style={{ x: transform.current, paddingRight: paddingRight - 16 }}
          transition={{ duration: 0 }}
          className="work__container"
        >
          <motion.div className="featured" style={{ left: -transform.current + 16 }}>
            <img
              src={activeAsset.url}
              alt={activeAsset.alt}
            />
          </motion.div>
          <motion.div className="cursor" style={{ x: -transform.current }} />
          {home.assets.map((asset, index) => {
            return (
              <div
                className="item"
                key={asset.id}
                ref={(el) => (itemRefs.current[index] = el)}
              >
                <img src={asset.url} alt={asset.alt} />
              </div>
            );
          })}
        </motion.div>
      </div>
      <div ref={ghostRef} style={{ height: scrollRange + paddingRight - 16}} className="ghost" />
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