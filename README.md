# Cognivex

**An interactive learning application for graphs and breadth-first search (BFS).**

🌐 **[Launch Live Application](https://caitlincalder.github.io/COS212-DSA-Tutor/)**

## Overview

Cognivex is a browser-based educational application developed for COS750: Educational Software Development at the University of Pretoria. It is designed to help second-year COS212: Data Structures and Algorithms students prepare for lectures on graphs and breadth-first search (BFS).

The application combines interactive graph visualisation, diagnostic assessment and targeted practice to support learners with different levels of prior knowledge. Students can explore graph structures, observe BFS execution, identify knowledge gaps and develop their understanding through guided and independent activities.

## Features

Cognivex provides a seven-stage learning journey:

| Stage | Description |
|---|---|
| **1. Overview Video** | Introduces graph concepts and BFS through a prerecorded instructional video. The slide-upload interface simulates video generation. |
| **2. Graph Sandbox** | Allows learners to construct directed or undirected graphs, inspect adjacency lists, observe queue operations and execute BFS step by step. |
| **3. Diagnostic Assessment** | Evaluates six foundational skills to identify existing knowledge and learning gaps. |
| **4. Skill Town** | Visualises individual skill progress through an interactive town representing mastery states. |
| **5. Interactive Quests** | Provides personalised practice through worked examples, guided challenges and independent tasks, supported by hints and feedback. |
| **6. Re-check** | Reassesses skills requiring further confirmation using a separate question bank. |
| **7. Student Report** | Summarises progress before and after practice, with options to print or save the report. |

The application also includes multiple learning representations (**Picture, Listen, Read and Try It**) and a simulated lecturer dashboard demonstrating how class-level learning gaps could be visualised.

## Technology Stack

- **React** - User interface
- **TypeScript** - Application logic and type safety
- **Vite** - Development and build tooling
- **CSS and SVG** - Styling and graph visualisations
- **GSAP** - Interface animations
- **Lucide React** - Interface icons
- **Vitest and React Testing Library** - Automated testing
- **GitHub Pages** - Deployment

## Getting Started

### Prerequisites

- Node.js and npm
- A modern web browser

### Installation

Clone the repository:

```bash
git clone https://github.com/caitlincalder/COS212-DSA-Tutor.git
cd COS212-DSA-Tutor
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Open the local URL displayed in the terminal.

### Additional Commands

```bash
npm run build    # Create a production build
npm test         # Run automated tests
```

## Project Structure

The application is organised into five functional modules with shared TypeScript interfaces.

```text
src/
├── part1/       # Learning content and educational data
├── part2/       # Diagnosis, skill profiling and quest planning
├── part3/       # Graph Sandbox and BFS utilities
├── part4/       # Interactive quests and learning activities
├── part5/       # Application shell, Skill Town and reporting
├── shared/      # Shared types and skill definitions
├── App.tsx      # Main application component
└── main.tsx     # Application entry point
```

Each module separates related functionality, while shared interfaces support integration across the learning journey.
