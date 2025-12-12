#!/bin/bash

# Test theme creation with configuration
curl -X POST "http://localhost:3000/api/admin/themes" \
  -H "Accept: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJiOTc3ODBjMS0wYTQ0LTQ1NjgtYmJhZS01ZWRmNTk0MzEzODIiLCJlbWFpbCI6ImFkbWluQHNsb3RnYW1lLmNvbSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsImlhdCI6MTc2NTQ1NDg1NywiZXhwIjoxNzY1NDU1NzU3fQ.gPKl3-uXYIANhCYoBbhsKyZDbyBq41Yi0pJNACybA0A" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ocean Theme",
    "themeId": "ocean001",
    "configuration": {
      "version": 1,
      "grid": { "rows": 5, "columns": 6 },
      "symbols": [
        { "id": "A", "name": "Ace", "weight": 8, "paytable": [5,15,40], "asset": "A.png" },
        { "id": "K", "name": "King", "weight": 8, "paytable": [5,12,35], "asset": "K.png" },
        { "id": "Q", "name": "Queen", "weight": 9, "paytable": [4,10,30], "asset": "Q.png" }
      ],
      "paylines": [
        { "id": "L1", "positions": [[0,0],[1,0],[2,0],[3,0],[4,0],[5,0]] },
        { "id": "L2", "positions": [[0,1],[1,1],[2,1],[3,1],[4,1],[5,1]] }
      ],
      "bonusRules": { "freeSpins": 5, "multiplier": 2, "scatterTriggerCount": 3 },
      "jackpotRules": { "type": "fixed", "value": 1000 }
    },
    "minBet": 10,
    "maxBet": 1000
  }'
