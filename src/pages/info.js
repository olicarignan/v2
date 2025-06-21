export default function Info() {
  return (
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
          multidisciplinary design practice. I partner with studios, brands and
          individuals worldwide to build thoughtful, expressive digital
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
              <a href="mailto:hi@oliviercarignan.com">hi@oliviercarignan.com</a>
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
            <li>Digital Design</li>
            <li>Art Direction</li>
            <li>Branding & Identity</li>
            <li>Interaction Design</li>
            <li>Research & Strategy</li>
            <li>Product Design</li>
            <li>Experimental Development</li>
          </ul>
        </article>

        <article className="clients">
          <h2>Clients</h2>
          <ul>
            <li>Apple</li>
            <li>WØRKS</li>
            <li>RTINGS.com</li>
            <li>Evenko</li>
            <li>POP Montreal</li>
            <li>ARC Health</li>
            <li>Rounder</li>
          </ul>
        </article>
      </div>
    </main>
  );
}
