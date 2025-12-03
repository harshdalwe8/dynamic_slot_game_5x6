import React, { useState, useEffect } from 'react';
import { spinSlot, getWalletBalance } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import styled, { keyframes } from 'styled-components';

interface Symbol {
  id: string;
  name: string;
  image?: string;
  emoji?: string;
}

interface SpinResult {
  grid: string[][];
  win: number;
  balance: number;
  winningLines?: Array<{
    positions: Array<{ row: number; col: number }>;
    symbol: string;
    multiplier: number;
  }>;
}

const SlotMachine: React.FC = () => {
  const { user } = useAuth();
  const [grid, setGrid] = useState<string[][]>([]);
  const [balance, setBalance] = useState<number>(0);
  const [betAmount, setBetAmount] = useState<number>(10);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number>(0);
  const [winningPositions, setWinningPositions] = useState<Set<string>>(new Set());
  const [showWinMessage, setShowWinMessage] = useState(false);
  const [error, setError] = useState<string>('');

  // Default symbols (will be replaced with theme symbols)
  const defaultSymbols = ['🍒', '🍋', '🍊', '🍇', '🍉', '💎', '⭐', '7️⃣'];

  // Initialize empty grid
  useEffect(() => {
    initializeGrid();
    fetchBalance();
  }, []);

  const initializeGrid = () => {
    const emptyGrid: string[][] = [];
    for (let row = 0; row < 6; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < 5; col++) {
        rowData.push(defaultSymbols[Math.floor(Math.random() * defaultSymbols.length)]);
      }
      emptyGrid.push(rowData);
    }
    setGrid(emptyGrid);
  };

  const fetchBalance = async () => {
    try {
      const response = await getWalletBalance();
      setBalance(response.balance);
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  };

  const handleSpin = async () => {
    if (isSpinning) return;
    if (betAmount > balance) {
      setError('Insufficient balance!');
      return;
    }
    if (betAmount < 1) {
      setError('Minimum bet is 1 coin');
      return;
    }

    setError('');
    setIsSpinning(true);
    setWinningPositions(new Set());
    setShowWinMessage(false);
    setLastWin(0);

    try {
      // Start spinning animation
      await animateSpinning();

      // Call backend API
      const result: SpinResult = await spinSlot(betAmount);

      // Update grid with result
      setGrid(result.grid);
      setBalance(result.balance);
      setLastWin(result.win);

      // Highlight winning positions
      if (result.winningLines && result.winningLines.length > 0) {
        const positions = new Set<string>();
        result.winningLines.forEach((line) => {
          line.positions.forEach((pos) => {
            positions.add(`${pos.row}-${pos.col}`);
          });
        });
        setWinningPositions(positions);
        setShowWinMessage(true);

        // Hide win message after 3 seconds
        setTimeout(() => setShowWinMessage(false), 3000);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Spin failed. Please try again.');
      console.error('Spin error:', err);
    } finally {
      setIsSpinning(false);
    }
  };

  const animateSpinning = () => {
    return new Promise<void>((resolve) => {
      let iterations = 0;
      const maxIterations = 15;

      const interval = setInterval(() => {
        setGrid((prevGrid) => {
          const newGrid: string[][] = [];
          for (let row = 0; row < 6; row++) {
            const rowData: string[] = [];
            for (let col = 0; col < 5; col++) {
              rowData.push(defaultSymbols[Math.floor(Math.random() * defaultSymbols.length)]);
            }
            newGrid.push(rowData);
          }
          return newGrid;
        });

        iterations++;
        if (iterations >= maxIterations) {
          clearInterval(interval);
          resolve();
        }
      }, 100);
    });
  };

  const adjustBet = (amount: number) => {
    const newBet = betAmount + amount;
    if (newBet >= 1 && newBet <= balance) {
      setBetAmount(newBet);
    }
  };

  const isWinningPosition = (row: number, col: number): boolean => {
    return winningPositions.has(`${row}-${col}`);
  };

  return (
    <Container>
      <SlotMachineFrame>
        <Header>
          <BalanceDisplay>
            <BalanceLabel>Balance</BalanceLabel>
            <BalanceAmount>{balance.toFixed(0)}</BalanceAmount>
            <BalanceCoins>coins</BalanceCoins>
          </BalanceDisplay>

          {lastWin > 0 && showWinMessage && (
            <WinMessage>
              <WinIcon>🎉</WinIcon>
              <WinText>You Won!</WinText>
              <WinAmount>+{lastWin} coins</WinAmount>
            </WinMessage>
          )}
        </Header>

        <GridContainer>
          <ReelContainer>
            {grid.map((row, rowIndex) => (
              <ReelRow key={rowIndex}>
                {row.map((symbol, colIndex) => (
                  <Reel
                    key={`${rowIndex}-${colIndex}`}
                    $isSpinning={isSpinning}
                    $delay={colIndex * 0.1}
                    $isWinning={isWinningPosition(rowIndex, colIndex)}
                  >
                    <SymbolDisplay>{symbol}</SymbolDisplay>
                  </Reel>
                ))}
              </ReelRow>
            ))}
          </ReelContainer>
        </GridContainer>

        <Controls>
          <BetSection>
            <BetLabel>Bet Amount</BetLabel>
            <BetControls>
              <BetButton onClick={() => adjustBet(-10)} disabled={isSpinning || betAmount <= 10}>
                -10
              </BetButton>
              <BetButton onClick={() => adjustBet(-1)} disabled={isSpinning || betAmount <= 1}>
                -1
              </BetButton>
              <BetDisplay>{betAmount}</BetDisplay>
              <BetButton onClick={() => adjustBet(1)} disabled={isSpinning || betAmount >= balance}>
                +1
              </BetButton>
              <BetButton onClick={() => adjustBet(10)} disabled={isSpinning || betAmount + 10 > balance}>
                +10
              </BetButton>
            </BetControls>
          </BetSection>

          <SpinButton onClick={handleSpin} disabled={isSpinning || betAmount > balance}>
            {isSpinning ? (
              <>
                <Spinner>⚙️</Spinner> Spinning...
              </>
            ) : (
              <>🎰 SPIN</>
            )}
          </SpinButton>

          <QuickBets>
            <QuickBetButton onClick={() => setBetAmount(10)} disabled={isSpinning || balance < 10}>
              10
            </QuickBetButton>
            <QuickBetButton onClick={() => setBetAmount(50)} disabled={isSpinning || balance < 50}>
              50
            </QuickBetButton>
            <QuickBetButton onClick={() => setBetAmount(100)} disabled={isSpinning || balance < 100}>
              100
            </QuickBetButton>
            <QuickBetButton onClick={() => setBetAmount(Math.min(balance, 500))} disabled={isSpinning || balance < 1}>
              MAX
            </QuickBetButton>
          </QuickBets>
        </Controls>

        {error && <ErrorMessage>{error}</ErrorMessage>}
      </SlotMachineFrame>
    </Container>
  );
};

// Animations
const spin = keyframes`
  0% { transform: translateY(0); }
  100% { transform: translateY(-100%); }
`;

const glow = keyframes`
  0%, 100% { 
    box-shadow: 0 0 10px #ffd700, 0 0 20px #ffd700, 0 0 30px #ffd700;
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 0 20px #ffd700, 0 0 40px #ffd700, 0 0 60px #ffd700;
    transform: scale(1.05);
  }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
`;

const rotate = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled Components
const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
`;

const SlotMachineFrame = styled.div`
  background: linear-gradient(145deg, #2c3e50, #34495e);
  border-radius: 30px;
  padding: 30px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  border: 5px solid #f39c12;
  max-width: 900px;
  width: 100%;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 0 10px;
`;

const BalanceDisplay = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 15px 25px;
  border-radius: 15px;
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.2);
`;

const BalanceLabel = styled.div`
  color: #bdc3c7;
  font-size: 0.9rem;
  margin-bottom: 5px;
`;

const BalanceAmount = styled.div`
  color: #f39c12;
  font-size: 2rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
`;

const BalanceCoins = styled.span`
  color: #bdc3c7;
  font-size: 0.85rem;
  margin-left: 5px;
`;

const WinMessage = styled.div`
  background: linear-gradient(135deg, #f39c12, #e67e22);
  padding: 15px 30px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  animation: ${pulse} 0.5s ease-in-out;
  box-shadow: 0 10px 30px rgba(243, 156, 18, 0.5);
`;

const WinIcon = styled.span`
  font-size: 2rem;
`;

const WinText = styled.span`
  color: white;
  font-size: 1.2rem;
  font-weight: bold;
`;

const WinAmount = styled.span`
  color: #fff;
  font-size: 1.5rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
`;

const GridContainer = styled.div`
  background: linear-gradient(145deg, #1a1a2e, #16213e);
  padding: 20px;
  border-radius: 20px;
  border: 3px solid #f39c12;
  box-shadow: inset 0 0 30px rgba(0, 0, 0, 0.5);
`;

const ReelContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ReelRow = styled.div`
  display: flex;
  gap: 8px;
  justify-content: center;
`;

const Reel = styled.div<{ $isSpinning: boolean; $delay: number; $isWinning: boolean }>`
  width: 100px;
  height: 100px;
  background: ${props => props.$isWinning ? 'linear-gradient(145deg, #ffd700, #ffed4e)' : 'linear-gradient(145deg, #ecf0f1, #bdc3c7)'};
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  border: 3px solid ${props => props.$isWinning ? '#ffd700' : '#34495e'};
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;

  ${props => props.$isSpinning && `
    animation: ${spin} 0.1s linear infinite;
    animation-delay: ${props.$delay}s;
  `}

  ${props => props.$isWinning && `
    animation: ${glow} 1s ease-in-out infinite;
  `}

  &:hover {
    transform: scale(1.05);
  }
`;

const SymbolDisplay = styled.div`
  user-select: none;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Controls = styled.div`
  margin-top: 30px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const BetSection = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const BetLabel = styled.div`
  color: #ecf0f1;
  font-size: 1rem;
  font-weight: 600;
`;

const BetControls = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const BetButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(145deg, #3498db, #2980b9);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(52, 152, 219, 0.4);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const BetDisplay = styled.div`
  background: rgba(255, 255, 255, 0.1);
  padding: 10px 30px;
  border-radius: 10px;
  color: #f39c12;
  font-size: 1.5rem;
  font-weight: bold;
  font-family: 'Courier New', monospace;
  border: 2px solid rgba(255, 255, 255, 0.2);
  min-width: 100px;
  text-align: center;
`;

const SpinButton = styled.button`
  padding: 20px 60px;
  background: linear-gradient(145deg, #e74c3c, #c0392b);
  color: white;
  border: none;
  border-radius: 20px;
  font-size: 1.8rem;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  box-shadow: 0 10px 30px rgba(231, 76, 60, 0.4);
  align-self: center;

  &:hover:not(:disabled) {
    transform: translateY(-5px);
    box-shadow: 0 15px 40px rgba(231, 76, 60, 0.6);
  }

  &:active:not(:disabled) {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
    transform: none;
  }
`;

const Spinner = styled.span`
  display: inline-block;
  animation: ${rotate} 1s linear infinite;
`;

const QuickBets = styled.div`
  display: flex;
  justify-content: center;
  gap: 10px;
`;

const QuickBetButton = styled.button`
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.1);
  color: #ecf0f1;
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.2);
    border-color: #f39c12;
    color: #f39c12;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  margin-top: 15px;
  padding: 12px 20px;
  background: rgba(231, 76, 60, 0.2);
  border: 2px solid #e74c3c;
  border-radius: 10px;
  color: #e74c3c;
  text-align: center;
  font-weight: 600;
`;

export default SlotMachine;
