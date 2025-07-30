"use client";

import { delay, motion } from "motion/react";
import { anim } from "@/utils/animate";

export default function Monogram(fill) {


  const OAnimation = {
    initial: {
      opacity: 0,
      fillOpacity: 0,
      fill: "rgba(0, 0, 0, 0)",
      filter: "drop-shadow(0 0 10rem rgba(252, 251, 248, 1))",
    },
    enter: {
      opacity: 1,
      fillOpacity: 1,
      fill: "var(--text-color)",
      filter: "drop-shadow(0 0 10rem rgba(252, 251, 248, 0))",
      transition: {
        type: "tween",
        duration: 0.5,
        ease: [0, 0.55, 0.45, 1],
      },
    },
    exit: {
      opacity: 0,
      x: 0,
    },
  };

  const CAnimation = {
    initial: {
      y: "100%",
      opacity: 0,
      filter: "blur(20px)",
    },
    enter: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { type: "tween", duration: 0.5, ease: [0, 0.55, 0.45, 1] },
    },
    exit: {
      opacity: 0,
      y: 0,
      filter: "blur(20px)",
      transition: { type: "tween", duration: 0.5, ease: [0, 0.55, 0.45, 1] },
    },
  };

  const MonogramAnimation = {
    initial: {
      opacity: 0,
      filter: "blur(20px)",
    },
    enter: {
      opacity: 1,
      filter: "blur(0px)",
      transition: { type: "tween", duration: 0.5, ease: [0, 0.55, 0.45, 1] },
    },
    exit: {
      opacity: 0,
      filter: "blur(20px)",
      transition: { type: "tween", duration: 0.5, ease: [0, 0.55, 0.45, 1] },
    },
  }

  return (
    <div className="wrapper">
      <motion.svg
        // {...anim(MonogramAnimation)}
        width="400"
        height="401"
        viewBox="0 0 400 401"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          {...anim(CAnimation)}
          className="c monogram__icon"
          d="M279.623 99.7629L283.936 165.271H275.886C262.661 132.371 243.399 115.485 215.511 115.485C182.737 115.485 159.45 146.638 159.45 203.12C159.45 253.198 183.024 283.477 222.124 283.477C248.861 283.477 265.536 269.793 279.911 246.792L287.961 251.742C271.573 284.35 246.849 301.237 209.187 301.237C152.262 301.237 107.125 257.856 107.125 203.411C107.125 145.182 154.85 99.7629 210.624 99.7629C236.786 99.7629 250.011 111.118 258.923 111.118C264.098 111.118 268.123 108.497 270.998 99.7629H279.623Z"
          fill={fill}
        />
        <motion.path
          {...anim(OAnimation)}
          className="o monogram__icon"
          d="M200 0.5C310.457 0.5 400 90.0431 400 200.5C400 310.957 310.457 400.5 200 400.5C89.5431 400.5 0 310.957 0 200.5C0 90.0431 89.5431 0.5 200 0.5ZM200.607 19.6494C149.792 19.6494 120.488 48.6818 105.632 74.4102C90.7754 100.138 76.5957 141.829 76.5957 190.821C76.5957 239.813 80.31 279.918 107.447 326.912C128.404 363.203 167.941 380.743 200.607 380.743C233.274 380.743 272.596 365.674 294.979 326.912C317.361 288.15 324.62 248.887 324.62 190.821C324.62 132.756 310.706 100.601 295.583 74.4102C280.46 48.2195 251.422 19.6494 200.607 19.6494Z"
          fill={fill}
        />
      </motion.svg>
    </div>
  );
}