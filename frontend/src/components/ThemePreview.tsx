import React, { useState, useMemo } from 'react';
import styled, { keyframes } from 'styled-components';
import { Theme } from '../services/playerApi';
import { demospinSlot, DemoSpinResult } from '../services/demoApi';

interface ThemePreviewProps {
  theme: Theme;
  onClose: () => void;
}

const ThemePreview: React.FC<ThemePreviewProps> = ({ theme, onClose }) => {
  const [demoBalance, setDemoBalance] = useState(50000); // Start with 50k demo coins
  const [betAmount, setBetAmount] = useState(theme.minBet);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastResult, setLastResult] = useState<DemoSpinResult | null>(null);
  const [spinHistory, setSpinHistory] = useState<DemoSpinResult[]>([]);
  const [error, setError] = useState('');

  const canSpin = useMemo(() => demoBalance >= betAmount && !isSpinning, [demoBalance, betAmount, isSpinning]);

  const handleSpin = async () => {
    if (!canSpin) return;

    setIsSpinning(true);
    setError('');

    try {
      // Simulate spin delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      const result = await demospinSlot(theme.id, betAmount);
      
      // Update demo balance
      const newBalance = demoBalance - betAmount + result.winAmount;
      setDemoBalance(newBalance);

      setLastResult(result);
      setSpinHistory([result, ...spinHistory.slice(0, 9)]); // Keep last 10 spins
    } catch (err: any) {
      setError('Failed to execute demo spin');
      console.error('Demo spin error:', err);
    } finally {
      setIsSpinning(false);
    }
  };

  const handleResetBalance = () => {
    setDemoBalance(50000);
    setLastResult(null);
    setSpinHistory([]);
    setError('');
  };

  const handleBetChange = (amount: number) => {
    if (amount >= theme.minBet && amount <= theme.maxBet) {
      setBetAmount(amount);
    }
  };

  return (
    <PreviewContainer>
      <PreviewHeader>
        <PreviewTitle>
          🎮 Preview: {theme.name}
          <DemoLabel>DEMO MODE</DemoLabel>
        </PreviewTitle>
        <CloseButton onClick={onClose}>✕</CloseButton>
      </PreviewHeader>

      <PreviewContent>
        {/* Controls Section */}
        <ControlsSection>
          <BalanceDisplay>
            <BalanceLabel>Demo Balance</BalanceLabel>
            <BalanceValue>{demoBalance.toLocaleString()} Coins</BalanceValue>
          </BalanceDisplay>

          <BetControls>
            <BetLabel>Bet Amount</BetLabel>
            <BetButtonGroup>
              {[theme.minBet, theme.minBet * 2, theme.minBet * 5, theme.maxBet].map((amount) => (
                amount <= theme.maxBet && (
                  <BetButton
                    key={amount}
                    selected={betAmount === amount}
                    onClick={() => handleBetChange(amount)}
                  >
                    ${amount}
                  </BetButton>
                )
              ))}
            </BetButtonGroup>
            <CustomBetInput
              type="number"
              value={betAmount}
              onChange={(e) => handleBetChange(Number(e.target.value))}
              min={theme.minBet}
              max={theme.maxBet}
              placeholder={`${theme.minBet} - ${theme.maxBet}`}
            />
          </BetControls>

          <ButtonGroup>
            <SpinButton onClick={handleSpin} disabled={canSpin} isSpinning={isSpinning}>
              {isSpinning ? '⏳ SPINNING...' : '🎰 SPIN (FREE)'}
            </SpinButton>
            <ResetButton onClick={handleResetBalance}>↻ Reset Demo</ResetButton>
          </ButtonGroup>
        </ControlsSection>

        {/* Game Grid Display */}
        <GameSection>
          <GameTitle>Game Grid Preview</GameTitle>
          {lastResult ? (
            <GameGrid>
              {lastResult.result.map((row, rowIdx) => (
                <GridRow key={rowIdx}>
                  {row.map((symbol, colIdx) => (
                    <GridCell
                      key={`${rowIdx}-${colIdx}`}
                      isWinning={lastResult.winningLines.length > 0}
                    >
                      {symbol}
                    </GridCell>
                  ))}
                </GridRow>
              ))}
            </GameGrid>
          ) : (
            <EmptyGrid>
              <EmptyText>Click SPIN to see the game grid</EmptyText>
              <GridPreview>
                {Array(6)
                  .fill(0)
                  .map((_, row) => (
                    <GridRow key={row}>
                      {Array(5)
                        .fill(0)
                        .map((_, col) => (
                          <GridCell key={`${row}-${col}`}>?</GridCell>
                        ))}
                    </GridRow>
                  ))}
              </GridPreview>
            </EmptyGrid>
          )}
        </GameSection>

        {/* Results Display */}
        {lastResult && (
          <ResultsSection>
            <ResultsTitle>Last Spin Results</ResultsTitle>
            <ResultsGrid>
              <ResultItem>
                <ResultLabel>Win Amount</ResultLabel>
                <ResultValue isWin={lastResult.winAmount > 0}>
                  {lastResult.winAmount > 0 ? '🎉' : ''} {lastResult.winAmount} Coins
                </ResultValue>
              </ResultItem>
              <ResultItem>
                <ResultLabel>Multiplier</ResultLabel>
                <ResultValue>{lastResult.multiplier}x</ResultValue>
              </ResultItem>
              <ResultItem>
                <ResultLabel>RTP Applied</ResultLabel>
                <ResultValue>{lastResult.rtpApplied.toFixed(2)}%</ResultValue>
              </ResultItem>
              <ResultItem>
                <ResultLabel>Winning Lines</ResultLabel>
                <ResultValue>{lastResult.winningLines.length}</ResultValue>
              </ResultItem>
            </ResultsGrid>
          </ResultsSection>
        )}

        {error && <ErrorBox>{error}</ErrorBox>}

        {/* Theme Info */}
        <ThemeInfoSection>
          <InfoTitle>Theme Information</InfoTitle>
          <InfoGrid>
            <InfoItem>
              <InfoLabel>Min Bet</InfoLabel>
              <InfoValue>${theme.minBet}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Max Bet</InfoLabel>
              <InfoValue>${theme.maxBet}</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Grid Size</InfoLabel>
              <InfoValue>5x6</InfoValue>
            </InfoItem>
            <InfoItem>
              <InfoLabel>Status</InfoLabel>
              <InfoValue>
                <StatusBadge>ACTIVE</StatusBadge>
              </InfoValue>
            </InfoItem>
          </InfoGrid>
        </ThemeInfoSection>

        {/* Spin History */}
        {spinHistory.length > 0 && (
          <HistorySection>
            <HistoryTitle>Recent Spins ({spinHistory.length})</HistoryTitle>
            <HistoryList>
              {spinHistory.map((spin, idx) => (
                <HistoryItem key={idx} isWin={spin.winAmount > 0}>
                  <HistoryIcon>{spin.winAmount > 0 ? '✓' : '-'}</HistoryIcon>
                  <HistoryText>
                    Spin #{spinHistory.length - idx}: <strong>{spin.winAmount} Coins</strong>
                  </HistoryText>
                </HistoryItem>
              ))}
            </HistoryList>
          </HistorySection>
        )}
      </PreviewContent>
    </PreviewContainer>
  );
};

// ============= STYLED COMPONENTS =============

const spin = keyframes`
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
`;

const PreviewContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100%;
  background: linear-gradient(135deg, #1a1a3e 0%, #16213e 100%);
  color: white;
  font-family: 'Roboto', sans-serif;
  overflow-y: auto;
`;

const PreviewHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 2px solid #ffd700;
  gap: 15px;
`;

const PreviewTitle = styled.h2`
  font-size: 1.8rem;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;

  @media (max-width: 768px) {
    font-size: 1.4rem;
  }
`;

const DemoLabel = styled.span`
  background: #ff6b6b;
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
`;

const CloseButton = styled.button`
  background: #ff6b6b;
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  font-size: 1.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: #ff5252;
    transform: scale(1.1);
  }
`;

const PreviewContent = styled.div`
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  overflow-y: auto;

  &::-webkit-scrollbar {
    width: 8px;
  }

  &::-webkit-scrollbar-track {
    background: rgba(255, 215, 0, 0.1);
    border-radius: 10px;
  }

  &::-webkit-scrollbar-thumb {
    background: #ffd700;
    border-radius: 10px;

    &:hover {
      background: #ffed4e;
    }
  }
`;

const ControlsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 20px;
  background: rgba(102, 126, 234, 0.1);
  border: 2px solid #667eea;
  border-radius: 12px;
`;

const BalanceDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  border: 2px solid #ffd700;
`;

const BalanceLabel = styled.span`
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.8);
`;

const BalanceValue = styled.span`
  font-size: 1.5rem;
  font-weight: 700;
  color: #ffd700;
  font-family: 'Courier New', monospace;
`;

const BetControls = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const BetLabel = styled.label`
  font-size: 0.95rem;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
`;

const BetButtonGroup = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
  gap: 8px;
`;

const BetButton = styled.button<{ selected?: boolean }>`
  padding: 10px;
  background: ${(props) => (props.selected ? '#ffd700' : 'rgba(255, 215, 0, 0.2)')};
  color: ${(props) => (props.selected ? '#000' : '#ffd700')};
  border: 2px solid #ffd700;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #ffd700;
    color: #000;
    transform: translateY(-2px);
  }
`;

const CustomBetInput = styled.input`
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border: 2px solid #667eea;
  border-radius: 6px;
  color: white;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #ffd700;
    box-shadow: 0 0 10px rgba(255, 215, 0, 0.3);
  }

  &::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }
`;

const ButtonGroup = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
`;

const SpinButton = styled.button<{ disabled?: boolean; isSpinning?: boolean }>`
  padding: 15px;
  background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);
  color: #000;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: ${(props) => (props.disabled ? 'not-allowed' : 'pointer')};
  transition: all 0.3s ease;
  opacity: ${(props) => (props.disabled ? 0.5 : 1)};
  animation: ${(props) => (props.isSpinning ? spin : 'none')} 0.6s linear;

  &:hover:not(:disabled) {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(255, 215, 0, 0.4);
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }
`;

const ResetButton = styled.button`
  padding: 15px;
  background: rgba(100, 100, 255, 0.3);
  color: #667eea;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #667eea;
    color: white;
    transform: translateY(-2px);
  }
`;

const GameSection = styled.div`
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 2px solid #764ba2;
`;

const GameTitle = styled.h3`
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  color: #ffd700;
`;

const GameGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  background: rgba(0, 0, 0, 0.5);
  padding: 15px;
  border-radius: 8px;
`;

const GridRow = styled.div`
  display: contents;
`;

const GridCell = styled.div<{ isWinning?: boolean }>`
  aspect-ratio: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${(props) => (props.isWinning ? '#ffd700' : 'rgba(102, 126, 234, 0.3)')};
  border: 2px solid ${(props) => (props.isWinning ? '#ffed4e' : '#667eea')};
  border-radius: 6px;
  font-size: 1.5rem;
  font-weight: 700;
  color: ${(props) => (props.isWinning ? '#000' : 'white')};
  transition: all 0.3s ease;

  @media (max-width: 768px) {
    font-size: 1.2rem;
  }
`;

const EmptyGrid = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 20px;
`;

const EmptyText = styled.p`
  color: rgba(255, 255, 255, 0.6);
  font-size: 1rem;
  margin: 0;
`;

const GridPreview = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  width: 100%;
`;

const ResultsSection = styled.div`
  padding: 20px;
  background: rgba(0, 200, 0, 0.1);
  border: 2px solid #00c800;
  border-radius: 12px;
`;

const ResultsTitle = styled.h3`
  margin: 0 0 15px 0;
  font-size: 1.2rem;
  color: #00c800;
`;

const ResultsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 12px;
`;

const ResultItem = styled.div`
  padding: 12px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 6px;
  text-align: center;
`;

const ResultLabel = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 5px;
`;

const ResultValue = styled.div<{ isWin?: boolean }>`
  font-size: 1.3rem;
  font-weight: 700;
  color: ${(props) => (props.isWin ? '#00ff00' : '#ffd700')};
`;

const ErrorBox = styled.div`
  padding: 15px;
  background: rgba(255, 107, 107, 0.2);
  border: 2px solid #ff6b6b;
  border-radius: 8px;
  color: #ff9999;
  text-align: center;
  font-weight: 600;
`;

const ThemeInfoSection = styled.div`
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 2px solid #667eea;
`;

const InfoTitle = styled.h3`
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: #667eea;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
`;

const InfoItem = styled.div`
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  text-align: center;
`;

const InfoLabel = styled.div`
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.6);
  margin-bottom: 5px;
`;

const InfoValue = styled.div`
  font-size: 1.1rem;
  font-weight: 700;
  color: #ffd700;
`;

const StatusBadge = styled.span`
  background: #00c800;
  color: white;
  padding: 4px 10px;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
`;

const HistorySection = styled.div`
  padding: 20px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 12px;
  border: 2px solid #764ba2;
`;

const HistoryTitle = styled.h3`
  margin: 0 0 15px 0;
  font-size: 1.1rem;
  color: #764ba2;
`;

const HistoryList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const HistoryItem = styled.div<{ isWin?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  background: rgba(0, 0, 0, 0.3);
  border-left: 4px solid ${(props) => (props.isWin ? '#00ff00' : '#aaa')};
  border-radius: 4px;
`;

const HistoryIcon = styled.span`
  font-size: 1.2rem;
  font-weight: 700;
`;

const HistoryText = styled.span`
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.9);
`;

export default ThemePreview;
