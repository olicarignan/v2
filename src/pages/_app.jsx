import "@/styles/globals.css";
import { AnimatePresence } from "motion/react";
// import Preloader from "@/components/Preloader";
import useSWR from "swr";
import { fetcher } from "@/utils/propData";
import { getHome } from "@/gql/queries.js";

export default function App({ Component, pageProps, router }) {

  const { data, isLoading, error } = useSWR(getHome, (query) => fetcher(query));

  console.log(data, isLoading, error)

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
        <AnimatePresence mode="wait" initial="false" >
          <Component key={router.route} {...pageProps} home={data.home} />
        </AnimatePresence>
  );
}
