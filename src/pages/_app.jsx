import "@/styles/globals.css";
import { AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { usePreloader } from "@/hooks/usePreloader";
import Preloader from "@/components/Preloader";
import useSWR from "swr";
import { fetcher } from "@/utils/propData";
import { getHome } from "@/gql/queries.js";

export default function App({ Component, pageProps, router }) {
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);

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

  if (loading) {
    return <Preloader progress={progress} total={images?.length} />;
  }

  return (
    <AnimatePresence mode="wait" initial="false">
      <Component key={router.route} {...pageProps} home={data.home} />
    </AnimatePresence>
  );
}
