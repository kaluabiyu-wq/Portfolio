# Kalu Abiyu: Developer Portfolio

Personal portfolio built with React 18, TypeScript and Vite. Content lives in
`src/data.ts`, so updating a project or a skill does not require touching the
components.

**Live site:**  http://localhost:5173/

![Screenshot of the portfolio](public/projects/portfolio-home.webp)

## Features
Dark/light theme that follows the system setting, case-study modal built on the
native `<dialog>` element, contact form delivered through FormSubmit, JSON-LD
structured data, optional Plausible analytics.

## Run locally
    npm ci
    npm run dev        # development server
    npm run build      # type-check with tsc, then production build into dist/
    npm run preview    # serve the production build locally

## Configuration
Copy `.env.example` to `.env.production` and set `VITE_PLAUSIBLE_DOMAIN` to
enable analytics. Leave it empty to disable.

## Deploy
Build command `npm run build`, output directory `dist`.