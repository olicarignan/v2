import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { useContext, useRef } from "react";

import { TransitionContext } from "@/context/TransitionProvider";
import { getPropData } from "@/utils/propData";
import { getInfo } from "@/gql/queries.js";

export default function Info({ info }) {
  const container = useRef(null);
  const { clients, services } = info;
  const { timeline } = useContext(TransitionContext);

  useGSAP(
    () => {
      gsap.fromTo(
        container.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.3, ease: "power1.inOut" }
      );
      timeline.add(
        gsap.to(container.current, {
          opacity: 0,
          duration: 0.3,
          ease: "power1.inOut",
        })
      );
    },
    { scope: container }
  );

  return (
    <div className="grid" ref={container}>
      <main className="info">
        <div className="hero">
          <p>
            Olivier Carignan
            <sup>
              <span className="serif">{"("}</span>
              <span className="sans">©</span>
              <span className="serif">{")"}</span>
            </sup>
            &nbsp;is conducting an independent design-led development and
            multidisciplinary design practice. I partner with studios, brands
            and individuals worldwide to build thoughtful, expressive digital
            experiences at the intersection of design, technology, and culture.
          </p>
        </div>

        <div className="body">
          <article className="contact">
            <h2>Contact</h2>
            <p>
              If you would like more information about my practice or want to
              discuss a project or idea, please get in touch.
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
          </article>

          <article className="services">
            <h2>Services</h2>
            <ul>
              {services.map((service) => {
                return <li key={service.id}>{service.listItem}</li>;
              })}
            </ul>
          </article>

          <article className="clients">
            <h2>Clients</h2>
            <ul>
              {clients.map((client) => {
                return <li key={client.id}>{client.listItem}</li>;
              })}
            </ul>
          </article>
        </div>
      </main>
    </div>
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
