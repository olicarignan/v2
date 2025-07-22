"use client";

import { motion } from "motion/react";

import { getPropData } from "@/utils/propData";
import { getInfo } from "@/gql/queries.js";
import Montreal from "@/components/icons/Montreal";
import Layout from "@/layouts/Layout";
import { anim } from "@/utils/animate";
import { useMobile } from "@/hooks/useMobile";

export default function Info({ info }) {
  const { clients, services } = info;
  const isMobile = useMobile();

  const line = {
    initial: {
      width: 0,
    },
    enter: {
      width: "100%",
      transition: {
        duration: 0.5,
        ease: [0, 0.55, 0.45, 1],
      },
    },
    exit: {
      width: "100%",
    },
  };

  const body = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.3,
        ease: [0, 0.55, 0.45, 1],
        when: "beforeChildren",
        staggerChildren: 0.05,
      },
    },
  };

  const article = (isMobile) => {
    if (isMobile) {
      return {
        hidden: {
          filter: "blur(10px)",
          opacity: 0,
          x: "-100%",
          y: 0,
          transition: { duration: 0.3, ease: [0.32, 0, 0.67, 0] },
        },
        visible: {
          filter: "blur(0px)",
          opacity: 1,
          x: 0,
          y: 0,
          transition: { duration: 0.3, ease: [0, 0.55, 0.45, 1] },
        },
      };
    }

    return {
      hidden: {
        filter: "blur(10px)",
        opacity: 0,
        y: "-100%",
        x: 0,
        transition: { duration: 0.5, ease: [0.32, 0, 0.67, 0] },
      },
      visible: {
        filter: "blur(0px)",
        opacity: 1,
        y: 0,
        x: 0,
        transition: { duration: 0.5, ease: [0, 0.55, 0.45, 1] },
      },
    };
  };

  const hero = {
    initial: {
      filter: "blur(10px)",
      opacity: 0,
      y: -25,
      transition: { duration: 0.5, ease: [0.32, 0, 0.67, 0] },
    },
    enter: {
      filter: "blur(0px)",
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: [0, 0.55, 0.45, 1] },
    },
    exit: {
      filter: "blur(0px)",
      opacity: 0.5,
      y: 0,
      transition: { duration: 0.5, ease: [0.32, 0, 0.67, 0] },
    },
  };

  return (
    <Layout>
      <main className="info">
        <div className="info__wrapper">
          <div className="hero">
            <motion.p {...anim(hero)}>
              Olivier Carignan
              <sup>
                <span className="serif">{"("}</span>
                <span className="sans">©</span>
                <span className="serif">{")"}</span>
              </sup>
              &nbsp;is conducting an independent design-led development and
              multidisciplinary design practice. I partner with studios, brands
              and individuals worldwide to build thoughtful, expressive digital
              experiences at the intersection of design, technology, and
              culture.
            </motion.p>
          </div>

          <motion.div {...anim(line)} className="divider" />
          <motion.div
            variants={body}
            animate="visible"
            initial="hidden"
            className="body"
          >
            <motion.article variants={article(isMobile)} className="contact">
              <div className="contact__inner">
                <h2>Contact</h2>
                <p>
                  If you would like more information about my practice or want
                  to discuss a project or idea, please get in touch.
                  <br />
                  <br />
                </p>
                <div className="links">
                  <span>
                    <a href="mailto:hi@oliviercarignan.com">
                      hi@oliviercarignan.com
                    </a>
                  </span>
                  <span>
                    <a
                      href="https://www.instagram.com/olivier_c___/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      @olivier_c___
                    </a>
                  </span>
                </div>
              </div>
              <span className="mtl">
                <Montreal /> Based in Montreal, Canada
              </span>
            </motion.article>

            <motion.article variants={article(isMobile)} className="services">
              <h2>Services</h2>
              <ul>
                {services.map((service) => {
                  return <li key={service.id}>{service.listItem}</li>;
                })}
              </ul>
            </motion.article>

            <motion.article variants={article(isMobile)} className="clients">
              <h2>Clients</h2>
              <ul>
                {clients.map((client) => {
                  return <li key={client.id}>{client.listItem}</li>;
                })}
              </ul>
            </motion.article>
          </motion.div>
        </div>
        <div className="copyright">© 2025</div>
      </main>
    </Layout>
  );
}

export const getStaticProps = async () => {
  const info = await getPropData(getInfo);

  return {
    props: {
      ...info,
    },
  };
};
