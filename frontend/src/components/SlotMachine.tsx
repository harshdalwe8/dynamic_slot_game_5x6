import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { spinSlot, getWalletBalance, getActiveThemes, Theme } from '../services/playerApi';
import { useLocation, useHistory } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';

// ============= KEYFRAME ANIMATIONS =============
const spinAnimation = keyframes`
  0% { filter: blur(0px); }
  50% { filter: blur(4px); }
  100% { filter: blur(0px); }
`;

const pop = keyframes`
  from { transform: scale(0.95); }
  to { transform: scale(1.05); }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 10px rgba(255, 215, 0, 0.5); }
  50% { box-shadow: 0 0 20px rgba(255, 215, 0, 1); }
`;

// ============= STYLED COMPONENTS =============
const GameWrapper = styled.div`
  /* Ensure the game occupies the full viewport and prevents body scrolling */
  width: 80%;
  height: 85vh;
  max-width: 80vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 8px;
  position: relative;
  background-color: #0a0a2a;
  background-image: radial-gradient(circle at 50% 50%, #2b2b60 0%, #050510 100%);
  overflow: hidden; /* prevent page scroll */
  box-sizing: border-box;
  font-family: 'Roboto', 'Titan One', sans-serif;
  --header-h: 67px; /* approximate header height */
  --footer-h: 88px; /* approximate footer height */
`;

const Header = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  padding: 0 5px;
  z-index: 2;
  gap: 10px;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    flex-wrap: wrap;
    justify-content: center;
    gap: 5px;
  }
`;

const DisplayBox = styled.div`
  background: linear-gradient(to bottom, #4d4dff, #000099);
  border: 2px solid #ffd700;
  border-radius: 8px;
  min-width: 90px;
  text-align: center;
  padding: 4px;
  box-shadow: 0 4px 5px rgba(0, 0, 0, 0.5);
`;

const Label = styled.div`
  color: #ffcc00;
  font-size: 0.7rem;
  font-weight: 900;
  text-transform: uppercase;
`;

const ValueBox = styled.div`
  background-color: black;
  color: #00ff00;
  font-family: 'Titan One', cursive;
  font-size: 1rem;
  border-radius: 4px;
  padding: 2px 5px;
  border: 1px solid #333;
  font-weight: bold;
`;

const TitleArea = styled.div`
  text-align: center;
  flex-grow: 1;
  white-space: nowrap;

  @media (max-width: 480px) {
    width: 100%;
    order: -1;
    margin-bottom: 5px;
  }
`;

const GameTitle = styled.h1`
  font-family: 'Titan One', cursive;
  font-size: 2.2rem;
  color: #ffcc00;
  text-shadow: 0 0 5px #000, 3px 3px 0 #003366;
  margin: 0 10px;
  letter-spacing: 2px;

  @media (max-width: 480px) {
    font-size: 1.5rem;
  }
`;

const Stars = styled.span`
  color: #aaaaff;
  font-size: 1rem;
  text-shadow: 0 0 5px white;
  display: inline-block;
  margin: 0 5px;

  @media (max-width: 480px) {
    display: none;
  }
`;

const MenuBtn = styled.button`
  background: linear-gradient(to bottom, #4d4dff, #000099);
  border: 2px solid #ffd700;
  border-radius: 8px;
  padding: 8px 15px;
  color: #ffff00;
  font-weight: 900;
  cursor: pointer;
  font-size: 0.8rem;
  box-shadow: 0 4px 5px rgba(0, 0, 0, 0.5);
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 8px rgba(0, 0, 0, 0.5);
  }

  &:active {
    transform: translateY(0);
  }
`;

const MainPlayArea = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex: 1 1 auto;
  gap: 10px;
  /* Fit the available space between header and footer */
  max-height: calc(100vh - var(--header-h) - var(--footer-h) - 24px);
  height: calc(100vh - var(--header-h) - var(--footer-h) - 24px);

  @media (max-width: 480px) {
    max-height: calc(100vh - var(--header-h) - var(--footer-h) - 12px);
  }

  @media (max-height: 500px) {
    max-height: calc(100vh - var(--header-h) - 60px);
  }
`;

const SideChips = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  height: 100%;
  padding: 10px 0;

  @media (max-width: 768px) {
    transform: scale(0.8);
  }

  @media (max-width: 480px) {
    display: none;
  }
`;

const Chip = styled.div`
  width: 28px;
  height: 28px;
  background: radial-gradient(circle, #ddd 10%, #111 90%);
  border: 2px dashed white;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 0.7rem;
  font-weight: bold;
  color: #ffd700;
  box-shadow: 0 2px 5px black;
`;

const SlotGridFrame = styled.div`
  border: 2px solid #5555aa;
  border-radius: 10px;
  padding: 5px;
  background: rgba(0, 0, 0, 0.3);
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.8);
  width: 100%;
  max-width: min(720px, 92vw);
  display: flex;
  align-items: center;
  justify-content: center;
  /* ensure grid never exceeds the available height */
  max-height: calc(100vh - var(--header-h) - var(--footer-h) - 40px);
  height: 100%;
  box-sizing: border-box;
`;

const SlotGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 4px;
  background-color: #000;
  padding: 4px;
  border-radius: 6px;
  width: 100%;
  height: 100%;
  grid-auto-rows: 1fr; /* ensure rows share available space evenly */
  box-sizing: border-box;
  overflow: hidden; /* prevent inner scroll */
`;

const Symbol = styled.div<{ $winning?: boolean; $spinning?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, #222, #000);
  border: 1px solid #333;
  border-radius: 4px;
  font-size: clamp(1rem, 3.2vw, 2rem);
  position: relative;
  overflow: hidden;
  font-weight: bold;
  transition: transform 0.12s ease, box-shadow 0.12s ease;
  ${props =>
    props.$spinning &&
    css`
      animation: ${spinAnimation} 0.08s linear infinite;
      opacity: 0.85;
      filter: blur(3px);
    `}
  ${props =>
    props.$winning &&
    css`
      background: linear-gradient(45deg, #552222, #330000);
      box-shadow: 0 0 18px rgba(255, 215, 0, 0.9), inset 0 0 8px rgba(255,0,0,0.6);
      border: 2px solid #ffd700;
      animation: ${pop} 0.4s ease-in-out infinite alternate;
      transform-origin: center;
    `}
`;

const Footer = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background: transparent;
  flex-wrap: wrap;

  @media (max-width: 480px) {
    gap: 5px;
    padding-bottom: 15px;
  }

  @media (max-height: 500px) {
    padding: 2px;
  }
`;

const FooterLeft = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 480px) {
    order: 1;
    gap: 5px;
  }
`;

const FooterRight = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;

  @media (max-width: 480px) {
    order: 3;
    display: none;
  }
`;

const HudPanel = styled.div`
  background: linear-gradient(to bottom, #4d4dff, #000066);
  border: 2px solid #ffd700;
  border-radius: 8px;
  width: 70px;
  height: 50px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 2px 4px;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.5);
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    box-shadow: 0 0 15px rgba(255, 215, 0, 0.5);
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 45px;
  }

  @media (max-width: 480px) {
    width: 55px;
    height: 45px;
  }

  @media (max-height: 500px) {
    height: 40px;
  }
`;

const HudLabel = styled.div`
  font-size: 0.6rem;
  color: #ffff00;
  font-weight: bold;
  text-align: center;
  text-transform: uppercase;
`;

const HudValue = styled.div`
  background: black;
  height: 22px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #00ff00;
  font-family: monospace;
  font-size: 0.9rem;
  font-weight: bold;
  border: 1px solid #333;

  @media (max-width: 480px) {
    font-size: 0.8rem;
  }
`;

const SpinContainer = styled.div`
  position: relative;

  @media (max-width: 480px) {
    order: 2;
    margin: 0 10px;
  }
`;

const SpinBtn = styled.button`
  width: 90px;
  height: 90px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, #4d4dff, #000080);
  border: 4px solid #ffd700;
  color: #ffff00;
  font-family: 'Titan One', cursive;
  font-size: 1.6rem;
  cursor: pointer;
  box-shadow: 0 0 15px rgba(0, 0, 0, 0.6), inset 0 0 10px rgba(255, 255, 255, 0.2);
  transition: transform 0.1s;
  text-shadow: 1px 1px 0 #000;
  z-index: 10;
  font-weight: bold;

  &:hover:not(:disabled) {
    animation: ${pulse} 1s ease-in-out infinite;
  }

  &:active:not(:disabled) {
    transform: scale(0.95);
  }

  &:disabled {
    filter: grayscale(0.8);
    cursor: not-allowed;
    opacity: 0.6;
  }

  @media (max-width: 768px) {
    width: 80px;
    height: 80px;
    font-size: 1.4rem;
  }

  @media (max-width: 480px) {
    width: 75px;
    height: 75px;
    font-size: 1.2rem;
  }

  @media (max-height: 500px) {
    width: 60px;
    height: 60px;
    font-size: 1rem;
    border-width: 2px;
  }
`;

const ActionBtn = styled.button`
  background: linear-gradient(to bottom, #4d4dff, #000099);
  border: 2px solid #ffd700;
  border-radius: 6px;
  color: #ffff00;
  font-weight: 800;
  font-size: 0.7rem;
  width: 60px;
  height: 50px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  box-shadow: 0 3px 4px rgba(0, 0, 0, 0.5);
  line-height: 1.1;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 5px 8px rgba(0, 0, 0, 0.5);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    width: 60px;
    height: 45px;
  }
`;

const ErrorMessage = styled.div`
  background: #cc0000;
  color: #ffff00;
  padding: 10px 15px;
  border-radius: 6px;
  margin-bottom: 10px;
  border: 2px solid #ff0000;
  text-align: center;
  font-weight: bold;
`;

const WinMessage = styled.div`
  background: linear-gradient(to bottom, #00cc00, #006600);
  color: #ffff00;
  padding: 15px;
  border-radius: 10px;
  margin-bottom: 10px;
  border: 3px solid #00ff00;
  text-align: center;
  font-family: 'Titan One', cursive;
  font-size: 1.3rem;
  text-shadow: 0 0 5px #000;
  animation: ${pulse} 0.6s ease-in-out;
`;

// ============= COMPONENT =============
const SlotMachine: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [grid, setGrid] = useState<string[][]>([]);
  const [balance, setBalance] = useState<number>(10000);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number>(0);
  const [winningPositions, setWinningPositions] = useState<Set<string>>(new Set());
  const [showWinMessage, setShowWinMessage] = useState(false);
  const [error, setError] = useState<string>('');

  const defaultSymbols = useMemo(
    () => ['💎', '7️⃣', '🍒', '🔔', '⭐', '🍋', '👑', '♠️', '♥️', '♣️', '♦️'],
    []
  );

  const initializeGrid = useCallback(() => {
    const emptyGrid: string[][] = [];
    for (let row = 0; row < 6; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < 5; col++) {
        rowData.push(defaultSymbols[Math.floor(Math.random() * defaultSymbols.length)]);
      }
      emptyGrid.push(rowData);
    }
    setGrid(emptyGrid);
  }, [defaultSymbols]);

  const loadThemes = useCallback(async () => {
    try {
      const data = await getActiveThemes();
      if (data.themes && data.themes.length > 0) {
        setThemes(data.themes);
        
        // Extract themeId from URL query parameters
        const params = new URLSearchParams(location.search);
        const themeId = params.get('themeId');
        
        if (themeId) {
          // Find theme matching the URL parameter
          const selectedThemeFromUrl = data.themes.find(t => t.id === themeId);
          if (selectedThemeFromUrl) {
            setSelectedTheme(selectedThemeFromUrl);
          } else {
            // Theme not found, redirect back to theme selection
            console.warn(`Theme with ID ${themeId} not found, redirecting to theme selection`);
            history.push('/themes');
          }
        } else {
          // No themeId in URL, use first theme as fallback
          setSelectedTheme(data.themes[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load themes:', err);
    }
  }, [location.search, history]);

  const fetchBalance = useCallback(async () => {
    try {
      const response = await getWalletBalance();
      setBalance(response.balance || 10000); 
    } catch (err) {
      console.error('Failed to fetch balance:', err);
    }
  }, []);

  useEffect(() => {
    initializeGrid();
    fetchBalance();
    loadThemes();
  }, [initializeGrid, fetchBalance, loadThemes]);

  const handleSpin = async () => {
    if (isSpinning) return;
    if (betAmount > balance) {
      setError('Insufficient balance!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    if (betAmount < 1) {
      setError('Minimum bet is 1 coin');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setError('');
    setIsSpinning(true);
    setWinningPositions(new Set());
    setShowWinMessage(false);
    setLastWin(0);

    try {
      const themeId = selectedTheme?.id || themes[0]?.id;
      if (!themeId) {
        throw new Error('No theme selected');
      }

      // Simulate spinning with staggered delays
      const spinResults: string[][] = [[], [], [], [], []];
      const spinPromises = [];

      for (let col = 0; col < 5; col++) {
        spinPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              const colSymbols = [];
              for (let row = 0; row < 6; row++) {
                colSymbols.push(
                  defaultSymbols[Math.floor(Math.random() * defaultSymbols.length)]
                );
              }
              spinResults[col] = colSymbols;
              resolve();
            }, 1000 + col * 200);
          })
        );
      }

      await Promise.all(spinPromises);

      // Transpose to row-major format
      const result: string[][] = [];
      for (let row = 0; row < 6; row++) {
        const rowData: string[] = [];
        for (let col = 0; col < 5; col++) {
          rowData.push(spinResults[col][row]);
        }
        result.push(rowData);
      }

      setGrid(result);

      // Call backend API
      const spinResult = await spinSlot(themeId, betAmount);

      // Update balance
      setBalance(spinResult.balance);

      // Check for wins
      if (spinResult.winAmount > 0) {
        setLastWin(spinResult.winAmount);
        setShowWinMessage(true);
        setTimeout(() => setShowWinMessage(false), 3000);

        // Highlight winning positions
        if (spinResult.winningLines && spinResult.winningLines.length > 0) {
          const positions = new Set<string>();
          spinResult.winningLines.forEach((line: any) => {
            if (line.positions) {
              line.positions.forEach((pos: any) => {
                positions.add(`${pos.row}-${pos.col}`);
              });
            }
          });
          setWinningPositions(positions);
        }
      }
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.response?.data?.message || 'Spin failed. Please try again.';
      setError(errorMsg);
      console.error('Spin error:', err);
    } finally {
      setIsSpinning(false);
    }
  };

  const handleBetChange = () => {
    if (isSpinning) return;
    setBetAmount((prev) => (prev >= 500 ? 10 : prev + 10));
  };

  const handleMaxBet = () => {
    if (isSpinning) return;
    setBetAmount(500);
  };

  return (
    <GameWrapper>
      {/* Header */}
      <Header>
        <DisplayBox>
          <Label>Balance</Label>
          <ValueBox>{Math.floor(balance || 0).toLocaleString()}</ValueBox>
        </DisplayBox>

        <TitleArea>
          <Stars>★★★</Stars>
          <GameTitle>SLOTS</GameTitle>
          <Stars>★★★</Stars>
        </TitleArea>

        <MenuBtn>MENU</MenuBtn>
      </Header>

      {/* Error Message */}
      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Win Message */}
      {showWinMessage && <WinMessage>🎉 WIN: {Math.floor(lastWin || 0).toLocaleString()} 🎉</WinMessage>}

      {/* Main Grid Area */}
      <MainPlayArea>
        <SideChips>
          <Chip>4</Chip>
          <Chip>2</Chip>
          <Chip>8</Chip>
          <Chip>6</Chip>
          <Chip>1</Chip>
        </SideChips>

        <SlotGridFrame>
          <SlotGrid>
            {grid.map((row, rowIdx) =>
              row.map((symbol, colIdx) => (
                <Symbol
                  key={`${rowIdx}-${colIdx}`}
                  $spinning={isSpinning}
                  $winning={winningPositions.has(`${rowIdx}-${colIdx}`)}
                >
                  {symbol}
                </Symbol>
              ))
            )}
          </SlotGrid>
        </SlotGridFrame>

        <SideChips>
          <Chip>1</Chip>
          <Chip>6</Chip>
          <Chip>9</Chip>
          <Chip>2</Chip>
          <Chip>4</Chip>
        </SideChips>
      </MainPlayArea>

      {/* Footer Controls */}
      <Footer>
        <FooterLeft>
          <HudPanel>
            <HudLabel>Lines</HudLabel>
            <HudValue>15</HudValue>
          </HudPanel>
          <HudPanel onClick={handleBetChange} style={{ cursor: 'pointer' }}>
            <HudLabel>Bet</HudLabel>
            <HudValue>{betAmount}</HudValue>
          </HudPanel>
          <HudPanel>
            <HudLabel>Win</HudLabel>
            <HudValue>{Math.floor(lastWin || 0).toLocaleString()}</HudValue>
          </HudPanel>
        </FooterLeft>

        <SpinContainer>
          <SpinBtn onClick={handleSpin} disabled={isSpinning}>
            SPIN
          </SpinBtn>
        </SpinContainer>

        <FooterRight>
          <ActionBtn onClick={handleMaxBet} disabled={isSpinning}>
            MAX
            <br />
            BET
          </ActionBtn>
          <ActionBtn disabled={isSpinning}>
            AUTO
            <br />
            SPIN
          </ActionBtn>
        </FooterRight>
      </Footer>
    </GameWrapper>
  );
};

export default SlotMachine;
