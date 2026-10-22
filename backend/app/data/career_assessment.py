ASSESSMENT_TITLE = "Career Interest Assessment"
ASSESSMENT_DESCRIPTION = "Assessment to understand a student's interests and career preferences."

# Each option scores 1 point for every category listed (agreed with Shivam on 22 Oct 2026).
QUESTIONS = [
    {
        "text": "Which type of activity do you enjoy the most?",
        "options": [
            ("Solving technical problems", ["technology"]),
            ("Helping and teaching others", ["social"]),
            ("Creating art or writing", ["creative"]),
            ("Managing people and projects", ["business"]),
        ],
    },
    {
        "text": "What kind of work environment do you prefer?",
        "options": [
            ("Working independently", ["technology", "research"]),
            ("Working with a team", ["social"]),
            ("Leading a group", ["business"]),
            ("A mix of different environments", []),
        ],
    },
    {
        "text": "Which subject or area interests you the most?",
        "options": [
            ("Mathematics and technology", ["technology"]),
            ("Science and research", ["research"]),
            ("Business and management", ["business"]),
            ("Arts, writing and creativity", ["creative"]),
        ],
    },
    {
        "text": "What do you enjoy doing in your free time?",
        "options": [
            ("Building or solving things", ["technology"]),
            ("Reading or learning new things", ["research"]),
            ("Talking and socializing with people", ["social"]),
            ("Drawing, writing or creating", ["creative"]),
        ],
    },
    {
        "text": "Which type of achievement would make you feel most satisfied?",
        "options": [
            ("Solving a difficult technical problem", ["technology"]),
            ("Helping someone improve their life", ["social"]),
            ("Creating something unique and original", ["creative"]),
            ("Leading a successful team or project", ["business"]),
        ],
    },
]

OPTION_CATEGORIES = {
    option_text.lower(): categories
    for question in QUESTIONS
    for option_text, categories in question["options"]
}
