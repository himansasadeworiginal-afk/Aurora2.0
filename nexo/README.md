# NEXO 1.0

Turn books and notes into interactive web pages.

## Overview

Nexo transforms book summaries and study notes into self-contained, interactive HTML pages.  
Each book and lesson is a fully interactive page with search, expandable sections, and visual tools — making review and study more engaging than static notes.

## Features

- **Interactive Library Hub** — Browse all 31 resources with filterable categories and search
- **Category System** — Books organized into Productivity, Philosophy, Psychology, Power, and Finance; Study Notes organized into Economics and Business Studies
- **Dual Layouts** — Switch between grid and list view
- **Interactive Summaries** — Each page includes search, expandable sections, and interactive tools
- **Ambient Environment** — Particle network, floating orbs, mouse-reactive glow, animated gradients
- **Dark Theme** — Green/teal/purple/amber color palette with smooth animations throughout

## Structure

```
nexo 1.0/
├── index.html                # Library hub — browse all books and study notes
├── README.md
├── <Book Title>/             # Each book's folder
│   ├── index.html            # Interactive summary page
│   ├── <summary>.txt         # Raw summary notes
│   └── <book>.(pdf|epub)     # Source ebook (if available)
├── Study Notes/
│   ├── Business/             # Business Studies lessons (1-8)
│   │   ├── <n>/
│   │   │   ├── index.html    # or lesson<n>.html
│   │   │   └── <n>.pdf
│   └── Econ/                 # Economics lessons (1-12)
│       ├── <n>/
│       │   ├── index.html
│       │   └── <n>.pdf
└── ...
```

## Categories

| Category       | Resources |
|---------------|-----------|
| Productivity  | Atomic Habits, Building a Second Brain, Deep Work, Hyperfocus |
| Philosophy    | Ego Is the Enemy, The Power of Now |
| Psychology    | Psycho-Cybernetics, What Every BODY Is Saying, The 48 Laws of Power |
| Power         | The 48 Laws of Power |
| Finance       | Money Unlocked, The Changing World Order |
| Economics     | 12 lessons covering microeconomics, macroeconomics, trade, and the Sri Lankan economy |
| Business      | 8 lessons covering business foundations, ethics, organizations, entrepreneurship, and more |

## Books Included

- The 48 Laws of Power (Robert Greene)
- Atomic Habits (James Clear)
- Building a Second Brain (Tiago Forte)
- Deep Work (Cal Newport)
- Ego Is the Enemy (Ryan Holiday)
- Hyperfocus (Chris Bailey)
- Money Unlocked (John Lee)
- The Power of Now (Eckhart Tolle)
- Psycho-Cybernetics (Maxwell Maltz)
- The Changing World Order (Ray Dalio)
- What Every BODY Is Saying (Joe Navarro)

## Study Notes Included

### Business Studies (8 Lessons)
1. Basis of Business & Environment
2. Social Responsibility & Business Ethics
3. Business-Government Relations & Consumer Protection
4. Business Organizations
5. Entrepreneurship
6. Money and Financial Institutions
7. Insurance
8. Communication

### Economics (12 Lessons)
1. Introduction to Economics
2. Demand, Supply & Market Equilibrium
3. Government Intervention in Markets
4. Production, Cost & Market Structures
5. National Accounting
6. Macroeconomic Concepts
7. Price, Inflation, Money & Financial System
8. Market Failure, Government & Public Finance
9. Protectionism & Foreign Investments
10. Foreign Exchange & Balance of Payments
11. Economic Growth, Development & Labour
12. Sri Lankan Economy Post-Independence

## Usage

Open `nexo 1.0/index.html` in any browser.  
Click a card to open its interactive summary page. Use the category filters and search bar to find specific resources.

## Credits

Summaries and interactive pages built from notes on each respective work.
