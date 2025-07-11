import "@/styles/globals.css";
import { AnimatePresence } from "motion/react";
import Preloader from "@/components/Preloader";

export default function App({ Component, pageProps, router }) {
  return (
        <AnimatePresence mode="wait" initial="false" >
          <Component key={router.route} {...pageProps} />
        </AnimatePresence>
  );
}
