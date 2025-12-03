# Gamification System - Leaderboards & Achievements

## Overview
The slot game includes a comprehensive gamification system with achievements and leaderboards to enhance player engagement.

## Achievements System

### Achievement Types

Achievements are milestone-based rewards that unlock automatically when players meet specific criteria. Each achievement grants bonus coins.

**Achievement Categories:**
- **Gameplay** - Based on number of spins
- **Wins** - Based on total or biggest wins
- **Milestones** - Based on balance or streaks

### Default Achievements

| Code | Name | Requirement | Reward |
|------|------|------------|--------|
| `first_spin` | First Spin | Complete 1 spin | 100 coins |
| `spin_master_100` | Spin Master | Complete 100 spins | 500 coins |
| `spin_legend_1000` | Spin Legend | Complete 1000 spins | 2000 coins |
| `first_win` | First Win | Win 1+ coins | 50 coins |
| `big_winner` | Big Winner | Win 10,000+ total coins | 1000 coins |
| `jackpot_hunter` | Jackpot Hunter | Win 100,000+ in single spin | 5000 coins |
| `wealthy` | Wealthy | Reach 50,000 balance | 2500 coins |
| `millionaire` | Millionaire | Reach 1,000,000 balance | 10000 coins |
| `hot_streak` | Hot Streak | Win 5 spins in a row | 1500 coins |
| `unstoppable` | Unstoppable | Win 10 spins in a row | 5000 coins |

### Achievement Requirement Types

```json
// Spin count
{ "type": "spins", "count": 100 }

// Total wins amount
{ "type": "total_wins", "amount": 10000 }

// Biggest single win
{ "type": "biggest_win", "amount": 100000 }

// Balance threshold
{ "type": "balance", "amount": 50000 }

// Consecutive winning spins
{ "type": "consecutive_wins", "count": 5 }
```

### Player Endpoints

#### Get My Achievements
```
GET /api/gamification/achievements
Authorization: Bearer JWT_TOKEN
```

**Response:**
```json
{
  "achievements": [
    {
      "id": "uuid",
      "code": "first_spin",
      "name": "First Spin",
      "description": "Complete your first spin",
      "icon": "star",
      "requirement": { "type": "spins", "count": 1 },
      "reward": 100,
      "category": "gameplay",
      "unlocked": true,
      "unlockedAt": "2024-12-03T10:30:00Z",
      "progress": 100
    },
    {
      "id": "uuid",
      "code": "spin_master_100",
      "name": "Spin Master",
      "unlocked": false,
      "unlockedAt": null,
      "progress": 45
    }
  ]
}
```

### Admin Endpoints

#### Create Achievement
```
POST /api/gamification/admin/achievements
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "code": "vip_player",
  "name": "VIP Player",
  "description": "Reach VIP status by spinning 5000 times",
  "icon": "crown",
  "requirement": {
    "type": "spins",
    "count": 5000
  },
  "reward": 10000,
  "category": "gameplay"
}
```

#### Get Achievement Statistics
```
GET /api/gamification/admin/achievements/stats
Authorization: Bearer ADMIN_JWT_TOKEN
```

**Response:**
```json
{
  "totalAchievements": 10,
  "achievements": [
    {
      "id": "uuid",
      "code": "first_spin",
      "name": "First Spin",
      "category": "gameplay",
      "totalUnlocked": 450,
      "reward": 100
    }
  ]
}
```

#### Delete Achievement
```
DELETE /api/gamification/admin/achievements/:id
Authorization: Bearer ADMIN_JWT_TOKEN
```

### Automatic Unlock System

Achievements are checked and unlocked automatically:
1. **After every spin** - System checks user progress against all achievements
2. **Atomically** - Achievement unlock and reward credit happen in a single transaction
3. **Real-time** - Player receives notification immediately in spin response

**Spin Response with Achievement:**
```json
{
  "spinId": "uuid",
  "winAmount": 500,
  "newBalance": 15600,
  "achievements": [
    {
      "id": "uuid",
      "code": "spin_master_100",
      "name": "Spin Master",
      "reward": 500
    }
  ]
}
```

## Leaderboards System

### Leaderboard Types

1. **TOTAL_WINS** - Cumulative winnings (all WIN transactions)
2. **BIGGEST_WIN** - Largest single spin win
3. **MOST_SPINS** - Number of spins completed
4. **HIGHEST_BALANCE** - Current wallet balance

### Leaderboard Periods

1. **DAILY** - Today (resets at midnight)
2. **WEEKLY** - Last 7 days
3. **MONTHLY** - Current calendar month
4. **ALL_TIME** - Since system inception

### Player Endpoints

#### Get Leaderboard
```
GET /api/gamification/leaderboard?type=TOTAL_WINS&period=WEEKLY
Authorization: Bearer JWT_TOKEN
```

**Query Parameters:**
- `type` - TOTAL_WINS | BIGGEST_WIN | MOST_SPINS | HIGHEST_BALANCE
- `period` - DAILY | WEEKLY | MONTHLY | ALL_TIME

**Response:**
```json
{
  "id": "uuid",
  "type": "TOTAL_WINS",
  "period": "WEEKLY",
  "startDate": "2024-11-27T00:00:00Z",
  "endDate": "2024-12-03T23:59:59Z",
  "entries": [
    {
      "rank": 1,
      "userId": "uuid",
      "displayName": "ProGamer123",
      "score": 250000
    },
    {
      "rank": 2,
      "userId": "uuid",
      "displayName": "LuckyPlayer",
      "score": 180000
    }
  ]
}
```

#### Get My Rank
```
GET /api/gamification/rank?type=TOTAL_WINS&period=WEEKLY
Authorization: Bearer JWT_TOKEN
```

**Response:**
```json
{
  "rank": 15,
  "score": 45000,
  "total": 450
}
```

### Admin Endpoints

#### Generate Leaderboard
```
POST /api/gamification/admin/leaderboards/generate
Authorization: Bearer ADMIN_JWT_TOKEN
Content-Type: application/json

{
  "type": "TOTAL_WINS",
  "period": "WEEKLY"
}
```

Manually triggers leaderboard generation for the specified type and period.

#### Refresh All Leaderboards
```
POST /api/gamification/admin/leaderboards/refresh
Authorization: Bearer ADMIN_JWT_TOKEN
```

Regenerates all leaderboard combinations (4 types × 4 periods = 16 leaderboards).

**Use case:** Run as a cron job daily/hourly to keep leaderboards fresh.

### Automatic Generation

Leaderboards are generated automatically:
- When first requested by a player (if not exists for current period)
- Via admin refresh endpoint
- Recommended: Set up cron job to call refresh endpoint

### Leaderboard Caching

- Leaderboards are persisted in the database
- Top 100 players stored per leaderboard
- Multiple leaderboard instances can exist for same type/period
- Most recent leaderboard is returned on GET requests

## Database Schema

### Achievement Table
```sql
CREATE TABLE "Achievement" (
  id UUID PRIMARY KEY,
  code VARCHAR UNIQUE,
  name VARCHAR,
  description TEXT,
  icon VARCHAR,
  requirement JSONB,
  reward INTEGER,
  category VARCHAR,
  createdAt TIMESTAMP
)
```

### UserAchievement Table
```sql
CREATE TABLE "UserAchievement" (
  id UUID PRIMARY KEY,
  userId UUID REFERENCES "User"(id),
  achievementId UUID REFERENCES "Achievement"(id),
  unlockedAt TIMESTAMP,
  progress INTEGER,
  UNIQUE(userId, achievementId)
)
```

### Leaderboard & LeaderboardEntry Tables
```sql
CREATE TABLE "Leaderboard" (
  id UUID PRIMARY KEY,
  type ENUM,
  period ENUM,
  startDate TIMESTAMP,
  endDate TIMESTAMP,
  createdAt TIMESTAMP
)

CREATE TABLE "LeaderboardEntry" (
  id UUID PRIMARY KEY,
  leaderboardId UUID REFERENCES "Leaderboard"(id),
  userId UUID,
  userEmail VARCHAR,
  displayName VARCHAR,
  score INTEGER,
  rank INTEGER,
  UNIQUE(leaderboardId, userId)
)
```

## Seeding Achievements

Load default achievements into database:

```bash
psql -h YOUR_HOST -U slotuser -d slotdb -f database/seeders/seed_achievements.sql
```

Or via Prisma Studio after running migrations.

## Performance Considerations

1. **Achievement Checks** - Run efficiently with single user query including relations
2. **Leaderboard Generation** - Uses aggregation queries, limit to top 100
3. **Caching** - Leaderboards cached in DB, regenerate periodically
4. **Indexes** - Add indexes on frequently queried fields (userId, type, period)

## Integration with Frontend

### Display Achievement Popup
When a spin response includes `achievements` array, show a popup/toast:
```javascript
if (spinResult.achievements && spinResult.achievements.length > 0) {
  spinResult.achievements.forEach(achievement => {
    showAchievementPopup({
      name: achievement.name,
      icon: achievement.icon,
      reward: achievement.reward
    });
  });
}
```

### Leaderboard Widget
```javascript
// Fetch and display weekly leaderboard
const leaderboard = await fetch('/api/gamification/leaderboard?type=TOTAL_WINS&period=WEEKLY');
const myRank = await fetch('/api/gamification/rank?type=TOTAL_WINS&period=WEEKLY');

// Show player's rank prominently
renderLeaderboard(leaderboard.entries, myRank);
```

## Future Enhancements

- **Social Features** - Share achievements on social media
- **Badges** - Visual badges displayed on profile
- **Quests** - Multi-step challenges with bigger rewards
- **Seasonal Events** - Limited-time achievements and leaderboards
- **Team Leaderboards** - Clan/guild based rankings
