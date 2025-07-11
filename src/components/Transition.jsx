import { useState, useContext } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

import { TransitionContext } from "@/context/TransitionProvider";

export default function Transition({ children }) {
  const [displayChildren, setDisplayChildren] = useState(children);
  const { timeline } = useContext(TransitionContext);

  useGSAP(() => {
    if (children.key !== displayChildren.key) {
      timeline.play().then(() => {
        setDisplayChildren(children);
        timeline.pause().clear();
      })
    }
  }, [children]);

  return <div className="transition">{displayChildren}</div>;
}
