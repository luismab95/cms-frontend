# CMS Frontend

<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://angular.dev/assets/images/press-kit/angular_icon_gradient.gif" width="120" alt="NestJS Logo" />
  </a>
</p>

<p align="center">
 Content Management System — Frontend Application
</p>

<p align="center">
  <a href="https://github.com/luismab95/cms-frontend">
    <img src="https://img.shields.io/badge/Angular-22-DD0031?logo=angular&logoColor=white" alt="Angular 22" />
  </a>
    <img src="https://img.shields.io/badge/TypeScript-Enabled-3178C6?logo=typescript&logoColor=white" alt="TypeScript" />
  <a href="https://github.com/luismab95/cms-frontend/blob/main/LICENSE">
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License" />
  </a>
</p>

## Description

CMS Frontend is a web application built with Angular 22 that provides the user interface for a Content Management System (CMS).


## Table of Contents

- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Development Server](#development-server)
- [Build](#build)
- [Testing](#testing)
- [License](#license)


## Prerequisites

- [Node.js](https://nodejs.org/) — a version compatible with Angular 22.
- [npm](https://www.npmjs.com/) — Node.js package manager.

## Installation

Clone the repository and install the dependencies:

```bash
git clone https://github.com/luismab95/cms-frontend.git
cd cms-frontend
npm install
```

## Environment Variables

Configure the environment variables required by the application before running it.

Create a `.env` file in the project root if your configuration uses environment files (review .env.example).

Example:

```env
API_URL=http://${host}:${port}
```

## Development Server

Start the development server:

```bash
npm run start
```

Open `http://localhost:4200/` in your browser if that is the URL reported by the development server.

To run the application in watch mode:

```bash
npm run watch
```

## Build

Generate a production build:

```bash
npm run build
```

The generated files will be available in the output directory configured in `angular.json`.

## Testing

Run the configured test suite:

```bash
npm run test
```

## License

See the [LICENSE](LICENSE) file for details.
