# SmartSpend

SmartSpend is a full-stack personal finance and expense tracking system. It lets users sign up, record expenses against categories, set monthly budgets, and track progress through a dashboard with charts and achievement badges.

## Tech Stack

**Backend** (`backend/`)
- Java 21, Spring Boot 4.1
- Spring Security + JWT authentication
- Spring Data JPA + MySQL
- Bean validation and a global exception handler
- Maven build (`mvnw`)

**Frontend** (`frontend/`)
- React 19 + Vite 8
- Recharts for dashboard visualizations
- React Router pages, plain CSS styles
- REST API client with bearer-token auth (`src/services/api.js`)

## Project Structure

```
SmartSpend/
├── backend/    # Spring Boot REST API
│   └── src/main/java/com/smartspend/backend/
│       ├── config/        # Security, JWT filter, exception handler
│       ├── controller/    # Auth, User, Category, Expense, Budget, Badge
│       ├── dto/           # Request/response payloads
│       ├── entity/        # User, Category, Expense, Budget, Badge
│       ├── repository/    # Spring Data JPA repositories
│       └── service/       # Business logic + JWT service
├── frontend/   # React + Vite SPA
│   └── src/
│       ├── components/    # Toast, confirmation modal/provider
│       ├── pages/         # Login, Signup, Dashboard, Expenses, Budgets, Badges, Profile
│       ├── services/      # API client
│       └── styles/        # Page stylesheets
└── .github/    # Repository automation hooks
```

## Prerequisites

- Java 21+
- Node.js 20+ and npm
- MySQL 8+
- Maven (or use the included `mvnw` wrapper)

## Getting Started

### 1. Database

```sql
CREATE DATABASE smartspend;
```

Default connection settings live in `backend/src/main/resources/application.properties`:

```
spring.datasource.url=jdbc:mysql://localhost:3306/smartspend
spring.datasource.username=root
spring.datasource.password=root
```

Update the username/password to match your local MySQL install.

### 2. Backend

```bash
cd backend
./mvnw spring-boot:run      # Windows: mvnw.cmd spring-boot:run
```

The API starts at `http://localhost:8080/api`.

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app opens at `http://localhost:5173` and talks to the API at `http://localhost:8080/api`.

## Features

- Email/password signup and login with JWT sessions (remember-me via `localStorage`)
- Expense CRUD with categories and date tracking
- Monthly budget limits per category with an overview of spent vs. remaining
- Dashboard summaries: totals, monthly trends, category breakdowns
- Achievement badges
- Profile management (update name and password)
- Toast notifications and destructive-action confirmation modals

## Available Scripts

| Location | Command | Description |
| --- | --- | --- |
| `frontend/` | `npm run dev` | Start Vite dev server |
| `frontend/` | `npm run build` | Production build |
| `frontend/` | `npm run lint` | Run ESLint |
| `backend/` | `./mvnw spring-boot:run` | Start the API server |
| `backend/` | `./mvnw test` | Run backend tests |
