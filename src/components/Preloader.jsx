"use client";

import { motion } from "motion/react";

import MonogramInverted from "@/components/icons/MonogramInverted";
import Monogram from "@/components/icons/Monogram";
import { anim } from "@/utils/animate";

export default function Preloader({
  progress,
  total
}) {

  console.log(progress)

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
    <div className="preloader grid">
      <div className="preloader__inner">
        {/* <motion.div {...anim(OAnimation)} className="icon o">
          <O />
        </motion.div>
        <motion.div {...anim(CAnimation)} className="icon c">
          <C />
        </motion.div> */}

        <motion.div {...anim(iconAnimation)} className="icon monogram">
          <Monogram />
        </motion.div>

        <motion.div className="icon monogram--inverted">
          <MonogramInverted />
        </motion.div>
      </div>
    </div>
  );
}
