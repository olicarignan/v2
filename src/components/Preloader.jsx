"use client";

import { motion } from "motion/react";

import MonogramInverted from "@/components/icons/MonogramInverted";
import Monogram from "@/components/icons/Monogram";
import { anim } from "@/utils/animate";

export default function Preloader({ progress, total }) {

  const iconAnimation = {
    initial: {
      opacity: 1,
    },
    enter: {
      opacity: 1,
      transition: { duration: 5, ease: [0, 0.55, 0.45, 1] },
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.5, ease: [0, 0.55, 0.45, 1] },
    },
  };

  return (
    <motion.div className="preloader grid">
      <div className="progress">
        <span suppressHydrationWarning>{progress}</span>
      </div>
      <div className="total">
        <span>{total}</span>
      </div>
    </motion.div>
  );
}
