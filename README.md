# Lucky Jet Analytics Platform

A comprehensive web application for collecting, storing, and analyzing Lucky Jet crash game data with AI-powered insights. The platform provides educational analytics through manual data input or user-provided casino API links, with clear disclaimers that this is for analytical purposes only, not predictive cheating.

## 🚀 Features

### Core Functionality
- **Casino Link Management**: Store and manage multiple casino API endpoints
- **Data Collection**: Manual input, CSV import, or API-based data fetching
- **AI-Powered Insights**: Pattern recognition and educational trend analysis
- **Real-time Dashboard**: Interactive charts and statistics visualization
- **User Authentication**: Secure JWT-based auth with free/premium tiers
- **Educational Content**: Strategy guides and risk management tools

### Analytics Engine
- **Pattern Detection**: Zigzag, spike, stable, trending, and random patterns
- **Risk Assessment**: Low/medium/high risk level calculations
- **Statistical Analysis**: Volatility, distribution, and trend metrics
- **Insight Generation**: Natural language explanations of patterns

### Subscription Tiers
- **Free Tier**:
  - Store up to 1,000 crash rounds
  - 1 casino link
  - Basic analytics (last 50 rounds)
  - Manual data input only

- **Premium Tier ($9.99/month)**:
  - Unlimited crash rounds storage
  - 10 casino links with auto-fetch
  - Full AI insights (all windows)
  - API access with rate limits
  - Export capabilities
  - Priority support

## 🛠️ Technology Stack

### Frontend
- **Next.js 16.0.1** with TypeScript
- **Tailwind CSS** for styling
- **Recharts** for data visualization
- **React 19.2.0** with modern hooks

### Backend
- **Next.js API Routes** with TypeScript
- **Prisma ORM** for database management
- **PostgreSQL** for data storage
- **JWT Authentication** with refresh tokens
- **Zod** for schema validation

### Database Schema
- **Users**: Authentication and subscription management
- **Casino Links**: User's casino API endpoints
- **Crash Rounds**: Individual game data points
- **Insights**: Cached AI-generated analysis
- **Sessions**: User authentication sessions

## 📋 Installation

### Prerequisites
- Node.js 18+ and npm
- PostgreSQL database
- Git

### Setup Instructions

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd My_aviator_bot
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Set up the database**
   ```bash
   npx prisma dev
   npx prisma migrate dev --name init
   ```

5. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   Navigate to `http://localhost:3000`

### Environment Variables

Create a `.env` file with the following variables:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/luckyjet_analytics"

# Authentication
JWT_SECRET="your-super-secret-jwt-key-min-32-characters"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-characters"

# External Services (Optional)
OPENAI_API_KEY="your-openai-api-key-for-advanced-insights"
TELEGRAM_BOT_TOKEN="your-telegram-bot-token"

# Rate Limiting
REDIS_URL="redis://localhost:6379"

# Security
ENCRYPTION_KEY="your-32-character-encryption-key"
CORS_ORIGIN="http://localhost:3000"

# Development
NODE_ENV="development"
```

## 📊 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Create new user account
- `POST /api/auth/login` - Authenticate user
- `GET /api/auth/me` - Get current user info

### Casino Links Endpoints
- `GET /api/links` - List user's casino links
- `POST /api/links` - Add new casino link
- `PUT /api/links/:id` - Update casino link
- `DELETE /api/links/:id` - Remove casino link

### Crash Data Endpoints
- `POST /api/rounds/bulk` - Save multiple rounds (batch import)
- `GET /api/rounds` - Retrieve stored rounds with filters
- `POST /api/rounds` - Save single round

### Analytics Endpoints
- `GET /api/analytics/summary` - Get overall statistics
- `POST /api/analytics/insights` - Generate AI insights
- `GET /api/analytics/insights` - Retrieve cached insights

### Example API Usage

```javascript
// Add a single round
const response = await fetch('/api/rounds', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    roundId: 'round_12345',
    multiplier: 2.45,
    crashTimestamp: new Date().toISOString(),
    sourceLinkId: 'link_12345' // optional
  })
});

// Generate insights
const insights = await fetch('/api/analytics/insights', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ windowSize: 20 })
});
```

## 🧠 AI Insights Engine

The platform uses sophisticated algorithms to analyze crash game patterns:

### Pattern Types
1. **Zigzag Pattern**: Alternating high/low multipliers
2. **Spike Pattern**: Isolated high multipliers
3. **Stable Pattern**: Consistent multiplier range
4. **Trending Pattern**: Gradual increase/decrease
5. **Random Pattern**: No discernible pattern

### Analysis Windows
- **Window A**: Last 10 rounds (short-term patterns)
- **Window B**: Last 20 rounds (medium-term patterns)
- **Window C**: Last 50 rounds (long-term patterns)

### Risk Assessment
Risk levels are calculated based on:
- Volatility (40% weight)
- Average multiplier (30% weight)
- Pattern type (30% weight)

## 🔒 Security & Compliance

### Data Protection
- Passwords hashed with bcrypt (cost factor 12)
- JWT tokens with 15-minute expiry
- Encrypted storage of sensitive data
- Rate limiting on all endpoints

### Educational Disclaimers
All pages include clear educational disclaimers stating:
- Analytics tool for educational purposes only
- No guaranteed predictions
- Risk warnings and responsible gambling messaging
- Data privacy and usage transparency

### Legal Compliance
- GDPR-compliant data handling
- Clear terms of service
- Age verification requirements
- No encouragement of illegal behavior

## 📱 User Guide

### Getting Started
1. **Register Account**: Create a free account with email and password
2. **Add Data**: Manually enter rounds or import CSV files
3. **Generate Insights**: Run AI analysis on your data
4. **View Dashboard**: Monitor trends and statistics

### Data Input Methods
- **Manual Entry**: Add individual rounds with round ID and multiplier
- **CSV Import**: Bulk import with format `round_id,multiplier`
- **API Integration**: Connect casino links for automatic data fetching

### Understanding Insights
- **Risk Levels**: Low (stable), Medium (caution), High (volatile)
- **Pattern Descriptions**: Clear explanations of detected patterns
- **Educational Guidance**: Strategy suggestions based on analysis

## 🤝 Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- TypeScript for all new code
- Follow ESLint configuration
- Add tests for new features
- Update documentation

### Project Structure
```
My_aviator_bot/
├── src/
│   ├── app/                    # Next.js App Router pages
│   ├── lib/                    # Utility libraries
│   └── components/             # React components
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── public/                    # Static assets
└── docs/                      # Documentation
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Important Disclaimer

**This platform is for educational and analytical purposes only.**

- No predictions are guaranteed
- Past performance does not indicate future results
- Always gamble responsibly
- Never bet more than you can afford to lose
- This is not a gambling or betting platform

## 🆘 Support

- **Documentation**: Check this README and inline code comments
- **Issues**: Report bugs via GitHub Issues
- **Features**: Request features via GitHub Discussions
- **Premium Support**: Available for premium subscribers

## 🗺️ Roadmap

### Upcoming Features
- [ ] Mobile app (React Native)
- [ ] Advanced machine learning insights
- [ ] Real-time collaboration features
- [ ] Enhanced export formats
- [ ] Integration with more casino platforms
- [ ] Educational video content
- [ ] Community features and forums

### Known Limitations
- Manual data entry required for most casinos
- Pattern accuracy depends on data quality
- Free tier has limited features
- Requires technical knowledge for API integration

---

**Built with ❤️ for educational purposes only**