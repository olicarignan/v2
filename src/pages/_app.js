import "@/styles/globals.css";
import Nav from "@/components/Nav";
import { ReactLenis, useLenis } from "lenis/react";

export default function App({ Component, pageProps }) {

  const lenis = useLenis((lenis) => {
    // called every scroll
    console.log(lenis);
  });

  return (
    <div className="grid">
      <ReactLenis overscroll={false} root />
      <Nav />
      <Component {...pageProps} />
    </div>
  );
}
