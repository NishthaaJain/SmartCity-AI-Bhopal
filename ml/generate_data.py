import os
import random
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), "data")
os.makedirs(DATA_DIR, exist_ok=True)

BHOPAL_LOCATIONS = [
    "MP Nagar", "Arera Colony", "New Market", "Kolar Road", "Shahpura",
    "Habibganj", "Bairagarh", "TT Nagar", "Lalghati", "Ayodhya Bypass"
]

def generate_bhopal_complaints():
    """Generates synthetic dataset of Bhopal civic complaints for text category classification."""
    samples = [
        # Road / Pothole
        ("Huge dangerous pothole on main road causing severe traffic slowdown near bus stop.", "Road / Pothole"),
        ("Asphalt road surface cracked and broken with deep crater after rains.", "Road / Pothole"),
        ("Unpaved road shoulder collapsed near crossroad creating accident hazard.", "Road / Pothole"),
        ("Potholes and broken bitumen tarmac on flyover entry lane.", "Road / Pothole"),

        # Garbage / Waste
        ("Garbage bins overflowing with uncollected household waste for 3 days.", "Garbage / Waste"),
        ("Illegal dumping of plastic waste, debris, and refuse along public alley.", "Garbage / Waste"),
        ("Uncollected trash bags emitting terrible stench near market area.", "Garbage / Waste"),
        ("Commercial waste compactor broken spilling garbage onto footpath.", "Garbage / Waste"),

        # Water Supply
        ("Drinking water pipeline leak spilling clean water rapidly across road.", "Water Supply"),
        ("No municipal water supply for last 48 hours in residential block.", "Water Supply"),
        ("Contaminated muddy tap water supplying low pressure to houses.", "Water Supply"),
        ("Water supply main valve bursting near residential gate.", "Water Supply"),

        # Streetlight / Electricity
        ("Streetlights failed on 4 consecutive poles making road completely dark.", "Streetlight / Electricity"),
        ("Exposed electrical wire hanging dangerously from damaged lamp post.", "Streetlight / Electricity"),
        ("Street light short circuit flickering continuously at night.", "Streetlight / Electricity"),
        ("Power transformer spark and street light outage on main avenue.", "Streetlight / Electricity"),

        # Drainage
        ("Open sewer line overflowing foul black water onto public street.", "Drainage"),
        ("Stormwater drain grate blocked with plastic debris causing street flooding.", "Drainage"),
        ("Missing manhole cover on busy pedestrian footpath.", "Drainage"),
        ("Clogged underground drainage pipe backing up into residential lane.", "Drainage"),

        # Traffic Signal
        ("Traffic signals stuck on red at busy 4-way intersection causing gridlock.", "Traffic Signal"),
        ("Pedestrian crossing light out of order near school zone.", "Traffic Signal"),
        ("Traffic signal pole bent and light malfunctioning after storm.", "Traffic Signal"),
        ("Unregulated intersection traffic lights dark and failing.", "Traffic Signal"),

        # Public Infrastructure
        ("Public park boundary wall collapsed creating safety hazard.", "Public Infrastructure"),
        ("Pedestrian overpass walkway railing broken and loose.", "Public Infrastructure"),
        ("Bus shelter roof damaged and bench broken.", "Public Infrastructure"),
        ("Public toilet facility door damaged and tap broken.", "Public Infrastructure"),

        # Other
        ("Loud noise pollution from illegal night loudspeaker past midnight.", "Other"),
        ("Unused stray cattle roaming busy market street.", "Other"),
        ("Unauthorized hoardings blocking signboards near square.", "Other")
    ]

    data = []
    prefixes = [
        "Urgent issue: ", "Complaint from resident: ", "Hazardous situation: ",
        "Please inspect: ", "Severe problem reported: ", ""
    ]

    for _ in range(25):  # Expand to ~800 samples
        for text, category in samples:
            loc = random.choice(BHOPAL_LOCATIONS)
            prefix = random.choice(prefixes)
            full_text = f"{prefix}{text} Location: {loc}, Bhopal."
            data.append({"description": full_text, "category": category})

    df = pd.DataFrame(data)
    filepath = os.path.join(DATA_DIR, "bhopal_complaints_data.csv")
    df.to_csv(filepath, index=False)
    print(f"Generated {len(df)} Bhopal complaint category samples -> {filepath}")

if __name__ == "__main__":
    generate_bhopal_complaints()
