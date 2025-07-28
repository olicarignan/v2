"use client";

import { motion } from "motion/react";
import { anim } from "@/utils/animate";

export default function Preloader({ progress, total }) {

  const slideOut = {
    initial: {
      y: 0,
      transition: { type: "tween", duration: 0}
    },
    enter: {
      y: 0,
      transition: { type: "tween", duration: 0}
    },
    exit: {
      y: "-100%",
      transition: { duration: 1, ease: [0.85, 0, 0.15, 1] },
    },
  }

  return (
    <motion.div className="preloader grid">
      <div className="progress">
        <motion.span {...anim(slideOut)} suppressHydrationWarning>
          {progress}
        </motion.span>
      </div>
      <div className="total">
        <motion.span {...anim(slideOut)} suppressHydrationWarning>
          {total}
        </motion.span>
      </div>
    </motion.div>
  );
}
