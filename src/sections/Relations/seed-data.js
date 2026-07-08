// 50 sample people parsed from Aurora_Relations_TestData.txt — a seed set for
// exercising the Relations section (List filters, the white-orb Graph, AI/keyword
// search). Loaded on demand from the empty state; never auto-imported.

export const SAMPLE_PEOPLE = [
  {
    "name": "Test One",
    "phone": "+1 555-0101",
    "email": "testone@example.com",
    "birthday": "1990-03-14",
    "location": "New York, USA",
    "description": "Met at a tech conference. Very passionate about startups and building products from scratch.",
    "friendliness": 85,
    "skills": [
      "JavaScript",
      "React",
      "Product Management"
    ],
    "howWeMet": "Tech Conference 2023",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test Two",
    "phone": "+44 7700 900102",
    "email": "testtwo@example.com",
    "birthday": "1988-07-22",
    "location": "London, UK",
    "description": "Old university friend. Now works in finance. Extremely reliable and always available to help.",
    "friendliness": 95,
    "skills": [
      "Finance",
      "Excel",
      "Data Analysis"
    ],
    "howWeMet": "University",
    "relationshipType": "Friend"
  },
  {
    "name": "Test Three",
    "phone": "+61 400 000 103",
    "email": "testthree@example.com",
    "birthday": "1995-11-05",
    "location": "Sydney, Australia",
    "description": "Freelance designer I hired for a logo project. Talented but sometimes slow to deliver.",
    "friendliness": 60,
    "skills": [
      "UI Design",
      "Figma",
      "Branding",
      "Illustration"
    ],
    "howWeMet": "Upwork",
    "relationshipType": "Freelancer"
  },
  {
    "name": "Test Four",
    "phone": "+49 151 00000104",
    "email": "testfour@example.com",
    "birthday": "1992-01-30",
    "location": "Berlin, Germany",
    "description": "Backend engineer I met through a mutual friend. Extremely skilled, very quiet, hard to read.",
    "friendliness": 55,
    "skills": [
      "Python",
      "Django",
      "PostgreSQL",
      "Docker"
    ],
    "howWeMet": "Mutual Friend Introduction",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test Five",
    "phone": "+33 6 00 00 01 05",
    "email": "testfive@example.com",
    "birthday": "1985-09-18",
    "location": "Paris, France",
    "description": "Mentor figure. Has been in the industry for 20 years. Always gives honest, blunt advice.",
    "friendliness": 78,
    "skills": [
      "Leadership",
      "Strategy",
      "Venture Capital",
      "Fundraising"
    ],
    "howWeMet": "Startup Accelerator",
    "relationshipType": "Mentor"
  },
  {
    "name": "Test Six",
    "phone": "+1 555-0106",
    "email": "testsix@example.com",
    "birthday": "1997-05-03",
    "location": "San Francisco, USA",
    "description": "Full stack developer friend from an online community. Loves open source. Very easy to talk to.",
    "friendliness": 90,
    "skills": [
      "Node.js",
      "React",
      "MongoDB",
      "Open Source"
    ],
    "howWeMet": "Discord Community",
    "relationshipType": "Friend"
  },
  {
    "name": "Test Seven",
    "phone": "+81 90 0000 0107",
    "email": "testseven@example.com",
    "birthday": "1991-12-25",
    "location": "Tokyo, Japan",
    "description": "Game developer I met at a hackathon. Incredibly creative. Builds things fast.",
    "friendliness": 72,
    "skills": [
      "Unity",
      "C#",
      "Game Design",
      "3D Modeling"
    ],
    "howWeMet": "Hackathon 2022",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test Eight",
    "phone": "+91 98000 00108",
    "email": "testeight@example.com",
    "birthday": "1993-08-11",
    "location": "Mumbai, India",
    "description": "Android developer. Very professional. We worked on a short contract together.",
    "friendliness": 65,
    "skills": [
      "Android",
      "Kotlin",
      "Java",
      "Firebase"
    ],
    "howWeMet": "Contract Work",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test Nine",
    "phone": "+55 11 90000-0109",
    "email": "testnine@example.com",
    "birthday": "1989-04-07",
    "location": "São Paulo, Brazil",
    "description": "Marketing specialist. Knows growth hacking inside out. Met at a workshop.",
    "friendliness": 80,
    "skills": [
      "Growth Hacking",
      "SEO",
      "Content Marketing",
      "Copywriting"
    ],
    "howWeMet": "Marketing Workshop",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test Ten",
    "phone": "+1 555-0110",
    "email": "testten@example.com",
    "birthday": "1996-02-19",
    "location": "Toronto, Canada",
    "description": "iOS developer. Close friend from a bootcamp. We still talk almost every week.",
    "friendliness": 92,
    "skills": [
      "Swift",
      "iOS",
      "Xcode",
      "ARKit"
    ],
    "howWeMet": "Coding Bootcamp",
    "relationshipType": "Friend"
  },
  {
    "name": "Test Eleven",
    "phone": "+27 71 000 0111",
    "email": "testeleven@example.com",
    "birthday": "1987-10-30",
    "location": "Cape Town, South Africa",
    "description": "Entrepreneur who runs a small SaaS company. Ambitious and driven. Not always easy to reach.",
    "friendliness": 58,
    "skills": [
      "SaaS",
      "Business Development",
      "Sales"
    ],
    "howWeMet": "LinkedIn",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test Twelve",
    "phone": "+34 600 000 112",
    "email": "testtwelve@example.com",
    "birthday": "1994-06-14",
    "location": "Barcelona, Spain",
    "description": "UX researcher. Very thoughtful and detail-oriented. Great person to bounce ideas off.",
    "friendliness": 88,
    "skills": [
      "UX Research",
      "User Testing",
      "Figma",
      "Psychology"
    ],
    "howWeMet": "Design Conference",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test Thirteen",
    "phone": "+82 10-0000-0113",
    "email": "testthirteen@example.com",
    "birthday": "1990-03-03",
    "location": "Seoul, South Korea",
    "description": "Machine learning engineer. Brilliant but very introverted. Communicates best over text.",
    "friendliness": 50,
    "skills": [
      "Python",
      "TensorFlow",
      "Machine Learning",
      "Data Science"
    ],
    "howWeMet": "Online Forum",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test Fourteen",
    "phone": "+39 320 000 0114",
    "email": "testfourteen@example.com",
    "birthday": "1986-08-27",
    "location": "Milan, Italy",
    "description": "Investor I pitched to last year. Didn't invest but gave very useful feedback. Warm person.",
    "friendliness": 70,
    "skills": [
      "Venture Capital",
      "Finance",
      "Networking"
    ],
    "howWeMet": "Pitch Event",
    "relationshipType": "Investor"
  },
  {
    "name": "Test Fifteen",
    "phone": "+1 555-0115",
    "email": "testfifteen@example.com",
    "birthday": "1998-01-09",
    "location": "Austin, Texas, USA",
    "description": "Junior developer I mentored briefly. Very eager to learn. Has grown a lot since we met.",
    "friendliness": 82,
    "skills": [
      "HTML",
      "CSS",
      "JavaScript",
      "React"
    ],
    "howWeMet": "Mentorship Program",
    "relationshipType": "Mentee"
  },
  {
    "name": "Test Sixteen",
    "phone": "+64 21 000 0116",
    "email": "testsixteen@example.com",
    "birthday": "1984-11-16",
    "location": "Auckland, New Zealand",
    "description": "DevOps engineer. Knows AWS and Kubernetes like the back of his hand. Very methodical.",
    "friendliness": 68,
    "skills": [
      "AWS",
      "Kubernetes",
      "Docker",
      "Terraform",
      "CI/CD"
    ],
    "howWeMet": "Work Project",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test Seventeen",
    "phone": "+31 6 00000117",
    "email": "testseventeen@example.com",
    "birthday": "1992-07-04",
    "location": "Amsterdam, Netherlands",
    "description": "Blockchain developer. Very opinionated about decentralization. Interesting to debate with.",
    "friendliness": 62,
    "skills": [
      "Solidity",
      "Ethereum",
      "Web3",
      "Rust"
    ],
    "howWeMet": "Crypto Meetup",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test Eighteen",
    "phone": "+46 70-000 00 18",
    "email": "testeighteen@example.com",
    "birthday": "1995-04-21",
    "location": "Stockholm, Sweden",
    "description": "Product designer who I collaborated with on a redesign project. Incredibly talented and fun to work with.",
    "friendliness": 91,
    "skills": [
      "Product Design",
      "Figma",
      "Motion Design",
      "Prototyping"
    ],
    "howWeMet": "Design Collaboration",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test Nineteen",
    "phone": "+1 555-0119",
    "email": "testnineteen@example.com",
    "birthday": "1983-09-09",
    "location": "Chicago, USA",
    "description": "Professor who taught me a lot about system design. Still reach out occasionally for advice.",
    "friendliness": 75,
    "skills": [
      "System Design",
      "Architecture",
      "Java",
      "Academia"
    ],
    "howWeMet": "University Lecture",
    "relationshipType": "Mentor"
  },
  {
    "name": "Test Twenty",
    "phone": "+7 900 000-01-20",
    "email": "testtwenty@example.com",
    "birthday": "1993-12-31",
    "location": "Moscow, Russia",
    "description": "Security researcher. Very private person but extremely knowledgeable. Met at a CTF event.",
    "friendliness": 52,
    "skills": [
      "Cybersecurity",
      "Penetration Testing",
      "CTF",
      "Linux"
    ],
    "howWeMet": "CTF Competition",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test TwentyOne",
    "phone": "+1 555-0121",
    "email": "testtwentyone@example.com",
    "birthday": "1991-05-17",
    "location": "Seattle, USA",
    "description": "Cloud architect at a big tech company. Very generous with knowledge. Happy to help anytime.",
    "friendliness": 87,
    "skills": [
      "Azure",
      "AWS",
      "Cloud Architecture",
      "Python"
    ],
    "howWeMet": "Tech Meetup",
    "relationshipType": "Friend"
  },
  {
    "name": "Test TwentyTwo",
    "phone": "+86 138 0000 0122",
    "email": "testtwentytwo@example.com",
    "birthday": "1988-02-14",
    "location": "Shanghai, China",
    "description": "Hardware engineer who builds custom PCBs. Fascinating person. Met at a maker fair.",
    "friendliness": 73,
    "skills": [
      "Electronics",
      "PCB Design",
      "Arduino",
      "Embedded Systems"
    ],
    "howWeMet": "Maker Fair",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test TwentyThree",
    "phone": "+52 55 0000 0123",
    "email": "testtwentythree@example.com",
    "birthday": "1996-10-02",
    "location": "Mexico City, Mexico",
    "description": "Content creator who makes programming tutorials. Very energetic and easy to talk to.",
    "friendliness": 84,
    "skills": [
      "YouTube",
      "Content Creation",
      "JavaScript",
      "Teaching"
    ],
    "howWeMet": "Twitter/X",
    "relationshipType": "Friend"
  },
  {
    "name": "Test TwentyFour",
    "phone": "+20 100 000 0124",
    "email": "testtwentyfour@example.com",
    "birthday": "1994-06-28",
    "location": "Cairo, Egypt",
    "description": "Backend developer specializing in Go. Quiet but very efficient worker. Good communicator over text.",
    "friendliness": 66,
    "skills": [
      "Go",
      "PostgreSQL",
      "Redis",
      "Microservices"
    ],
    "howWeMet": "GitHub",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test TwentyFive",
    "phone": "+1 555-0125",
    "email": "testtwentyfive@example.com",
    "birthday": "1979-03-15",
    "location": "Boston, USA",
    "description": "Serial entrepreneur on his third startup. Very well connected. Knows everyone in the ecosystem.",
    "friendliness": 79,
    "skills": [
      "Entrepreneurship",
      "Networking",
      "Fundraising",
      "Strategy"
    ],
    "howWeMet": "Startup Event",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test TwentySix",
    "phone": "+62 812-0000-0126",
    "email": "testtwentysix@example.com",
    "birthday": "1997-08-08",
    "location": "Jakarta, Indonesia",
    "description": "Mobile developer who does both iOS and Android. Very hardworking. Took a course I recommended.",
    "friendliness": 77,
    "skills": [
      "Flutter",
      "Dart",
      "iOS",
      "Android",
      "Firebase"
    ],
    "howWeMet": "Online Course Community",
    "relationshipType": "Mentee"
  },
  {
    "name": "Test TwentySeven",
    "phone": "+90 532 000 01 27",
    "email": "testtwentyseven@example.com",
    "birthday": "1990-01-23",
    "location": "Istanbul, Turkey",
    "description": "Data engineer building pipelines at scale. Methodical thinker. Hard worker.",
    "friendliness": 69,
    "skills": [
      "Apache Spark",
      "Kafka",
      "Python",
      "Data Engineering"
    ],
    "howWeMet": "Data Conference",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test TwentyEight",
    "phone": "+48 500 000 128",
    "email": "testtwentyeight@example.com",
    "birthday": "1985-07-07",
    "location": "Warsaw, Poland",
    "description": "Game designer with 15 years experience. Incredibly creative. Very picky about collaboration.",
    "friendliness": 57,
    "skills": [
      "Game Design",
      "Narrative Design",
      "Unity",
      "Unreal Engine"
    ],
    "howWeMet": "Game Jam",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test TwentyNine",
    "phone": "+1 555-0129",
    "email": "testtwentynine@example.com",
    "birthday": "1993-11-11",
    "location": "Miami, USA",
    "description": "Social media strategist. Very outgoing and fun at events. Knows how to build an audience fast.",
    "friendliness": 86,
    "skills": [
      "Social Media",
      "Instagram",
      "TikTok",
      "Brand Strategy"
    ],
    "howWeMet": "Marketing Event",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test Thirty",
    "phone": "+966 50 000 0130",
    "email": "testthirty@example.com",
    "birthday": "1989-04-04",
    "location": "Riyadh, Saudi Arabia",
    "description": "Tech investor focused on MENA region startups. Very sharp. Always asks the right questions.",
    "friendliness": 63,
    "skills": [
      "Investment",
      "MENA Markets",
      "Finance",
      "Due Diligence"
    ],
    "howWeMet": "Investor Summit",
    "relationshipType": "Investor"
  },
  {
    "name": "Test ThirtyOne",
    "phone": "+1 555-0131",
    "email": "testthirtyone@example.com",
    "birthday": "1998-09-27",
    "location": "Los Angeles, USA",
    "description": "Creative developer who blends art and code. Makes generative art. Very open and collaborative.",
    "friendliness": 93,
    "skills": [
      "Three.js",
      "WebGL",
      "Creative Coding",
      "p5.js"
    ],
    "howWeMet": "Creative Coding Community",
    "relationshipType": "Friend"
  },
  {
    "name": "Test ThirtyTwo",
    "phone": "+234 803 000 0132",
    "email": "testthirtytwo@example.com",
    "birthday": "1992-02-02",
    "location": "Lagos, Nigeria",
    "description": "Fintech entrepreneur solving payment problems across Africa. Extremely driven and visionary.",
    "friendliness": 81,
    "skills": [
      "Fintech",
      "Payments",
      "Business Development",
      "Python"
    ],
    "howWeMet": "Fintech Conference",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test ThirtyThree",
    "phone": "+1 555-0133",
    "email": "testthirtythree@example.com",
    "birthday": "1987-06-06",
    "location": "Denver, Colorado, USA",
    "description": "DevRel engineer at a major cloud company. Very helpful publicly and privately. Great resource.",
    "friendliness": 89,
    "skills": [
      "Developer Relations",
      "Public Speaking",
      "AWS",
      "Community Building"
    ],
    "howWeMet": "AWS Conference",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test ThirtyFour",
    "phone": "+972 50-000-0134",
    "email": "testthirtyfour@example.com",
    "birthday": "1994-10-10",
    "location": "Tel Aviv, Israel",
    "description": "AI researcher working on NLP. Published several papers. Smart but very academic in communication style.",
    "friendliness": 61,
    "skills": [
      "NLP",
      "Python",
      "Research",
      "Machine Learning",
      "PyTorch"
    ],
    "howWeMet": "Research Paper Discussion",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test ThirtyFive",
    "phone": "+1 555-0135",
    "email": "testthirtyfive@example.com",
    "birthday": "1991-03-28",
    "location": "Atlanta, USA",
    "description": "Cybersecurity consultant. Very trustworthy. Has helped me understand security practices better.",
    "friendliness": 83,
    "skills": [
      "Cybersecurity",
      "Network Security",
      "Python",
      "Risk Assessment"
    ],
    "howWeMet": "Security Workshop",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test ThirtySix",
    "phone": "+31 6 00000136",
    "email": "testthirtysix@example.com",
    "birthday": "1986-12-12",
    "location": "Rotterdam, Netherlands",
    "description": "Logistics tech founder. Solving supply chain with software. Very no-nonsense personality.",
    "friendliness": 67,
    "skills": [
      "Supply Chain",
      "Python",
      "Operations",
      "Entrepreneurship"
    ],
    "howWeMet": "Founders Dinner",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test ThirtySeven",
    "phone": "+1 555-0137",
    "email": "testthirtyseven@example.com",
    "birthday": "1999-07-15",
    "location": "Portland, USA",
    "description": "Young frontend developer passionate about accessibility. Very sharp for his age. Will go far.",
    "friendliness": 88,
    "skills": [
      "React",
      "Accessibility",
      "CSS",
      "TypeScript"
    ],
    "howWeMet": "Open Source Contribution",
    "relationshipType": "Mentee"
  },
  {
    "name": "Test ThirtyEight",
    "phone": "+65 9000 0138",
    "email": "testthirtyeight@example.com",
    "birthday": "1988-05-20",
    "location": "Singapore",
    "description": "VC partner focused on Southeast Asia. Very well connected. Has introduced me to useful people.",
    "friendliness": 76,
    "skills": [
      "Venture Capital",
      "Southeast Asia",
      "Networking",
      "Strategy"
    ],
    "howWeMet": "VC Panel Event",
    "relationshipType": "Investor"
  },
  {
    "name": "Test ThirtyNine",
    "phone": "+1 555-0139",
    "email": "testthirtynine@example.com",
    "birthday": "1993-08-31",
    "location": "Nashville, USA",
    "description": "Technical writer who makes complex topics simple. Very collaborative and responsive.",
    "friendliness": 85,
    "skills": [
      "Technical Writing",
      "Documentation",
      "Markdown",
      "API Docs"
    ],
    "howWeMet": "Documentation Project",
    "relationshipType": "Freelancer"
  },
  {
    "name": "Test Forty",
    "phone": "+54 11 0000-0140",
    "email": "testforty@example.com",
    "birthday": "1990-09-09",
    "location": "Buenos Aires, Argentina",
    "description": "Full stack developer who loves clean code. Very opinionated about architecture. Good debates.",
    "friendliness": 71,
    "skills": [
      "TypeScript",
      "Node.js",
      "React",
      "Clean Architecture"
    ],
    "howWeMet": "GitHub Discussion",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test FortyOne",
    "phone": "+1 555-0141",
    "email": "testfortyone@example.com",
    "birthday": "1984-04-16",
    "location": "Washington D.C., USA",
    "description": "Policy advisor who understands tech regulation deeply. Rare combination of law and tech knowledge.",
    "friendliness": 64,
    "skills": [
      "Policy",
      "Law",
      "Tech Regulation",
      "Public Affairs"
    ],
    "howWeMet": "Policy Summit",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test FortyTwo",
    "phone": "+60 12-000 0142",
    "email": "testfortytwo@example.com",
    "birthday": "1995-02-25",
    "location": "Kuala Lumpur, Malaysia",
    "description": "E-commerce entrepreneur running a 7-figure store. Very practical and results-focused.",
    "friendliness": 74,
    "skills": [
      "E-commerce",
      "Shopify",
      "Digital Marketing",
      "Operations"
    ],
    "howWeMet": "Entrepreneur Mastermind",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test FortyThree",
    "phone": "+1 555-0143",
    "email": "testfortythree@example.com",
    "birthday": "1989-10-20",
    "location": "San Diego, USA",
    "description": "Robotics engineer working on autonomous systems. Nerdy in the best possible way. Great energy.",
    "friendliness": 87,
    "skills": [
      "Robotics",
      "ROS",
      "Python",
      "Computer Vision",
      "C++"
    ],
    "howWeMet": "Robotics Meetup",
    "relationshipType": "Friend"
  },
  {
    "name": "Test FortyFour",
    "phone": "+47 900 00 144",
    "email": "testfortyfour@example.com",
    "birthday": "1987-01-01",
    "location": "Oslo, Norway",
    "description": "Sustainability tech founder. Building carbon tracking software. Very principled person.",
    "friendliness": 79,
    "skills": [
      "Sustainability",
      "Python",
      "Business Development",
      "GreenTech"
    ],
    "howWeMet": "Climate Tech Event",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test FortyFive",
    "phone": "+1 555-0145",
    "email": "testfortyfive@example.com",
    "birthday": "1996-06-30",
    "location": "Phoenix, USA",
    "description": "QA engineer who finds bugs nobody else sees. Very thorough. Underrated skill set.",
    "friendliness": 82,
    "skills": [
      "QA",
      "Testing",
      "Selenium",
      "Cypress",
      "Bug Tracking"
    ],
    "howWeMet": "Work Project",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test FortySix",
    "phone": "+380 50 000 0146",
    "email": "testfortysix@example.com",
    "birthday": "1992-03-08",
    "location": "Kyiv, Ukraine",
    "description": "Frontend developer with an eye for pixel-perfect design. Very dedicated and detail-obsessed.",
    "friendliness": 76,
    "skills": [
      "Vue.js",
      "CSS",
      "Animation",
      "Figma",
      "TypeScript"
    ],
    "howWeMet": "Remote Work Project",
    "relationshipType": "Colleague"
  },
  {
    "name": "Test FortySeven",
    "phone": "+1 555-0147",
    "email": "testfortyseven@example.com",
    "birthday": "1980-11-22",
    "location": "Houston, USA",
    "description": "CTO of a mid-size company. Very experienced. Gives solid technical leadership advice.",
    "friendliness": 70,
    "skills": [
      "Leadership",
      "System Architecture",
      "Python",
      "Team Management"
    ],
    "howWeMet": "CTO Forum",
    "relationshipType": "Mentor"
  },
  {
    "name": "Test FortyEight",
    "phone": "+30 690 000 0148",
    "email": "testfortyeight@example.com",
    "birthday": "1994-07-17",
    "location": "Athens, Greece",
    "description": "Data scientist who specializes in recommendation systems. Very analytical. Quiet but sharp.",
    "friendliness": 59,
    "skills": [
      "Data Science",
      "Python",
      "Recommendation Systems",
      "SQL"
    ],
    "howWeMet": "Data Science Conference",
    "relationshipType": "Acquaintance"
  },
  {
    "name": "Test FortyNine",
    "phone": "+1 555-0149",
    "email": "testfortynine@example.com",
    "birthday": "1997-12-05",
    "location": "Detroit, USA",
    "description": "Hardware hacker and maker. Builds custom mechanical keyboards and electronics. Super passionate.",
    "friendliness": 91,
    "skills": [
      "Electronics",
      "Arduino",
      "3D Printing",
      "Mechanical Design"
    ],
    "howWeMet": "Maker Community",
    "relationshipType": "Friend"
  },
  {
    "name": "Test Fifty",
    "phone": "+94 77 000 0150",
    "email": "testfifty@example.com",
    "birthday": "1993-05-25",
    "location": "Colombo, Sri Lanka",
    "description": "Full stack developer and entrepreneur building local tech solutions. Ambitious and hardworking. Great energy.",
    "friendliness": 96,
    "skills": [
      "React",
      "Node.js",
      "Python",
      "Entrepreneurship",
      "Product Development"
    ],
    "howWeMet": "Local Tech Community",
    "relationshipType": "Friend"
  }
]
