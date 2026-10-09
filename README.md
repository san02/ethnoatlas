# EthnoAtlas

EthnoAtlas is an interactive map for exploring ethnographic societies and comparing cultural variables across regions.

The project combines geographic visualization with structured ethnographic data to make cross-cultural patterns easier to explore.

## Features

- Interactive map of societies using OpenLayers
- Variable-based map colouring
- Distinct colours for categorical variables and ordered colour ramps for ordinal variables
- Region and answer filters
- Missing-data visualization
- Society details, including alternative names and recorded answers
- Shareable URLs that preserve the selected filters
- Responsive layout for desktop and mobile screens

## Tech stack

- React
- TypeScript
- Vite
- OpenLayers
- JSON data exports

## Getting started

### Requirements

- Node.js
- npm

### Installation

Clone the repository and enter the frontend directory:

```bash
git clone https://github.com/san02/ethnoatlas.git
cd ethnoatlas/site
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm run dev
```

Vite will print the local URL in the terminal.

### Production build

Run:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Data structure

The application loads its exported data from the `data/` directory.

- `societies.json` — society records, coordinates, regions, alternative names, and recorded answers
- `variables.json` — variable metadata and answer categories
- `meta.json` — dataset metadata

The frontend uses these files to render the map, filters, legend, and society details.

## Data attribution and licensing

EthnoAtlas uses ethnographic data derived from D-PLACE.

Please consult the original D-PLACE project and the applicable dataset terms before reusing or redistributing the data:

- D-PLACE: https://d-place.org/

The D-PLACE data is licensed under **Creative Commons Attribution-NonCommercial (CC BY-NC)** terms. Reuse must follow the applicable attribution and non-commercial requirements.

EthnoAtlas is an independent portfolio project. It is not an official D-PLACE application.

The source code and the underlying dataset may have different licensing terms. Do not assume that the data is covered by the source-code licence.

## Project status

This project is being developed as a portfolio project focused on interactive geographic visualization, data exploration, and frontend engineering.

## Future improvements

- Additional variable and filter options
- Improved map and legend interactions
- Further accessibility and responsive-layout refinements
- Production deployment and documentation