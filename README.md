<img src="./frontend/public/logo.svg" alt="Logo" width="400" />

# ultimate vhost

A dynamic reverse proxy server with route management, analytics, and logging, built with Node.js, Express, and Prisma.

## Project Purpose
This project provides a flexible reverse proxy server that allows dynamic management of hostname-to-target URL routes via a REST API. It features real-time server analytics, request/response logging, and persistent route storage using SQLite and Prisma ORM.

## Technology Stack
- **Node.js**: JavaScript runtime
- **Express (ultimate-express)**: Web server framework
- **express-http-proxy**: Proxy middleware
- **Prisma**: ORM for database management
- **SQLite**: Lightweight database
- **systeminformation**: Server analytics

## Features
- Dynamic proxy routing based on hostname
- RESTful API for managing routes (add, edit, delete, list)
- Real-time server analytics (CPU, memory, network, disk)
- In-memory and console logging for requests, responses, and errors
- CORS enabled for API endpoints
- Secure route management (restricted to localhost)

## Setup Instructions
1. **Install dependencies**
   ```bash
   cd server
   npm install
   ```
2. **Set up the database**
   - The database is configured as SQLite (`server/prisma/schema.prisma`).
   - To initialize the database, run:
     ```bash
     npx prisma migrate dev --name init
     ```
3. **Start the server**
   ```bash
   node index.js
   ```

## Usage
- The server listens for HTTP requests and proxies them based on the hostname.
- Manage routes via the following API endpoints (localhost only):
  - `POST /api/routes` — Add a new route `{ hostname, targetUrl }`
  - `GET /api/routes` — List all routes
  - `PUT /api/routes/:id` — Edit a route
  - `DELETE /api/routes/:id` — Delete a route
- All API requests must be made from `localhost` for security.

## Route Management Example
```bash
# Add a route
curl -X POST http://localhost:PORT/api/routes -H 'Content-Type: application/json' -d '{"hostname":"example.com","targetUrl":"http://localhost:3000"}'

# List routes
curl http://localhost:PORT/api/routes

# Edit a route
curl -X PUT http://localhost:PORT/api/routes/1 -H 'Content-Type: application/json' -d '{"hostname":"new.com","targetUrl":"http://localhost:4000"}'

# Delete a route
curl -X DELETE http://localhost:PORT/api/routes/1
```

## Analytics & Logging
- Server analytics are available via `/api/analytics` and `/api/server-stats` endpoints.
- Logs are stored in memory (up to 100 entries) and printed to the console.
- Each request and proxy event is logged with a unique request ID.

## Database Schema
See `server/prisma/schema.prisma`:
```
model Route {
  id          Int      @id @default(autoincrement())
  hostname    String   @unique
  targetUrl   String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}
```

## Contributing
Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## License
ISC
