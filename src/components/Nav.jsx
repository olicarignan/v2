"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { delay, motion } from "motion/react";
import { anim } from "@/utils/animate";
import { AnimatePresence } from "motion/react";

export default function Nav() {
  const [time, setTime] = useState(new Date());
  const router = useRouter();

  const isActive = (path) => {
    return router.pathname === path ? "active" : "";
  };

  useEffect(() => {
    const updateTime = () => {
      setTime(new Date());
    };
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const slideIn = {
    initial: {
      y: "-100%",
      opacity: 0,
    },
    enter: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        delay: 0.75,
        ease: [0, 0.55, 0.45, 1],
      },
    },
    exit: {
      y: 0,
      opacity: 0,
    },
  };

  return (
    <AnimatePresence mode="wait" initial="hidden">
      <nav className="nav">
        <div className="wrapper">
          <Link
            className="logo"
            href="/"
          >
            <motion.div {...anim(slideIn)} className="monogram">
              ©
            </motion.div>
            <motion.span {...anim(slideIn)} className="wordmark">
              Olivier Carignan
            </motion.span>
          </Link>
        </div>
        <div className="menu">
          <div className="wrapper">
            <motion.div {...anim(slideIn)}>
              <Link
                className={"menu__item item--first " + isActive("/")}
                href="/"
              >
                Work
              </Link>
            </motion.div>
          </div>
          <div className="wrapper">
            <motion.div {...anim(slideIn)}>
              <Link
                className={"menu__item item--second " + isActive("/info")}
                href="/info"
              >
                Info
              </Link>
            </motion.div>
          </div>
        </div>
        <div className="wrapper">
          <motion.div className="clock" {...anim(slideIn)}>
            <span className="time" suppressHydrationWarning>
              {time.toLocaleTimeString([], {
                timeZone: "America/New_York",
                timeZoneName: "short",
                hour: "2-digit",
                minute: "2-digit",
                hour12: false,
              })}
            </span>
          </motion.div>
        </div>
      </nav>
    </AnimatePresence>
  );
}
