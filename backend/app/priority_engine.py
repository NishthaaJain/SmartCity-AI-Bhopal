def evaluate_rule_priority(description: str, category: str = "") -> tuple[str, str]:
    """
    Evaluates complaint urgency deterministically based on safety keywords, severity, and category context.
    Returns a tuple: (priority: str, reasoning: str)
    """
    desc_lower = description.lower()

    # Critical Safety Hazards
    critical_keywords = [
        "electrocution", "hanging wire", "fire", "gas leak", "explosion", 
        "open manhole", "road collapse", "bridge damage", "chemical spill"
    ]
    if any(kw in desc_lower for kw in critical_keywords):
        return "Critical", "Presents an immediate life-threatening hazard or public safety emergency."

    # High Urgency Hazards
    high_keywords = [
        "burst pipe", "flooding", "huge pothole", "severe leak", "blocking traffic",
        "accident", "toxic", "overflowing garbage", "danger", "hazardous", "urgent"
    ]
    if any(kw in desc_lower for kw in high_keywords):
        return "High", "Significant public safety risk or major infrastructure obstruction."

    # Category Specific Rules
    if category == "Water Supply" and any(kw in desc_lower for kw in ["no water", "contamination", "dirty water"]):
        return "High", "Public essential utility outage affecting household health."
    elif category == "Streetlight / Electricity" and "dark" in desc_lower:
        return "Medium", "Street lighting failure creating night safety vulnerability."
    elif category == "Garbage / Waste" and "overflowing" in desc_lower:
        return "Medium", "Public sanitation concern requiring scheduled collection."

    # Medium Urgency Indicators
    medium_keywords = ["broken", "damaged", "not working", "stagnant", "smell", "leak", "deep pothole"]
    if any(kw in desc_lower for kw in medium_keywords):
        return "Medium", "Moderate civic inconvenience requiring prompt departmental attention."

    # Default Low Priority
    return "Low", "Standard civic complaint for routine maintenance review."
