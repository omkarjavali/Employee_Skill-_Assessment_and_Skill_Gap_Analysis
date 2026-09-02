import json
from pyexpat.errors import messages
import re
import time

from openai import OpenAI, RateLimitError

from app.core.config import settings
from app.schemas.ai_evaluation import (
    AICriterionEvaluation,
    AIEvaluationResult
)


client = OpenAI(
    base_url="https://openrouter.ai/api/v1",
    api_key=settings.OPENROUTER_API_KEY
)


def parse_ai_json(content: str):
    """
    Parse JSON returned by an LLM.

    Handles:
    1. Normal JSON object
    2. Normal JSON array
    3. Markdown ```json ... ``` fences
    4. Array + overall_feedback returned outside the array
    """

    if not content:
        raise ValueError(
            "AI returned an empty response"
        )

    text = content.strip()

    # ---------------------------------------------
    # Remove Markdown code fences
    # ---------------------------------------------

    text = re.sub(
        r"^```(?:json)?\s*",
        "",
        text,
        flags=re.IGNORECASE
    )

    text = re.sub(
        r"\s*```$",
        "",
        text
    )

    text = text.strip()

    # ---------------------------------------------
    # First attempt: valid JSON directly
    # ---------------------------------------------

    try:
        return json.loads(text)

    except json.JSONDecodeError:
        pass

    # ---------------------------------------------
    # Handle model output like:
    #
    # [
    #   {...}
    # ],
    # "overall_feedback": "..."
    # ---------------------------------------------

    match = re.match(
        r"^(?P<array>\[.*\])\s*,\s*"
        r"(?P<feedback>\"overall_feedback\"\s*:\s*\".*\")$",
        text,
        flags=re.DOTALL
    )

    if match:

        array_text = match.group("array")
        feedback_text = match.group("feedback")

        try:
            rubrics = json.loads(
                array_text
            )

            feedback_obj = json.loads(
                "{" + feedback_text + "}"
            )

            return {
                "rubrics": rubrics,
                "overall_feedback":
                    feedback_obj["overall_feedback"]
            }

        except json.JSONDecodeError:
            pass

    # ---------------------------------------------
    # Nothing worked
    # ---------------------------------------------

    raise ValueError(
        "AI returned invalid JSON. "
        f"Raw response: {content}"
    )


# =========================================================
# OPENROUTER RETRY
# =========================================================

def call_ai_with_retry(
    messages,
    max_retries: int = 3
):
    """
    Call OpenRouter with retry handling for temporary
    429 rate-limit errors.

    Retry delays:
        Retry 1 -> 3 seconds
        Retry 2 -> 6 seconds
        Retry 3 -> 12 seconds

    The AI request is the only operation retried.
    We do NOT retry answer creation or evaluation creation.
    """

    retry_delays = [3, 6, 12]

    for attempt in range(max_retries + 1):

        try:

            print(
                f"🤖 AI evaluation attempt "
                f"{attempt + 1}/{max_retries + 1}"
            )

            
            print(
                "🔥 OPENROUTER MODEL:",
                "openai/gpt-oss-20b:free"
            )
            
            print(
                "🔥 OPENROUTER REQUEST STARTING..."
            )
            

            response = client.chat.completions.create(
                model="minimax/minimax-m3:free",
                messages=messages,
                extra_body={
                    "reasoning": {
                        "enabled": True
                    }
                }
            )

            print(
                "✅ AI evaluation request succeeded"
            )

            return response

        except RateLimitError as exc:

            # ---------------------------------------------
            # No retries remaining
            # ---------------------------------------------

            if attempt >= max_retries:

                print(
                    "❌ AI provider is still rate-limited "
                    "after all retry attempts."
                )

                raise

            # ---------------------------------------------
            # Retry delay
            # ---------------------------------------------

            delay = retry_delays[
                min(
                    attempt,
                    len(retry_delays) - 1
                )
            ]

            print(
                f"⚠️ AI provider returned 429. "
                f"Retrying in {delay} seconds..."
            )

            time.sleep(delay)

    raise RuntimeError(
        "AI evaluation failed after retry attempts."
    )


# =========================================================
# SUBJECTIVE ANSWER EVALUATION
# =========================================================

def evaluate_subjective_answer(
    question_text: str,
    answer_text: str,
    rubrics: list
) -> AIEvaluationResult:

    rubric_text = "\n".join(
        [
            (
                f"Rubric ID: {rubric.id}\n"
                f"Criterion: {rubric.criterion}\n"
                f"Maximum Score: {rubric.weight}\n"
            )
            for rubric in rubrics
        ]
    )

    prompt = f"""
You are an expert technical skills evaluator.

Evaluate the employee answer against every rubric below.

SCORING RULES:

- Evaluate meaning, not exact keywords.
- Give credit when the employee demonstrates the concept using
  different terminology.
- Do not give credit for concepts that are not demonstrated.
- Evaluate every rubric independently.
- Score from 0 up to the specified maximum score.
- 0 means not demonstrated.
- A partial score means partially demonstrated.
- Maximum score means clearly demonstrated.
- Never exceed the maximum score.
- Use the exact rubric ID supplied.
- Evaluate every rubric exactly once.

OUTPUT FORMAT — VERY IMPORTANT

Return ONLY a valid JSON object.

Do not use Markdown.
Do not use ```json.
Do not include any explanation outside the JSON.

The JSON MUST have exactly these two top-level properties:

{{
  "criteria": [
    {{
      "rubric_id": 30,
      "score": 2,
      "feedback": "Explanation of why this score was given."
    }}
  ],
  "overall_feedback": "Overall evaluation of the employee answer."
}}

Rules:

1. The top-level value MUST be a JSON object.
2. The property MUST be named "criteria".
3. "criteria" MUST be an array.
4. Every rubric MUST have:
   - rubric_id
   - score
   - feedback
5. rubric_id MUST be an integer.
6. score MUST be a number.
7. feedback MUST be a string.
8. overall_feedback MUST be a string.
9. Do NOT use "results".
10. Do NOT use "rubrics".
11. Do NOT use "evaluations".
12. Do NOT return Markdown code fences.
13. Do NOT return any text before or after the JSON.
14. Return exactly one criteria item for every rubric supplied.
15. Do not omit any rubric.
16. Do not add any rubric that was not supplied.
17. Your first character MUST be {{.
18. Your last character MUST be }}.

Also provide concise overall feedback.

QUESTION:

{question_text}

EMPLOYEE ANSWER:

{answer_text}

RUBRICS:

{rubric_text}

Return JSON only.
"""

    messages = [
        {
            "role": "system",
            "content": (
                "You are a fair and rigorous technical "
                "skills evaluator."
            )
        },
        {
            "role": "user",
            "content": prompt
        }
    ]

    # =====================================================
    # AI CALL WITH RETRY
    # =====================================================

    response = call_ai_with_retry(
        messages=messages,
        max_retries=3
    )

    content = response.choices[0].message.content

    print(
        "\n========== AI RAW RESPONSE =========="
    )
    print(content)
    print(
        "=====================================\n"
    )

    if not content:
        raise ValueError(
            "AI returned an empty response"
        )

    # ---------------------------------------------
    # Clean Markdown formatting
    # ---------------------------------------------

    cleaned = content.strip()

    cleaned = re.sub(
        r"^```(?:json)?\s*",
        "",
        cleaned,
        flags=re.IGNORECASE
    )

    cleaned = re.sub(
        r"\s*```$",
        "",
        cleaned
    )

    cleaned = cleaned.strip("`").strip()

    # ---------------------------------------------
    # Parse JSON
    # ---------------------------------------------

    try:

        data = parse_ai_json(
            content
        )

    except ValueError as exc:

        raise ValueError(
            f"AI returned invalid JSON. "
            f"Raw response: {content}"
        ) from exc

    # ---------------------------------------------
    # Normalize model response
    # ---------------------------------------------

    if isinstance(data, list):

        criteria_data = data

        overall_feedback = (
            "Evaluation completed using "
            "the configured rubrics."
        )

    elif isinstance(data, dict):

        if "criteria" in data:

            criteria_data = data["criteria"]

        elif "evaluations" in data:

            criteria_data = data["evaluations"]

        elif "rubrics" in data:

            criteria_data = data["rubrics"]

        elif "results" in data:

            criteria_data = data["results"]

        else:

            raise ValueError(
                "AI response JSON object does not contain "
                "'criteria', 'evaluations', 'rubrics', "
                "or 'results'"
            )

        overall_feedback = data.get(
            "overall_feedback",
            "Evaluation completed using "
            "the configured rubrics."
        )

    else:

        raise ValueError(
            "AI returned an unsupported JSON structure"
        )

    # ---------------------------------------------
    # Convert criteria into internal schema
    # ---------------------------------------------

    criteria = []

    for item in criteria_data:

        if not isinstance(item, dict):

            raise ValueError(
                "AI returned an invalid criterion object"
            )

        rubric_id = item.get(
            "rubric_id"
        )

        if rubric_id is None:

            rubric_id = item.get(
                "rubricId"
            )

        if rubric_id is None:

            raise ValueError(
                "AI result is missing rubric_id"
            )

        if "score" not in item:

            raise ValueError(
                f"AI result for rubric "
                f"{rubric_id} is missing score"
            )

        feedback = item.get(
            "feedback",
            "No criterion feedback provided."
        )

        criteria.append(
            AICriterionEvaluation(
                rubric_id=int(rubric_id),
                score=float(
                    item["score"]
                ),
                feedback=str(
                    feedback
                )
            )
        )

    if not criteria:

        raise ValueError(
            "AI returned no rubric evaluations"
        )

    return AIEvaluationResult(
        criteria=criteria,
        overall_feedback=overall_feedback
    )