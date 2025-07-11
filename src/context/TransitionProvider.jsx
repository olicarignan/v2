import { createContext, useState } from "react";
import gsap from "gsap";

const TransitionContext = createContext({});

const TransitionProvider = ({children}) => {
  const [timeline, setTimeline] = useState(() => {
    return gsap.timeline({paused: true});
  });

  return (
    <TransitionContext.Provider value={{timeline, setTimeline}}>
      {children}
    </TransitionContext.Provider>
  )
}

export { TransitionContext, TransitionProvider };