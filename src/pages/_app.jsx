import "@/styles/globals.css";
import { AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { usePreloader } from "@/hooks/usePreloader";
import Preloader from "@/components/Preloader";
import useSWR from "swr";
import { fetcher } from "@/utils/propData";
import { getHome } from "@/gql/queries.js";
import Seo from "@/components/Seo";
import { Analytics } from "@vercel/analytics/next";

export default function App({ Component, pageProps, router }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState("00");

  const { data } = useSWR(getHome, (query) => fetcher(query));

  const images = data?.home?.assets;

  // Preload images when available
  useEffect(() => {
    if (!images) return;

    usePreloader(images, setProgress).then(() => {
      setTimeout(() => {
        setLoading(false); // Hide immediately when done
      }, 500);
    });
  }, [images]);

  return (
    <>
      <Seo keywords />
      <AnimatePresence mode="wait" initial="false">
        {loading ? (
          <Preloader progress={progress} total={images?.length} />
        ) : (
          <Component key={router.route} {...pageProps} home={data.home} />
        )}
      </AnimatePresence>
      <Analytics />
    </>
  );
}
