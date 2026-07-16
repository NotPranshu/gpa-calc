# GPA Calculator

A simple browser-based GPA calculator for estimating cumulative GPA from course grades. The calculator supports adding multiple courses, selecting letter grades, and optionally including an existing GPA with a prior course count.

## Features

- Add and remove courses dynamically
- Select letter grades from a built-in grade scale
- View an automatically updated cumulative GPA
- Include an existing GPA and prior courses in the calculation
- See the full grade scale and GPA point values in the app
- Responsive layout for desktop and smaller screens

## Tech Stack

- HTML5 for the page structure
- CSS3 for the responsive dark interface
- Vanilla JavaScript for course management and GPA calculation
- No build tools, frameworks, or external dependencies required

## How to Use

1. Open `unigpacalc.netlify.app` in a web browser.
2. Click **Add Course** to add a course row.
3. Enter a course name if you want to label it.
4. Select a letter grade for each course.
5. The cumulative GPA updates automatically as grades are selected.
6. To include previous academic work, check **I already have a GPA**, then enter your current GPA and prior course count.

## Grade Scale

The calculator uses a 4.5-point scale:

| Grade | Mark Range | GPA Points |
| --- | --- | --- |
| A+ | 85% - 100% | 4.5 |
| A | 80% - 84% | 4.0 |
| B+ | 75% - 79% | 3.5 |
| B | 65% - 74% | 3.0 |
| C+ | 60% - 64% | 2.5 |
| C | 50% - 59% | 2.0 |
| D | 40% - 49% | 1.0 |
| E | 0% - 39% | 0.0 |

Each course is currently treated as 15 credits in the GPA calculation.

## Project Structure

```text
.
├── index.html
├── styles.css
├── app.js
└── README.md
```
