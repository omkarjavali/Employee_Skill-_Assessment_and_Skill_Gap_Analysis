from dataclasses import dataclass


@dataclass
class AdaptiveDecision:
    current_level: int
    next_level: int
    decision: str
    average_percentage: float


MIN_LEVEL = 1
MAX_LEVEL = 5


PROMOTE_THRESHOLD = 80.0
DEMOTE_THRESHOLD = 60.0


def calculate_next_level(
    current_level: int,
    average_percentage: float
) -> AdaptiveDecision:

    if average_percentage >= PROMOTE_THRESHOLD:

        next_level = min(
            current_level + 1,
            MAX_LEVEL
        )

        if next_level == current_level:
            decision = "MASTERY"
        else:
            decision = "PROMOTE"

    elif average_percentage < DEMOTE_THRESHOLD:

        next_level = max(
            current_level - 1,
            MIN_LEVEL
        )

        if next_level == current_level:
            decision = "REMAIN"
        else:
            decision = "DEMOTE"

    else:

        next_level = current_level
        decision = "REMAIN"

    return AdaptiveDecision(
        current_level=current_level,
        next_level=next_level,
        decision=decision,
        average_percentage=average_percentage
    )