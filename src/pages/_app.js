import "@/styles/globals.css";
import Nav from "@/components/Nav";

export default function App({ Component, pageProps }) {
  return (
    <div className="grid">
      <Nav />
      <Component {...pageProps} />
    </div>
  );
}
