"use client";

import { getPropData } from "@/utils/propData";
import { getInfo } from "@/gql/queries.js";

import Layout from "@/layouts/Layout";

export default function Info({ info }) {
  const { clients, services } = info;

  return (
    <Layout>
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
