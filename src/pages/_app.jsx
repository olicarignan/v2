import "@/styles/globals.css";
import Nav from "@/components/Nav";
import Transition from "@/components/Transition";
import { TransitionProvider } from "@/context/TransitionProvider";
import Preloader from "@/components/Preloader";

export default function App({ Component, pageProps, router }) {
  return (
    <TransitionProvider>
      <Nav />
      <Transition>
        <Component key={router.route} {...pageProps} />
      </Transition>
    </TransitionProvider>
  );
}
