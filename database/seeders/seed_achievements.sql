-- Seed sample achievements for the slot game
-- Run this after running Prisma migrations

INSERT INTO "Achievement" (id, code, name, description, icon, requirement, reward, category, "createdAt")
VALUES 
  -- Gameplay achievements
  (
    gen_random_uuid(),
    'first_spin',
    'First Spin',
    'Complete your first spin',
    'star',
    '{"type": "spins", "count": 1}'::jsonb,
    100,
    'gameplay',
    NOW()
  ),
  (
    gen_random_uuid(),
    'spin_master_100',
    'Spin Master',
    'Complete 100 spins',
    'trophy',
    '{"type": "spins", "count": 100}'::jsonb,
    500,
    'gameplay',
    NOW()
  ),
  (
    gen_random_uuid(),
    'spin_legend_1000',
    'Spin Legend',
    'Complete 1000 spins',
    'crown',
    '{"type": "spins", "count": 1000}'::jsonb,
    2000,
    'gameplay',
    NOW()
  ),
  
  -- Win achievements
  (
    gen_random_uuid(),
    'first_win',
    'First Win',
    'Win your first spin',
    'coin',
    '{"type": "total_wins", "amount": 1}'::jsonb,
    50,
    'wins',
    NOW()
  ),
  (
    gen_random_uuid(),
    'big_winner',
    'Big Winner',
    'Accumulate 10,000 coins in winnings',
    'gem',
    '{"type": "total_wins", "amount": 10000}'::jsonb,
    1000,
    'wins',
    NOW()
  ),
  (
    gen_random_uuid(),
    'jackpot_hunter',
    'Jackpot Hunter',
    'Win 100,000 coins or more in a single spin',
    'fire',
    '{"type": "biggest_win", "amount": 100000}'::jsonb,
    5000,
    'wins',
    NOW()
  ),
  
  -- Milestone achievements
  (
    gen_random_uuid(),
    'wealthy',
    'Wealthy',
    'Reach a balance of 50,000 coins',
    'money_bag',
    '{"type": "balance", "amount": 50000}'::jsonb,
    2500,
    'milestones',
    NOW()
  ),
  (
    gen_random_uuid(),
    'millionaire',
    'Millionaire',
    'Reach a balance of 1,000,000 coins',
    'diamond',
    '{"type": "balance", "amount": 1000000}'::jsonb,
    10000,
    'milestones',
    NOW()
  ),
  (
    gen_random_uuid(),
    'hot_streak',
    'Hot Streak',
    'Win 5 spins in a row',
    'fire',
    '{"type": "consecutive_wins", "count": 5}'::jsonb,
    1500,
    'milestones',
    NOW()
  ),
  (
    gen_random_uuid(),
    'unstoppable',
    'Unstoppable',
    'Win 10 spins in a row',
    'lightning',
    '{"type": "consecutive_wins", "count": 10}'::jsonb,
    5000,
    'milestones',
    NOW()
  );

-- Verify achievements were inserted
SELECT code, name, category, reward FROM "Achievement" ORDER BY category, reward;
