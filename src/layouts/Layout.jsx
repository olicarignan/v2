import { motion } from "motion/react";
import { useRouter } from "next/router";

import Nav from "@/components/Nav";
import { anim } from "@/utils/animate";

export default function Layout({ children}) {

  const router = useRouter();

  const opacity = {
    initial: { opacity: 0 },
    enter: { opacity: 1,
      duration: 0.2
     },
    exit: { opacity: 1 },
  };

  const slide = {
    inital: {
      x: 0,
      transition: { type: "tween", duration: 0}
    },
    enter: {
      x: router.pathname === "/" ? "100vw" : "-100vw",
      transition: { type: "tween", duration: 0}
    },
    exit: {
      x: 0,
      transition: { duration: 1, ease: [0.85, 0, 0.15, 1] },
    },
  };

  const perspective = {
    initial: {
      x: 0,
      opacity: 1,
    },
    enter: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: router.pathname === "/" ? 150 : -150, // Adjust for different viewport widths
      opacity: 0.5,
      transition: { duration: 1, ease: [0.85, 0, 0.15, 1] },
    }

  }

  return (
    <div className="layout">
      <Nav />
      <motion.div {...anim(slide)} className="slide" />
      <motion.div {...anim(perspective)}>
        <motion.div {...anim(opacity)} className="grid">
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
