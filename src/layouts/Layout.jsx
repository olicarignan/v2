'use client'

import { motion } from "motion/react";
import { useRouter } from "next/router";

import { anim } from "@/utils/animate";

export default function Layout({ children}) {

  const router = useRouter();

  const slideInfo = {
    inital: {
      x: "100vw",
      transition: { type: "tween", duration: 0 },
    },
    enter: {
      x: "100vw",
      transition: { type: "tween", duration: 0 },
    },
    exit: {
      x: 0,
      transition: { duration: 1, ease: [0.85, 0, 0.15, 1] },
    },
  };

  const slideHome = {
    initial: {
      x: "-100vw",
      transition: { type: "tween", duration: 0}
    },
    enter: {
      x: "-100vw",
      transition: { type: "tween", duration: 0}
    },
    exit: {
      x: 0,
      transition: { duration: 1, ease: [0.85, 0, 0.15, 1] },
    },
  };

  const perspectiveInfo = {
    initial: {
      x: 0,
      opacity: 1,
    },
    enter: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: 100,
      opacity: 0.5,
      transition: { duration: 1, ease: [0.85, 0, 0.15, 1] },
    },
  };

  const perspectiveHome = {
    initial: {
      x: 0,
      opacity: 1,
    },
    enter: {
      x: 0,
      opacity: 1,
    },
    exit: {
      x: -100,
      opacity: 0.5,
      transition: { duration: 1, ease: [0.85, 0, 0.15, 1] },
    }
  }

  const overlay = {
    initial: {
      opacity: 0,
    },
    enter: {
      opacity: 0,
      transition: { duration: 1, ease: [0.85, 0, 0.15, 1] },
    },
    exit: {
      opacity: 0.5,
      transition: { duration: 1, ease: [0.85, 0, 0.15, 1] },
    },
  };

  return (
    <div className="layout">
      <motion.div className="slide--loader" />
      <motion.div {...anim( router.pathname === "/" ? slideInfo : slideHome)} className="slide" />
      <motion.div {...anim( router.pathname === "/" ? perspectiveInfo : perspectiveHome)} className="perspective">
      <motion.div className="overlay" {...anim(overlay)} />
        <motion.div className="grid">
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}
