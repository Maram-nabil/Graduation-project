# DigitalOcean App Platform Deployment

## Quick Deploy

### Option 1: Using DigitalOcean Dashboard
1. Go to [DigitalOcean Apps](https://cloud.digitalocean.com/apps)
2. Click "Create App"
3. Connect your GitHub repo
4. Select the branch to deploy
5. Configure environment variables (see below)
6. Deploy

### Option 2: Using doctl CLI
```bash
doctl apps create --spec .do/app.yaml
```

## Environment Variables

Set these in the DigitalOcean dashboard:

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | Yes | MongoDB connection string |
| `JWT_KEY` | Yes | Secret key for JWT tokens |
| `EMAIL_USER` | No | Email service username |
| `EMAIL_PASS` | No | Email service password |
| `CORS_ORIGIN` | No | Allowed CORS origins |

## Project Structure

```
src/
├── app.js           # Express app setup
├── server.js        # Server entry point
├── config/
│   ├── index.js     # Centralized config
│   └── database.js  # DB connection
├── middleware/      # Express middleware
├── module/          # Feature modules
├── utils/           # Utility functions
└── DB/              # Database models
```

## Local Development

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start
```

## Health Check

The app exposes `/health` endpoint for monitoring:
```
GET /health
Response: { "status": "healthy", "timestamp": "..." }
```
