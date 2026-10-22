ASSESSMENT_TITLE = "Career Discovery Assessment"
ASSESSMENT_DESCRIPTION = (
    "20 questions across 5 parameters - interests, strengths, work style, values and "
    "academics - to find the career paths that fit you best."
)

T, R, S, C, B = "technology", "research", "social", "creative", "business"

SECTIONS = {
    "interests": "Interests",
    "aptitude": "Strengths & Aptitude",
    "work_style": "Work Style & Personality",
    "values": "Values & Motivation",
    "academics": "Academics & Experience",
}

# Each option gives weighted points to categories: 2 = strong signal, 1 = secondary signal.
QUESTIONS = [
    {
        "section": "interests",
        "text": "Which activity sounds the most fun to you?",
        "options": [
            ("Building an app, website or gadget", {T: 2}),
            ("Running an experiment to test an idea", {R: 2}),
            ("Helping a friend work through a personal problem", {S: 2}),
            ("Designing a poster, video or story", {C: 2}),
            ("Planning and running a stall at a college fest", {B: 2}),
        ],
    },
    {
        "section": "interests",
        "text": "Which kind of content could you binge-watch for hours?",
        "options": [
            ("Coding, gadgets or AI explained", {T: 2}),
            ("Space, science or how-things-work documentaries", {R: 2}),
            ("Psychology, health or inspiring life stories", {S: 2}),
            ("Art, film-making, music or design tutorials", {C: 2}),
            ("Startup stories, business case studies or markets", {B: 2}),
        ],
    },
    {
        "section": "interests",
        "text": "In a group project, which part do you volunteer for?",
        "options": [
            ("Building the technical part", {T: 2}),
            ("Researching facts and collecting data", {R: 2}),
            ("Making sure everyone is heard and included", {S: 2}),
            ("Making the presentation look amazing", {C: 2}),
            ("Leading the team and dividing the work", {B: 2}),
        ],
    },
    {
        "section": "interests",
        "text": "Which problem would you most like to spend your life solving?",
        "options": [
            ("Making software faster, smarter or more secure", {T: 2}),
            ("Curing a disease or understanding climate change", {R: 2}),
            ("Improving education or mental health in India", {S: 2}),
            ("Telling stories that change how people think", {C: 2}),
            ("Growing a small idea into a big company", {B: 2}),
        ],
    },
    {
        "section": "aptitude",
        "text": "Which of these comes most naturally to you?",
        "options": [
            ("Logical puzzles and coding problems", {T: 2}),
            ("Understanding complex concepts and theories", {R: 2}),
            ("Understanding how other people feel", {S: 2}),
            ("Imagining new ideas and visuals", {C: 2}),
            ("Convincing people and negotiating", {B: 2}),
        ],
    },
    {
        "section": "aptitude",
        "text": "Which subjects do you score best in (or enjoy the most)?",
        "options": [
            ("Mathematics and Computer Science", {T: 2, R: 1}),
            ("Physics, Chemistry or Biology", {R: 2}),
            ("Languages, Psychology or Social Studies", {S: 2, C: 1}),
            ("Art, Music or Literature", {C: 2}),
            ("Economics, Commerce or Accountancy", {B: 2}),
        ],
    },
    {
        "section": "aptitude",
        "text": "When something goes wrong, what is your first instinct?",
        "options": [
            ("Debug it step by step until it works", {T: 2}),
            ("Investigate the root cause of why it happened", {R: 2}),
            ("Check how everyone is affected and calm them down", {S: 2}),
            ("Find an unusual, creative workaround", {C: 2}),
            ("Decide quickly and get the right people on it", {B: 2}),
        ],
    },
    {
        "section": "aptitude",
        "text": "How do you feel about working with numbers and data?",
        "options": [
            ("I love finding patterns and insights in data", {R: 2, T: 1}),
            ("I use them as a tool to build things", {T: 2}),
            ("They are okay, but I prefer working with people", {S: 2}),
            ("I prefer words, visuals and ideas", {C: 2}),
            ("I am good with money, budgets and profit", {B: 2}),
        ],
    },
    {
        "section": "work_style",
        "text": "Which workplace would you enjoy the most?",
        "options": [
            ("A tech team shipping products", {T: 2}),
            ("A quiet lab or research centre", {R: 2}),
            ("A school, hospital or NGO", {S: 2}),
            ("A design studio or creative agency", {C: 2}),
            ("A fast-paced office with clients and targets", {B: 2}),
        ],
    },
    {
        "section": "work_style",
        "text": "How do you prefer to work?",
        "options": [
            ("Alone, with deep focus on one hard problem", {R: 2, T: 1}),
            ("In a small team of skilled builders", {T: 2}),
            ("Talking with and helping people all day", {S: 2}),
            ("With full freedom to experiment", {C: 2}),
            ("Organising and leading other people", {B: 2}),
        ],
    },
    {
        "section": "work_style",
        "text": "How do you usually make important decisions?",
        "options": [
            ("With logic and step-by-step reasoning", {T: 2}),
            ("After careful research and evidence", {R: 2}),
            ("By thinking about how it affects people", {S: 2}),
            ("By trusting my intuition and imagination", {C: 2}),
            ("By weighing risk, cost and reward", {B: 2}),
        ],
    },
    {
        "section": "work_style",
        "text": "How would your friends describe you?",
        "options": [
            ("The tech geek", {T: 2}),
            ("The curious thinker", {R: 2}),
            ("The caring listener", {S: 2}),
            ("The creative one", {C: 2}),
            ("The natural leader", {B: 2}),
        ],
    },
    {
        "section": "values",
        "text": "What matters most to you in a career?",
        "options": [
            ("Building things that millions of people use", {T: 2}),
            ("Discovering new knowledge", {R: 2}),
            ("Making a real difference in people's lives", {S: 2}),
            ("Freedom to express myself", {C: 2}),
            ("High income and fast growth", {B: 2}),
        ],
    },
    {
        "section": "values",
        "text": "Which achievement would make you the proudest?",
        "options": [
            ("Launching my own app or tech product", {T: 2, B: 1}),
            ("Publishing a research paper", {R: 2}),
            ("A student or patient succeeding because of me", {S: 2}),
            ("My work being published, exhibited or going viral", {C: 2}),
            ("Building a team or company from scratch", {B: 2}),
        ],
    },
    {
        "section": "values",
        "text": "Where do you see yourself in 10 years?",
        "options": [
            ("Senior engineer or tech architect", {T: 2}),
            ("Scientist, professor or PhD researcher", {R: 2}),
            ("Doctor, teacher, counsellor or social leader", {S: 2}),
            ("Designer, writer, artist or film-maker", {C: 2}),
            ("Manager, consultant or startup founder", {B: 2}),
        ],
    },
    {
        "section": "values",
        "text": "What would you happily do even without getting paid?",
        "options": [
            ("Coding side projects or tinkering with gadgets", {T: 2}),
            ("Reading about new discoveries", {R: 2}),
            ("Volunteering, mentoring or teaching", {S: 2}),
            ("Drawing, writing, music or photography", {C: 2}),
            ("Organising events or running a side hustle", {B: 2}),
        ],
    },
    {
        "section": "academics",
        "text": "Which stream are you in (or did you choose after 10th)?",
        "options": [
            ("Science with Maths (PCM)", {T: 2, R: 1}),
            ("Science with Biology (PCB)", {R: 2, S: 1}),
            ("Arts / Humanities", {S: 1, C: 1}),
            ("Commerce", {B: 2}),
            ("Design, Media or Fine Arts", {C: 2}),
        ],
    },
    {
        "section": "academics",
        "text": "What have you done outside the classroom?",
        "options": [
            ("Built a project or took part in a hackathon", {T: 2}),
            ("Olympiads, science fairs or a research project", {R: 2}),
            ("Volunteering, tutoring or community service", {S: 2}),
            ("Made art, videos, music, blogs or designs", {C: 2}),
            ("Led a club, organised an event or sold something", {B: 2}),
        ],
    },
    {
        "section": "academics",
        "text": "Which elective course would you pick?",
        "options": [
            ("Artificial Intelligence or Web Development", {T: 2}),
            ("Astrophysics, Genetics or Statistics", {R: 2}),
            ("Psychology or Public Health", {S: 2}),
            ("Graphic Design or Creative Writing", {C: 2}),
            ("Entrepreneurship, Marketing or Finance", {B: 2}),
        ],
    },
    {
        "section": "academics",
        "text": "Which set of tools would you most like to master?",
        "options": [
            ("Python, GitHub and the cloud", {T: 2}),
            ("Lab equipment, statistics and research papers", {R: 2}),
            ("Counselling, public speaking and teaching methods", {S: 2}),
            ("Figma, Photoshop or video editing", {C: 2}),
            ("Excel, pitch decks and business strategy", {B: 2}),
        ],
    },
]

# The first 5-question version (agreed with Shivam on 22 Oct 2026); kept so old answers still score.
LEGACY_OPTIONS = {
    "Solving technical problems": {T: 1},
    "Helping and teaching others": {S: 1},
    "Creating art or writing": {C: 1},
    "Managing people and projects": {B: 1},
    "Working independently": {T: 1, R: 1},
    "Working with a team": {S: 1},
    "Leading a group": {B: 1},
    "A mix of different environments": {},
    "Mathematics and technology": {T: 1},
    "Science and research": {R: 1},
    "Business and management": {B: 1},
    "Arts, writing and creativity": {C: 1},
    "Building or solving things": {T: 1},
    "Reading or learning new things": {R: 1},
    "Talking and socializing with people": {S: 1},
    "Drawing, writing or creating": {C: 1},
    "Solving a difficult technical problem": {T: 1},
    "Helping someone improve their life": {S: 1},
    "Creating something unique and original": {C: 1},
    "Leading a successful team or project": {B: 1},
}

OPTION_WEIGHTS = {text.lower(): weights for text, weights in LEGACY_OPTIONS.items()}
OPTION_WEIGHTS.update({
    option_text.lower(): weights
    for question in QUESTIONS
    for option_text, weights in question["options"]
})

QUESTION_SECTIONS = {question["text"]: question["section"] for question in QUESTIONS}
