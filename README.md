FoodX — Food Court Operations Dashboard (Starter scaffold)

Overview
- React (Vite) frontend that shows an attractive dashboard mockup with a food background image
- Node + Express backend with MongoDB (Mongoose) models and simple endpoints for Orders, Inventory, Tables
- Add Order flow supports food category and variety selection (for example Burger -> Chicken Burger, Ice Cream -> Vanilla)
- Existing orders are cleared once for a fresh start, then newly added orders continue from there
- Orders page shows color-themed order cards by category
- Kitchen overview shows category-wise counts of items currently in Preparing status
- Inventory page shows ordered counts per food variety (for example Strawberry, Chicken Burger)
- Docker Compose to run frontend, backend and MongoDB for local development

Quick start (Linux/Windows with Docker):
1. Copy backend/.env.example to backend/.env and adjust if needed.
2. From project root run:
   docker-compose up --build
3. Frontend will be available at http://localhost:3000 and backend at http://localhost:5000

Docker setup notes:
- Frontend is built once and served by Nginx inside the container.
- Backend runs on Node and connects to MongoDB through the Compose network.
- The app UI calls /api paths, which are proxied to the backend in both Vite dev mode and Nginx.

If you prefer running without Docker:
- Backend:
  cd backend
  npm install
  copy .env.example .env and edit
  npm run dev
- Frontend:
  cd frontend
  npm install
  npm run dev

Security scanning with Trivy:
- A GitHub Actions workflow is included to scan filesystem, secrets, config, and container images on pushes and pull requests.
- Local scan command:
  docker run --rm -v "${PWD}:/work" aquasec/trivy:0.54.1 fs /work --severity HIGH,CRITICAL

Next steps (suggestions):
- Expand models: Restaurant, Chef, Waste, Revenue, Analytics
- Add authentication and user roles
- Add Redis for caching realtime metrics
- Add Prometheus/Grafana for service metrics in production

This is a starting scaffold. Ask to continue by:
- Generating more models and endpoints
- Implementing real-time updates with WebSockets
- Building detailed UI pages for each module
