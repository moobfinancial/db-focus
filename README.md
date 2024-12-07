# TalkAI247 Platform

A modern AI-driven communication platform with flexible assistant creation and multi-provider model support.

## 🚀 Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm (v7 or higher)
- PostgreSQL (v13 or higher)
- Git

### Environment Setup

1. Clone the repository:
```bash
git clone https://github.com/yourusername/db-focus.git
cd db-focus
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/dbfocus"

# Authentication
JWT_SECRET="your-jwt-secret-key"
JWT_EXPIRATION="24h"

# Server
PORT=3000
NODE_ENV="development"

# API Keys (if using)
OPENAI_API_KEY="your-openai-key"
ANTHROPIC_API_KEY="your-anthropic-key"
GOOGLE_API_KEY="your-google-key"
```

4. Initialize the database:
```bash
npx prisma generate
npx prisma migrate dev
```

### Running the Application

1. Start the backend server:
```bash
npm start
```

2. In a new terminal, start the frontend development server:
```bash
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173 (or similar port)
- Backend API: http://localhost:3000

## 🔑 Authentication

### Default Admin Account
```json
{
  "email": "admin@example.com",
  "password": "admin123"
}
```

### User Registration
Users can register with:
- Email
- Password (min 8 characters)
- Name

## 🛠️ Development Setup

### Database Setup

1. Create a PostgreSQL database:
```sql
CREATE DATABASE dbfocus;
```

2. Run migrations:
```bash
npx prisma migrate reset --force
```

### Testing

1. Run all tests:
```bash
npm test
```

2. Run specific test suites:
```bash
npm run test:auth    # Authentication tests
npm run test:watch   # Watch mode
```

## 📚 API Documentation

### Authentication Endpoints

#### Register User
```http
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "name": "John Doe"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

## 🔒 Security

### API Keys
Store your API keys in the `.env` file:
```env
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-...
GOOGLE_API_KEY=AIza...
```

### JWT Configuration
- Tokens expire after 24 hours
- Use a strong JWT secret key
- Store tokens in secure HTTP-only cookies

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
```bash
# Check PostgreSQL service
sudo service postgresql status

# Verify database URL
echo $DATABASE_URL
```

2. **CORS Issues**
- Ensure frontend URL is listed in CORS configuration
- Check browser console for CORS errors

3. **Authentication Issues**
- Verify JWT_SECRET is set
- Check token expiration
- Clear browser storage

## 📦 Production Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables:
```env
NODE_ENV=production
DATABASE_URL=your-production-db-url
```

3. Start the production server:
```bash
npm run start:prod
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- OpenAI for model support
- Anthropic for Claude integration
- Google for AI capabilities