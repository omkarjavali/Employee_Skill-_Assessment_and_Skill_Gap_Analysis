import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import api from "../services/api";
import "./SkillGapOverview.css";

const LEVELS = [1, 2, 3, 4, 5];

const normalizeClassification = (value) =>
  String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");

const uniqueById = (items = []) => {
  const seen = new Set();

  return items.filter((item) => {
    const id =
      item?.concept_id ??
      item?.id ??
      item?.rubric_id ??
      JSON.stringify(item);

    if (seen.has(id)) {
      return false;
    }

    seen.add(id);
    return true;
  });
};

const getConcepts = (analysis) => {
  const competencyConcepts = (analysis?.gaps || []).flatMap(
    (competency) => competency?.concepts || []
  );

  const evidenceConcepts = (analysis?.evidence || [])
    .filter((item) => item?.concept_id)
    .map((item) => ({
      id: item.concept_id,
      name: item.concept_name,
      description: "",
      percentage: Number(item.percentage) || 0,
      classification: item.classification,
      competency_id: item.competency_id,
      competency_name: item.competency_name,
    }));

  // Backend concept aggregates are authoritative.
  // Evidence is only used for concepts missing from the aggregate.
  const byId = new Map();

  competencyConcepts.forEach((concept) => {
    const id = concept?.id ?? concept?.concept_id;

    if (id == null) {
      return;
    }

    byId.set(String(id), {
      ...concept,
      id,
      percentage: Number(concept.percentage) || 0,
      classification:
        concept.classification ||
        (Number(concept.percentage) >= 80
          ? "STRENGTH"
          : "GAP"),
    });
  });

  evidenceConcepts.forEach((concept) => {
    const id = concept?.id;

    if (id == null || byId.has(String(id))) {
      return;
    }

    byId.set(String(id), concept);
  });

  return Array.from(byId.values());
};

const getSkillMetrics = (analysis) => {
  const concepts = getConcepts(analysis);

  const strengths = concepts.filter(
    (concept) =>
      normalizeClassification(concept.classification) ===
      "STRENGTH"
  );

  const developmentAreas = concepts.filter((concept) =>
    [
      "DEVELOPMENT",
      "DEVELOPMENT_AREA",
      "DEVELOPMENT_AREAS",
    ].includes(
      normalizeClassification(concept.classification)
    )
  );

  const gaps = Array.isArray(analysis?.gaps)
    ? analysis.gaps
    : [];

  return {
    concepts,
    strengths,
    developmentAreas,
    gaps,

    strengthCount: strengths.length,
    developmentCount: developmentAreas.length,
    gapCount: gaps.length,

    surplus: Number(analysis?.surplus) || 0,
    gap: Number(analysis?.gap) || 0,
  };
};

const getStatus = (analysis) => {
  const status = normalizeClassification(analysis?.status);

  if (status === "ABOVE_EXPECTATION") {
    return {
      label: "Above expectation",
      className: "above-expectation",
      icon: "↑",
    };
  }

  if (status === "MEETS_EXPECTATION") {
    return {
      label: "Meets expectation",
      className: "meets-expectation",
      icon: "✓",
    };
  }

  return {
    label: "Skill gap",
    className: "skill-gap",
    icon: "!",
  };
};

const getSkillIcon = (skillName) => {
  const name = String(skillName || "").toLowerCase();

  if (name.includes("excel")) return "📗";
  if (name.includes("power bi")) return "📊";
  if (name.includes("sql")) return "🗄️";
  if (name.includes("python")) return "🐍";
  if (name.includes("communication")) return "💬";

  return "🧠";
};

function LevelScale({ currentLevel, expectedLevel }) {
  const current = Math.min(
    Math.max(Number(currentLevel) || 0, 0),
    5
  );

  const expected = Math.min(
    Math.max(Number(expectedLevel) || 0, 0),
    5
  );

  return (
    <div
      className="skill-journey"
      aria-label={`Current level ${current}, expected level ${expected}`}
    >
      <div className="skill-journey-track">
        <div className="skill-journey-line">
          <div
            className="skill-journey-progress"
            style={{
              width: `${((current - 1) / 4) * 100}%`,
            }}
          />

          {expected > current && (
            <div
              className="skill-journey-gap"
              style={{
                left: `${((current - 1) / 4) * 100}%`,
                width: `${((expected - current) / 4) * 100}%`,
              }}
            />
          )}
        </div>

        {LEVELS.map((level) => {
          const isCurrent = level === current;
          const isExpected = level === expected;

          return (
            <div
              key={level}
              className={[
                "skill-journey-step",
                isCurrent
                  ? "is-current"
                  : "",
                isExpected
                  ? "is-expected"
                  : "",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              <div className="skill-journey-marker">
                {isExpected && !isCurrent ? (
                  <span className="expected-marker">
                    ◆
                  </span>
                ) : isCurrent ? (
                  <span className="current-marker">
                    {level}
                  </span>
                ) : (
                  <span className="normal-marker" />
                )}
              </div>

              <span className="skill-journey-number">
                {level}
              </span>

              {isCurrent && (
                <span className="skill-journey-label current-label">
                  Current
                </span>
              )}

              {isExpected && !isCurrent && (
                <span className="skill-journey-label expected-label">
                  Target
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Metric({ value, label, tone }) {
  return (
    <div className={`skill-metric ${tone || ""}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </div>
  );
}

function SkillGapOverview() {
  const navigate = useNavigate();

  const [assessments, setAssessments] = useState([]);
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSkillGapOverview();
  }, []);

  const loadSkillGapOverview = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("🔥 Loading Skill Gap Overview");

      const assessmentResponse =
        await api.get("/assessments");

      const assessmentList = Array.isArray(
        assessmentResponse.data
      )
        ? assessmentResponse.data
        : [];

      setAssessments(assessmentList);

      const completedAssessments =
        assessmentList.filter(
          (assessment) =>
            normalizeClassification(
              assessment.status
            ) === "COMPLETED"
        );

      const results = await Promise.all(
        completedAssessments.map(async (assessment) => {
          try {
            const response = await api.get(
              `/skill-gap/assessments/${assessment.id}`
            );

            let analysis = response.data;

            if (
              analysis?.data &&
              typeof analysis.data === "object"
            ) {
              analysis = analysis.data;
            }

            if (
              !analysis ||
              typeof analysis !== "object"
            ) {
              return null;
            }

            return {
              ...analysis,

              assessment_id:
                analysis.assessment_id ??
                assessment.id,

              skill_id:
                analysis.skill_id ??
                assessment.skill_id,

              skill_name:
                analysis.skill_name ??
                assessment.skill_name,
            };
          } catch (err) {
            console.warn(
              `⚠️ No analysis found for assessment ${assessment.id}`,
              err.response?.data || err
            );

            return null;
          }
        })
      );

      setAnalyses(results.filter(Boolean));
    } catch (err) {
      console.error(
        "❌ Skill Gap Overview Error:",
        err.response?.data || err
      );

      const detail = err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Unable to load skill gap overview."
      );
    } finally {
      setLoading(false);
    }
  };

  const skillAnalyses = useMemo(() => {
    const latestBySkill = {};

    const completedAssessmentList =
      assessments
        .filter(
          (assessment) =>
            normalizeClassification(
              assessment.status
            ) === "COMPLETED"
        )
        .sort((a, b) => {
          const dateA =
            a.completed_at || a.started_at
              ? new Date(
                  a.completed_at || a.started_at
                )
              : new Date(0);

          const dateB =
            b.completed_at || b.started_at
              ? new Date(
                  b.completed_at || b.started_at
                )
              : new Date(0);

          return dateB - dateA;
        });

    completedAssessmentList.forEach(
      (assessment) => {
        const matchingAnalysis = analyses.find(
          (analysis) =>
            Number(analysis.assessment_id) ===
            Number(assessment.id)
        );

        if (!matchingAnalysis) {
          return;
        }

        const skillId =
          assessment.skill_id ??
          matchingAnalysis.skill_id;

        if (
          !skillId ||
          latestBySkill[skillId]
        ) {
          return;
        }

        latestBySkill[skillId] = {
          ...matchingAnalysis,

          assessment_started_at:
            assessment.started_at,

          assessment_completed_at:
            assessment.completed_at,
        };
      }
    );

    analyses.forEach((analysis) => {
      const skillId = analysis.skill_id;

      if (
        skillId &&
        !latestBySkill[skillId]
      ) {
        latestBySkill[skillId] = analysis;
      }
    });

    return Object.values(latestBySkill);
  }, [assessments, analyses]);

  const overview = useMemo(() => {
    return skillAnalyses.reduce(
      (totals, analysis) => {
        const metrics =
          getSkillMetrics(analysis);

        return {
          skills: totals.skills + 1,

          strengths:
            totals.strengths +
            metrics.strengthCount,

          development:
            totals.development +
            metrics.developmentCount,

          gaps:
            totals.gaps +
            metrics.gapCount,
        };
      },
      {
        skills: 0,
        strengths: 0,
        development: 0,
        gaps: 0,
      }
    );
  }, [skillAnalyses]);

  if (loading) {
    return (
      <div className="skill-gap-overview-state">
        <div className="skill-gap-overview-loader" />
        <p>
          Loading your skill profile...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="skill-gap-overview-state skill-gap-overview-error">
        <div className="state-icon">!</div>

        <h2>
          Unable to load Skill Gap
        </h2>

        <p>{error}</p>

        <div className="skill-gap-overview-actions">
          <button onClick={loadSkillGapOverview}>
            Try Again
          </button>

          <button
            onClick={() =>
              navigate("/assessments")
            }
            className="secondary"
          >
            View Assessments
          </button>
        </div>
      </div>
    );
  }

  if (skillAnalyses.length === 0) {
    return (
      <div className="skill-gap-overview-page">
        <header className="skill-gap-overview-header">
          <div>
            <p className="skill-gap-overview-eyebrow">
              SKILL GAP
            </p>

            <h1>
              Your Skill Development
            </h1>

            <p className="skill-gap-overview-subtitle">
              Complete an assessment to see
              your skill gaps, strengths and
              development priorities.
            </p>
          </div>
        </header>

        <div className="skill-gap-empty-card">
          <div className="skill-gap-empty-icon">
            📊
          </div>

          <h2>
            No completed skill analyses yet
          </h2>

          <p>
            Complete a skill assessment to
            generate your first Skill Gap
            Analysis.
          </p>

          <button
            onClick={() =>
              navigate("/assessments")
            }
          >
            View Assessments
            <span>→</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="skill-gap-overview-page">
      <header className="skill-gap-overview-header">
        <div className="overview-heading">
          <p className="skill-gap-overview-eyebrow">
            SKILL GAP
          </p>

          <h1>
            Your Skill Development
          </h1>

          <p className="skill-gap-overview-subtitle">
            Your latest assessment results,
            skill levels and development
            priorities — all in one place.
          </p>

          <div className="overview-header-tags">
            <span>
              ✓ Latest results
            </span>

            <span>
              ● {overview.skills} skill
              {overview.skills === 1
                ? ""
                : "s"} assessed
            </span>
          </div>
        </div>

        <div className="skill-gap-count">
          <strong>
            {overview.skills}
          </strong>

          <span>
            {overview.skills === 1
              ? "Skill"
              : "Skills"}
          </span>
        </div>
      </header>

      <section className="overview-summary">
        <div className="overview-summary-card strengths">
          <div className="summary-icon">
            💪
          </div>

          <div>
            <strong>
              {overview.strengths}
            </strong>

            <span>
              Strengths
            </span>
          </div>

          <small>
            Strong concepts identified
          </small>
        </div>

        <div className="overview-summary-card development">
          <div className="summary-icon">
            🌱
          </div>

          <div>
            <strong>
              {overview.development}
            </strong>

            <span>
              Development Areas
            </span>
          </div>

          <small>
            Areas to keep building
          </small>
        </div>

        <div className="overview-summary-card gaps">
          <div className="summary-icon">
            ⚠️
          </div>

          <div>
            <strong>
              {overview.gaps}
            </strong>

            <span>
              Priority Gaps
            </span>
          </div>

          <small>
            Competencies below target
          </small>
        </div>
      </section>

      <section className="skill-gap-overview-section">
        <div className="skill-gap-overview-section-heading">
          <div>
            <p>
              SKILL OVERVIEW
            </p>

            <h2>
              Your Skills
            </h2>
          </div>

          <span className="section-count">
            {skillAnalyses.length}
          </span>
        </div>

        <div className="skill-gap-cards">
          {skillAnalyses.map(
            (analysis) => {
              const finalLevel =
                Math.min(
                  Math.max(
                    Number(
                      analysis.final_level
                    ) || 0,
                    0
                  ),
                  5
                );

              const expectedLevel =
                Math.min(
                  Math.max(
                    Number(
                      analysis.expected_level
                    ) || 0,
                    0
                  ),
                  5
                );

              const metrics =
                getSkillMetrics(
                  analysis
                );

              const status =
                getStatus(analysis);

              return (
                <article
                  className={`skill-gap-skill-card ${status.className}`}
                  key={`${analysis.skill_id}-${analysis.assessment_id}`}
                >
                  <div className="skill-card-accent" />

                  <div className="skill-gap-skill-card-top">
                    <div className="skill-card-identity">
                      <div className="skill-gap-skill-icon">
                        {getSkillIcon(
                          analysis.skill_name
                        )}
                      </div>

                      <div>
                        <h3>
                          {analysis.skill_name}
                        </h3>

                        <p className="skill-gap-skill-role">
                          {analysis.role_name}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`skill-gap-overview-status ${status.className}`}
                    >
                      <span>
                        {status.icon}
                      </span>

                      {status.label}
                    </div>
                  </div>

                  <div className="skill-card-level-header">
                    <div>
                      <span>
                        Current level
                      </span>

                      <strong>
                        {finalLevel}
                        <small>
                          /5
                        </small>
                      </strong>
                    </div>

                    <div className="level-target">
                      <span>
                        Expected level
                      </span>

                      <strong>
                        {expectedLevel}
                        <small>
                          /5
                        </small>
                      </strong>
                    </div>
                  </div>

                  <LevelScale
                    currentLevel={
                      finalLevel
                    }
                    expectedLevel={
                      expectedLevel
                    }
                  />

                  <div className="skill-gap-mini-summary">
                    <Metric
                      value={
                        metrics.strengthCount
                      }
                      label="Strengths"
                      tone="strength"
                    />

                    <Metric
                      value={
                        metrics.developmentCount
                      }
                      label="Development"
                      tone="development"
                    />

                    <Metric
                      value={
                        metrics.gapCount
                      }
                      label="Priority Gaps"
                      tone="gap"
                    />

                    <Metric
                      value={`+${metrics.surplus}`}
                      label="Surplus"
                      tone="surplus"
                    />
                  </div>

                  <button
                    className="skill-gap-view-button"
                    onClick={() =>
                      navigate(
                        `/skill-gap/${analysis.assessment_id}`
                      )
                    }
                  >
                    <span>
                      View full skill analysis
                    </span>

                    <span className="button-arrow">
                      →
                    </span>
                  </button>
                </article>
              );
            }
          )}
        </div>
      </section>

      <section className="skill-gap-overview-footer-card">
        <div>
          <p>
            KEEP BUILDING YOUR PROFILE
          </p>

          <h2>
            Continue your assessments
          </h2>

          <span>
            Complete more assessments to
            build a clearer picture of your
            strengths and development
            priorities.
          </span>
        </div>

        <button
          onClick={() =>
            navigate("/assessments")
          }
        >
          View Assessments
          <span>→</span>
        </button>
      </section>
    </div>
  );
}

export default SkillGapOverview;