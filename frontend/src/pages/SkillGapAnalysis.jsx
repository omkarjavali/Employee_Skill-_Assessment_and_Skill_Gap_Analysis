import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import api from "../services/api";
import "./SkillGapAnalysis.css";


function SkillGapAnalysis() {

  const { assessmentId } = useParams();

  const [analysis, setAnalysis] =
    useState(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [showEvidence, setShowEvidence] =
    useState(false);


  // =========================================================
  // LOAD ANALYSIS
  // =========================================================

  useEffect(() => {
    loadAnalysis();
  }, [assessmentId]);


  const loadAnalysis = async () => {

    try {

      setLoading(true);
      setError("");

      console.log(
        "🔥 Loading Skill Gap Analysis:",
        assessmentId
      );

      const response =
        await api.get(
          `/skill-gap/assessments/${assessmentId}`
        );

      let data =
        response.data;

      // Handle { data: {...} }
      if (
        data?.data &&
        typeof data.data === "object"
      ) {
        data = data.data;
      }

      console.log(
        "✅ Skill Gap Analysis:",
        data
      );

      setAnalysis(data);

    } catch (err) {

      console.error(
        "❌ Skill Gap Analysis Error:",
        err.response?.data || err
      );

      const detail =
        err.response?.data?.detail;

      setError(
        typeof detail === "string"
          ? detail
          : "Skill Gap Analysis not found"
      );

    } finally {

      setLoading(false);

    }

  };


  // =========================================================
  // NORMALIZED DATA
  // =========================================================

  const strengths = useMemo(
    () =>
      Array.isArray(
        analysis?.strengths
      )
        ? analysis.strengths
        : [],
    [analysis]
  );


  const developmentAreas = useMemo(
    () =>
      Array.isArray(
        analysis?.development_areas
      )
        ? analysis.development_areas
        : [],
    [analysis]
  );


  const gaps = useMemo(
    () =>
      Array.isArray(
        analysis?.gaps
      )
        ? analysis.gaps
        : [],
    [analysis]
  );


  const evidence = useMemo(
    () =>
      Array.isArray(
        analysis?.evidence
      )
        ? analysis.evidence
        : [],
    [analysis]
  );


  // =========================================================
  // CONCEPT-LEVEL SUMMARY
  //
  // IMPORTANT:
  // Do NOT use individual rubric evidence to determine
  // whether a concept is a strength.
  //
  // Example:
  //
  // Row Filtering:
  //   Rubric 1 = 0%
  //   Rubric 2 = 100%
  //   Concept = 50%
  //
  // Therefore Row Filtering is NOT a strength.
  //
  // Only the FINAL concept classification should determine
  // the Strengths / Development Areas / Gap counts.
  // =========================================================

  const conceptSummary = useMemo(() => {

    const concepts = new Map();


    // -------------------------------------------------------
    // Extract the FINAL classification from the competency
    // cards returned by the backend.
    // -------------------------------------------------------

    const allCompetencies = [
      ...gaps,
      ...developmentAreas
    ];


    allCompetencies.forEach(
      (competency) => {

        const competencyConcepts =
          Array.isArray(
            competency?.concepts
          )
            ? competency.concepts
            : [];


        competencyConcepts.forEach(
          (concept) => {

            if (
              concept?.id === null ||
              concept?.id === undefined
            ) {
              return;
            }


            concepts.set(
              concept.id,
              {
                id:
                  concept.id,

                name:
                  concept.name ||
                  "Unnamed Concept",

                description:
                  concept.description ||
                  "",

                percentage:
                  Number(
                    concept.percentage
                  ) || 0,

                classification:
                  concept.classification ||
                  "",

                rubric_count:
                  concept.rubric_count ||
                  0,

                competency_id:
                  competency.id,

                competency_name:
                  competency.title
              }
            );

          }
        );

      }
    );


    const allConcepts =
      Array.from(
        concepts.values()
      );


    return {

      // -----------------------------------------------------
      // ONLY concepts whose OVERALL classification is
      // STRENGTH.
      // -----------------------------------------------------

      strengths:
        allConcepts.filter(
          concept =>
            concept.classification ===
            "STRENGTH"
        ),


      // -----------------------------------------------------
      // Development areas.
      // -----------------------------------------------------

      developmentAreas:
        allConcepts.filter(
          concept =>
            concept.classification ===
            "DEVELOPMENT_AREA"
        ),


      // -----------------------------------------------------
      // Gaps.
      // -----------------------------------------------------

      gaps:
        allConcepts.filter(
          concept =>
            concept.classification ===
            "GAP"
        )

    };

  }, [
    gaps,
    developmentAreas
  ]);


  // =========================================================
  // SUMMARY COUNTS
  // =========================================================

  const strengthCount =
    conceptSummary.strengths.length;


  const developmentCount =
    conceptSummary.developmentAreas.length;


  // Priority gaps remain competency-level.
  const priorityGapCount =
    gaps.length;


  // =========================================================
  // LEVEL
  // =========================================================

  const finalLevel =
    Number(
      analysis?.final_level
    ) || 0;


  const expectedLevel =
    Number(
      analysis?.expected_level
    ) || 0;


  const levelPercentage =
    Math.min(
      Math.max(
        (finalLevel / 5) * 100,
        0
      ),
      100
    );


  const expectedPercentage =
    Math.min(
      Math.max(
        (expectedLevel / 5) * 100,
        0
      ),
      100
    );


  // =========================================================
  // STATUS
  // =========================================================

  const getStatusClass = () => {

    switch (
      analysis?.status
    ) {

      case "ABOVE_EXPECTATION":
        return "above-expectation";

      case "MEETS_EXPECTATION":
        return "meets-expectation";

      case "SKILL_GAP":
        return "skill-gap";

      default:
        return "";

    }

  };


  const getStatusText = () => {

    switch (
      analysis?.status
    ) {

      case "ABOVE_EXPECTATION":
        return "ABOVE EXPECTATION";

      case "MEETS_EXPECTATION":
        return "MEETS EXPECTATION";

      case "SKILL_GAP":
        return "SKILL GAP";

      default:
        return "COMPLETED";

    }

  };


  // =========================================================
  // FORMAT PERCENTAGE
  // =========================================================

  const formatPercentage = (
    percentage
  ) => {

    const value =
      Number(percentage);

    if (
      Number.isNaN(value)
    ) {
      return "0%";
    }

    return `${Math.round(value)}%`;

  };


  // =========================================================
  // CONCEPT CLASS
  // =========================================================

  const getConceptClass = (
    classification
  ) => {

    switch (
      classification
    ) {

      case "STRENGTH":
        return "concept-strength";

      case "DEVELOPMENT_AREA":
        return "concept-development";

      case "GAP":
        return "concept-gap";

      default:
        return "";

    }

  };


  // =========================================================
  // RENDER CONCEPT
  // =========================================================

  const renderConcept = (
    concept,
    index
  ) => {

    return (

      <span
        key={
          concept.id ??
          `${concept.name}-${index}`
        }
        className={
          `skill-gap-concept ${getConceptClass(
            concept.classification
          )}`
        }
      >

        {concept.name}

      </span>

    );

  };


  // =========================================================
  // RENDER COMPETENCY CARD
  // =========================================================

  const renderCompetencyCard = (
    competency,
    type
  ) => {

    const concepts =
      Array.isArray(
        competency.concepts
      )
        ? competency.concepts
        : [];


    return (

      <article
        className={
          `skill-gap-competency-card ${type}-card`
        }
        key={
          competency.id ??
          competency.title
        }
      >

        {/* COMPETENCY HEADER */}

        <div className="skill-gap-competency-header">

          <div>

            <h3>
              {competency.title}
            </h3>

            {competency.description && (

              <p className="skill-gap-competency-description">
                {competency.description}
              </p>

            )}

          </div>


          <div className="skill-gap-competency-score">

            <strong>
              {formatPercentage(
                competency.percentage
              )}
            </strong>

          </div>

        </div>


        {/* CONCEPTS */}

        {concepts.length > 0 && (

          <div className="skill-gap-concepts">

            {concepts.map(
              renderConcept
            )}

          </div>

        )}

      </article>

    );

  };


  // =========================================================
  // RENDER CONCEPT STRENGTH CARD
  // =========================================================

  const renderStrengthConcept = (
    concept
  ) => {

    return (

      <article
        key={concept.id}
        className="skill-gap-concept-summary-card strength-card"
      >

        <div className="skill-gap-concept-summary-header">

          <div>

            <h3>
              {concept.name}
            </h3>

            {concept.competency_name && (

              <p>
                {concept.competency_name}
              </p>

            )}

          </div>


          <span className="skill-gap-concept-status strength">

            STRENGTH

          </span>

        </div>

      </article>

    );

  };

  // =========================================================
  // RENDER DEVELOPMENT CONCEPT CARD
  // =========================================================

  const renderDevelopmentConcept = (
    concept
  ) => {

    return (

      <article
        key={concept.id}
        className="skill-gap-concept-summary-card development-card"
      >

        <div className="skill-gap-concept-summary-header">

          <div>

            <h3>
              {concept.name}
            </h3>

            {concept.competency_name && (

              <p>
                {concept.competency_name}
              </p>

            )}

          </div>


        </div>


        <div className="skill-gap-development-footer">

          <span className="skill-gap-concept-status development">
            DEVELOPMENT
          </span>

        </div>

      </article>

    );

  };


  // =========================================================
  // EVIDENCE GROUP
  // =========================================================

  const renderEvidenceGroup = (
    title,
    items
  ) => {

    if (
      !items ||
      items.length === 0
    ) {
      return null;
    }


    return (

      <div className="detail-group">

        <h3>
          {title}
        </h3>


        {items.map(
          (item, index) => (

            <div
              className="detail-item"
              key={
                item.rubric_id ??
                index
              }
            >

              {/* RUBRIC HEADER */}

              <div className="detail-item-header">

                <strong>
                  {item.criterion}
                </strong>

                <span>
                  {item.score}/
                  {item.max_score}
                </span>

              </div>


              {/* CONCEPT / COMPETENCY */}

              <div className="detail-item-meta">

                {item.competency_name && (

                  <span>
                    {item.competency_name}
                  </span>

                )}

                {item.concept_name && (

                  <span>
                    {item.concept_name}
                  </span>

                )}

              </div>


              {/* FEEDBACK */}

              {item.feedback && (

                <p>
                  {item.feedback}
                </p>

              )}

            </div>

          )
        )}

      </div>

    );

  };


  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {

    return (

      <div className="skill-gap-analysis-state">

        <div className="skill-gap-analysis-loader" />

        <p>
          Loading Skill Gap Analysis...
        </p>

      </div>

    );

  }


  // =========================================================
  // ERROR
  // =========================================================

  if (
    error ||
    !analysis
  ) {

    return (

      <div className="skill-gap-analysis-state skill-gap-analysis-error">

        <h2>
          Unable to load analysis
        </h2>

        <p>
          {error ||
            "Skill Gap Analysis not found"}
        </p>

      </div>

    );

  }


  // =========================================================
  // MAIN
  // =========================================================

  return (

    <div className="skill-gap-analysis-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="skill-gap-analysis-header">

        <div>

          <p className="skill-gap-analysis-eyebrow">
            SKILL GAP ANALYSIS
          </p>

          <h1>
            {analysis.skill_name}
          </h1>

          <p className="skill-gap-analysis-role">
            {analysis.role_name}
          </p>

        </div>


        <div
          className={
            `skill-gap-analysis-status ${getStatusClass()}`
          }
        >

          {getStatusText()}

        </div>

      </header>


      {/* =====================================================
          LEVEL CARD
      ===================================================== */}

      <section className="skill-gap-level-card">

        <div className="skill-gap-level-number">

          <span>
            FINAL LEVEL
          </span>

          <strong>
            {finalLevel}
          </strong>

          <p>
            Expected level:{" "}
            <b>
              {expectedLevel}
            </b>
          </p>

        </div>


        <div className="skill-gap-level-scale">

          <div className="skill-gap-discrete-levels">
              
            {[1, 2, 3, 4, 5].map((level) => (
            
              <div
                key={level}
                className={`skill-gap-level-item ${
                  level <= finalLevel
                    ? "active"
                    : ""
                } ${
                  level === finalLevel
                    ? "final"
                    : ""
                } ${
                  level === expectedLevel
                    ? "expected"
                    : ""
                }`}
              >
              
                <div className="skill-gap-level-dot">
                  {level === finalLevel ? "✓" : ""}
                </div>
              
                <span>
                  {level}
                </span>
              
              </div>
        
            ))}
        
          </div>
          
          
          <div className="skill-gap-level-legend">
          
            <span className="final-legend">
              <i />
              Final level: {finalLevel}
            </span>
          
            <span className="expected-legend">
              <i />
              Expected level: {expectedLevel}
            </span>
          
          </div>
          
        </div>

      </section>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="skill-gap-summary">


        {/* STRENGTHS */}

        <div className="skill-gap-summary-card strengths">

          <strong>
            {strengthCount}
          </strong>

          <span>
            Strengths
          </span>

        </div>


        {/* DEVELOPMENT */}

        <div className="skill-gap-summary-card development">

          <strong>
            {developmentCount}
          </strong>

          <span>
            Development Areas
          </span>

        </div>


        {/* PRIORITY GAPS */}

        <div className="skill-gap-summary-card gaps">

          <strong>
            {priorityGapCount}
          </strong>

          <span>
            Priority Gaps
          </span>

        </div>


        {/* SURPLUS */}

        <div className="skill-gap-summary-card surplus">

          <strong>
            +{Number(
              analysis.surplus
            ) || 0}
          </strong>

          <span>
            Surplus
          </span>

        </div>


      </section>


      {/* =====================================================
          KEY STRENGTHS
      ===================================================== */}

      {conceptSummary.strengths.length > 0 && (

        <section className="skill-gap-analysis-section">

          <div className="skill-gap-section-heading">

            <div className="section-icon">
              💪
            </div>

            <div>

              <h2>
                Key Strengths
              </h2>

              <p>
                Concepts where the employee
                demonstrates strong capability
              </p>

            </div>

          </div>


          <div className="skill-gap-concept-summary-grid">

            {conceptSummary.strengths.map(
              renderStrengthConcept
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          DEVELOPMENT AREAS
      ===================================================== */}
      
      {conceptSummary.developmentAreas.length > 0 && (
      
        <section className="skill-gap-analysis-section">
        
          <div className="skill-gap-section-heading">
      
            <div className="section-icon">
              📈
            </div>
      
            <div>
      
              <h2>
                Development Areas
              </h2>
      
              <p>
                Capabilities that could benefit
                from further development
              </p>
      
            </div>
      
          </div>
      
      
          <div className="skill-gap-concept-summary-grid">
      
            {conceptSummary.developmentAreas.map(
              renderDevelopmentConcept
            )}
      
          </div>
          
        </section>
      
      )}


      {/* =====================================================
          PRIORITY GAPS
      ===================================================== */}

      {gaps.length > 0 && (

        <section className="skill-gap-analysis-section">

          <div className="skill-gap-section-heading">

            <div className="section-icon">
              ⚠️
            </div>

            <div>

              <h2>
                Priority Gaps
              </h2>

              <p>
                Capabilities that should be
                prioritized for development
              </p>

            </div>

          </div>


          <div className="skill-gap-competency-grid">

            {gaps.map(
              (item) =>
                renderCompetencyCard(
                  item,
                  "gap"
                )
            )}

          </div>

        </section>

      )}


      {/* =====================================================
          DETAILED EVIDENCE
      ===================================================== */}

      <section className="skill-gap-detailed-evidence">

        <button
          className="skill-gap-evidence-toggle"
          onClick={() =>
            setShowEvidence(
              (current) =>
                !current
            )
          }
        >

          <span>
            View Detailed Evidence
          </span>

          <span
            className={
              showEvidence
                ? "rotated"
                : ""
            }
          >
            ▼
          </span>

        </button>


        {showEvidence && (

          <div className="skill-gap-evidence-details">

            {renderEvidenceGroup(
              "Strength Evidence",
              evidence.filter(
                item =>
                  item.classification ===
                  "STRENGTH"
              )
            )}


            {renderEvidenceGroup(
              "Development Evidence",
              evidence.filter(
                item =>
                  item.classification ===
                  "DEVELOPMENT_AREA"
              )
            )}


            {renderEvidenceGroup(
              "Gap Evidence",
              evidence.filter(
                item =>
                  item.classification ===
                  "GAP"
              )
            )}

          </div>

        )}

      </section>


    </div>

  );

}


export default SkillGapAnalysis;