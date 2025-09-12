Here's the rest of your README.md with the project structure section filled out.

```
# NestJS GraphQL API with JWT Auth and RBAC

A complete backend application built with **NestJS**, a **GraphQL API (code-first)**, and **PostgreSQL**.  
It features a robust authentication and authorization system designed for production use, including:

- 🔑 Secure registration & login  
- 🔐 JWT access tokens with **rotating refresh tokens**  
- 🛡️ Role-Based Access Control (RBAC)  

---

## 🚀 Key Features

- **Tech Stack**: NestJS, GraphQL, PostgreSQL, TypeORM, @nestjs/config, Argon2 for password hashing  
- **Authentication**: JWT-based access tokens with a rotating refresh token system  
- **Authorization**: RBAC with Role and Permission entities + custom GraphQL guards  
- **Database**: Containerized PostgreSQL with persistence and migration support  
- **Configuration**: Environment-driven config with schema validation  
- **Security**: Argon2, helmet, CORS, class-validator  
- **Developer Experience**:  
  - `docker-compose.yml` → one-command setup  
  - Multi-stage Dockerfile for production builds  
  - NPM scripts for common tasks  
- **API Docs**:  
  - GraphQL Playground → `/graphql`  
  - Swagger UI (REST endpoints) → `/docs`  
- **Testing**: Unit + end-to-end (e2e) tests  

---

## 📂 Project Structure

```

├── dist/ \# Compiled JavaScript files
├── node_modules/ \# Dependencies
├── src/
│ ├── auth/ \# Authentication logic (JWT, password hashing)
│ ├── common/ \# Shared components (decorators, constants, etc.)
│ ├── config/ \# Environment configuration
│ ├── database/ \# TypeORM configuration, migrations
│ ├── user/ \# User-related GraphQL types, resolvers, services
│ ├── app.module.ts \# Root application module
│ ├── main.ts \# Application entry point
├── test/
│ ├── e2e/ \# End-to-end tests
│ └── unit/ \# Unit tests
├── .env.example \# Example environment variables file
├── .dockerignore \# Files to ignore in Docker builds
├── .eslintrc.js \# ESLint configuration
├── .gitignore \# Git ignore rules
├── docker-compose.yml \# Docker Compose for local development
├── Dockerfile \# Docker image definition
├── package.json \# Project dependencies and scripts
├── nest-cli.json \# Nest CLI configuration
├── tsconfig.json \# TypeScript configuration
└── README.md \# This file

````

---

## 🏁 Getting Started

### Prerequisites

- [**Node.js**](https://nodejs.org/) (v16 or higher)
- [**Docker**](https://www.docker.com/)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [https://your-repository-url.git](https://your-repository-url.git)
    cd your-project-folder
    ```

2.  **Set up environment variables:**
    Create a `.env` file by copying the `.env.example` file.
    ```bash
    cp .env.example .env
    ```
    Update the variables in the `.env` file as needed.

3.  **Start the development environment:**
    ```bash
    npm run dev:docker
    ```
    This command uses Docker Compose to build the application and start the PostgreSQL database and the NestJS server. It also watches for file changes and reloads automatically.

4.  **Access the API:**
    - **GraphQL Playground**: `http://localhost:3000/graphql`
    - **Swagger UI**: `http://localhost:3000/docs`

---

## 🧪 Testing

- **Run all tests**:
  ```bash
  npm test
````

- **Run E2E tests**:
  ```bash
  npm run test:e2e
  ```
- **Run unit tests**:
  ```bash
  npm run test:unit
  ```

<!-- end list -->

```

```
