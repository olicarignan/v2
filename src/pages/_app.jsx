import "@/styles/globals.css";
import Nav from "@/components/Nav";
import { ReactLenis } from "lenis/react";
import { useRef, useEffect } from "react";
import { frame, cancelFrame } from "motion";
import "lenis/dist/lenis.css";

export default function App({ Component, pageProps }) {
  const lenisRef = useRef(null);

  useEffect(() => {
    function update(data) {
      const time = data.timestamp;
      lenisRef.current?.lenis?.raf(time);
    }

    frame.update(update, true);

    return () => cancelFrame(update);
  }, []);

  return (
    <div className="grid">
      <ReactLenis overscroll={false} root ref={lenisRef} />
      <Nav />
      <Component {...pageProps} />
    </div>
  );
}
