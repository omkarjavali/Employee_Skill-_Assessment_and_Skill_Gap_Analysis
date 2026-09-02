import { useNavigate } from "react-router-dom";
import "./Home.css";


function Home() {

  const navigate = useNavigate();


  // =========================================================
  // NAVIGATION
  // =========================================================

  const handleGetStarted = () => {
    navigate("/register");
  };


  const handleLogin = () => {
    navigate("/login");
  };


  return (

    <div className="home-page">


      {/* =====================================================
          NAVBAR
      ===================================================== */}

      <header className="home-navbar">

        <div className="home-navbar-inner">


          {/* BRAND */}

          <button
            type="button"
            className="home-brand"
            onClick={() => navigate("/")}
          >

            <div className="home-brand-logo">
              AI
            </div>

            <div className="home-brand-text">

              <strong>
                Skill Assessment
              </strong>

              <span>
                AI-powered assessment
              </span>

            </div>

          </button>


          {/* NAVIGATION */}

          <nav className="home-navigation">

            <a href="#how-it-works">
              How it works
            </a>

            <a href="#features">
              Features
            </a>

          </nav>


          {/* ACTIONS */}

          <div className="home-navbar-actions">

            <button
              type="button"
              className="home-login-button"
              onClick={handleLogin}
            >
              Login
            </button>

            <button
              type="button"
              className="home-nav-cta"
              onClick={handleGetStarted}
            >
              Get Started
            </button>

          </div>

        </div>

      </header>


      {/* =====================================================
          HERO
      ===================================================== */}

      <main>


        <section className="home-hero">

          <div className="home-hero-background" />


          <div className="home-hero-inner">


            {/* HERO COPY */}

            <div className="home-hero-copy">


              <div className="home-hero-badge">

                <span className="home-badge-dot" />

                Adaptive skill assessment

              </div>


              <h1>

                Discover what you know.

                <span>
                  Understand what to improve.
                </span>

              </h1>


              <p>

                Assess your skills with an adaptive
                assessment experience that adjusts to
                your performance and gives you a clear
                picture of where you stand.

              </p>


              <div className="home-hero-actions">

                <button
                  type="button"
                  className="home-primary-button"
                  onClick={handleGetStarted}
                >

                  Start Your Assessment

                  <span>
                    →
                  </span>

                </button>


                <button
                  type="button"
                  className="home-secondary-button"
                  onClick={handleLogin}
                >

                  Sign In

                </button>

              </div>


              <div className="home-hero-note">

                <span>
                  ✓
                </span>

                Personalized assessment experience

              </div>


            </div>


            {/* HERO VISUAL */}

            <div className="home-hero-visual">


              <div className="home-dashboard-card">


                <div className="home-dashboard-top">

                  <div>

                    <span>
                      CURRENT ASSESSMENT
                    </span>

                    <h3>
                      SQL
                    </h3>

                  </div>


                  <div className="home-mini-status">
                    Active
                  </div>

                </div>


                {/* LEVEL */}

                <div className="home-level-card">

                  <div className="home-level-heading">

                    <div>

                      <span>
                        CURRENT LEVEL
                      </span>

                      <strong>
                        Level 2
                      </strong>

                    </div>


                    <div className="home-level-number">
                      2
                    </div>

                  </div>


                  <div className="home-progress">

                    <div className="home-progress-track">

                      <div className="home-progress-fill" />

                    </div>


                    <div className="home-progress-labels">

                      <span>
                        Beginner
                      </span>

                      <span>
                        Intermediate
                      </span>

                      <span>
                        Advanced
                      </span>

                    </div>

                  </div>

                </div>


                {/* STATS */}

                <div className="home-dashboard-stats">


                  <div className="home-stat-card">

                    <span className="home-stat-icon">
                      ✓
                    </span>

                    <div>

                      <strong>
                        82%
                      </strong>

                      <span>
                        Performance
                      </span>

                    </div>

                  </div>


                  <div className="home-stat-card">

                    <span className="home-stat-icon purple">
                      ◇
                    </span>

                    <div>

                      <strong>
                        2
                      </strong>

                      <span>
                        Skills assessed
                      </span>

                    </div>

                  </div>

                </div>


                {/* SKILL GAP */}

                <div className="home-skill-card">

                  <div className="home-skill-card-heading">

                    <div>

                      <span>
                        SKILL GAP
                      </span>

                      <strong>
                        SQL Analytics
                      </strong>

                    </div>

                    <span className="home-gap-badge">
                      1 gap
                    </span>

                  </div>


                  <div className="home-skill-lines">

                    <div>

                      <span>
                        Query Fundamentals
                      </span>

                      <div className="home-skill-line">

                        <div
                          className="home-skill-line-fill"
                          style={{
                            width: "75%"
                          }}
                        />

                      </div>

                    </div>


                    <div>

                      <span>
                        Advanced Analytics
                      </span>

                      <div className="home-skill-line">

                        <div
                          className="home-skill-line-fill medium"
                          style={{
                            width: "48%"
                          }}
                        />

                      </div>

                    </div>

                  </div>

                </div>


              </div>


              {/* FLOATING CARD */}

              <div className="home-floating-card">

                <div className="home-floating-icon">
                  ✦
                </div>

                <div>

                  <strong>
                    Adaptive assessment
                  </strong>

                  <span>
                    Questions adjust to your level
                  </span>

                </div>

              </div>


            </div>

          </div>

        </section>


        {/* ===================================================
            TRUST STRIP
        =================================================== */}

        <section className="home-trust">

          <div className="home-trust-inner">

            <span>
              BUILT FOR MEANINGFUL SKILL DISCOVERY
            </span>


            <div className="home-trust-items">

              <div>
                <strong>
                  Adaptive
                </strong>

                <span>
                  Difficulty
                </span>
              </div>


              <div>
                <strong>
                  Detailed
                </strong>

                <span>
                  Evaluation
                </span>
              </div>


              <div>
                <strong>
                  Actionable
                </strong>

                <span>
                  Skill Gaps
                </span>
              </div>


              <div>
                <strong>
                  Transparent
                </strong>

                <span>
                  Results
                </span>
              </div>

            </div>

          </div>

        </section>


        {/* =====================================================
            HOW IT WORKS
        ===================================================== */}

        <section
          id="how-it-works"
          className="home-how"
        >

          <div className="home-section-heading">

            <span className="home-section-eyebrow">
              HOW IT WORKS
            </span>

            <h2>
              From assessment to insight.
            </h2>

            <p>
              The platform turns an assessment into
              a clear understanding of your current
              capability and areas to develop.
            </p>

          </div>


          <div className="home-process">


            <div className="home-process-card">

              <div className="home-process-number">
                01
              </div>

              <div className="home-process-icon">
                ◎
              </div>

              <h3>
                Assess
              </h3>

              <p>
                Answer questions designed around
                different levels of skill and
                competency.
              </p>

            </div>


            <div className="home-process-connector" />


            <div className="home-process-card">

              <div className="home-process-number">
                02
              </div>

              <div className="home-process-icon">
                ↗
              </div>

              <h3>
                Adapt
              </h3>

              <p>
                Your performance influences the
                difficulty of the next questions.
              </p>

            </div>


            <div className="home-process-connector" />


            <div className="home-process-card">

              <div className="home-process-number">
                03
              </div>

              <div className="home-process-icon">
                ◈
              </div>

              <h3>
                Analyze
              </h3>

              <p>
                See your final proficiency level and
                detailed competency performance.
              </p>

            </div>


            <div className="home-process-connector" />


            <div className="home-process-card">

              <div className="home-process-number">
                04
              </div>

              <div className="home-process-icon">
                ✦
              </div>

              <h3>
                Improve
              </h3>

              <p>
                Identify specific skill gaps and
                understand where to focus next.
              </p>

            </div>

          </div>

        </section>


        {/* =====================================================
            FEATURES
        ===================================================== */}

        <section
          id="features"
          className="home-features"
        >

          <div className="home-section-heading">

            <span className="home-section-eyebrow">
              THE PLATFORM
            </span>

            <h2>
              More than just a score.
            </h2>

            <p>
              Understand the story behind your
              assessment result.
            </p>

          </div>


          <div className="home-feature-grid">


            <article className="home-feature-card featured">

              <div className="home-feature-icon">
                ↗
              </div>

              <div>

                <span className="home-feature-label">
                  ADAPTIVE
                </span>

                <h3>
                  Assess at your level
                </h3>

                <p>
                  The assessment adapts as you
                  demonstrate your knowledge,
                  helping create a more meaningful
                  measure of your current ability.
                </p>

              </div>

            </article>


            <article className="home-feature-card">

              <div className="home-feature-icon purple">
                ◇
              </div>

              <span className="home-feature-label">
                EVALUATION
              </span>

              <h3>
                Understand your performance
              </h3>

              <p>
                Go beyond a final score with
                competency and concept-level
                evaluation.
              </p>

            </article>


            <article className="home-feature-card">

              <div className="home-feature-icon green">
                ✓
              </div>

              <span className="home-feature-label">
                SKILL GAP
              </span>

              <h3>
                Find where you need to improve
              </h3>

              <p>
                Identify specific areas where your
                demonstrated skill falls below the
                expected level.
              </p>

            </article>


            <article className="home-feature-card">

              <div className="home-feature-icon orange">
                ≡
              </div>

              <span className="home-feature-label">
                TRANSPARENT
              </span>

              <h3>
                Review your answers
              </h3>

              <p>
                Revisit the questions you attempted
                and the answers you submitted after
                completing an assessment.
              </p>

            </article>

          </div>

        </section>


        {/* =====================================================
            CTA
        ===================================================== */}

        <section className="home-final-cta">

          <div className="home-final-cta-inner">

            <div>

              <span className="home-section-eyebrow">
                READY TO DISCOVER YOUR LEVEL?
              </span>

              <h2>
                Turn your knowledge into insight.
              </h2>

              <p>
                Start an assessment and get a clearer
                picture of your skills.
              </p>

            </div>


            <button
              type="button"
              className="home-primary-button light"
              onClick={handleGetStarted}
            >

              Get Started

              <span>
                →
              </span>

            </button>

          </div>

        </section>

      </main>


      {/* =====================================================
          FOOTER
      ===================================================== */}

      <footer className="home-footer">

        <div className="home-footer-inner">


          <div className="home-footer-brand">

            <div className="home-brand-logo">
              AI
            </div>

            <div>

              <strong>
                Skill Assessment
              </strong>

              <span>
                AI-powered assessment
              </span>

            </div>

          </div>


          <p>
            Adaptive skill assessment and
            performance insights.
          </p>


          <span className="home-footer-copy">
            © {new Date().getFullYear()} Skill Assessment
          </span>

        </div>

      </footer>

    </div>

  );
}


export default Home;