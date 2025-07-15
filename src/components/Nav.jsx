'use client'

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import Monogram from "./icons/Monogram";

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

  return (
    <nav className="nav">
      <div>
        <Link className="logo" href="/">
          <div className="monogram">
            <Monogram />
          </div>
          <span className="wordmark">Olivier Carignan</span>
        </Link>
      </div>
      <div className="menu">
        <Link className={"menu__item item--first " + isActive("/")} href="/">
          Work
        </Link>
        <Link
          className={"menu__item item--second " + isActive("/info")}
          href="/info"
        >
          Info
        </Link>
      </div>
      <div className="clock">
        <span className="time" suppressHydrationWarning>
          {time.toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
            hour12: false,
          })}
          &nbsp;EST
        </span>
      </div>
    </nav>
  );
}
