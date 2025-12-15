import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { spinSlot, getWalletBalance, getActiveThemes, getThemeDetails, Theme } from '../services/playerApi';
import { useLocation, useHistory } from 'react-router-dom';
import styled, { keyframes, css } from 'styled-components';

// ============= KEYFRAME ANIMATIONS =============
const spinAnimation = keyframes`
  0% { transform: translateY(-100%); }
  50% { transform: translateY(-50%); }
  100% { transform: translateY(0); }
`;

const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 15px rgba(88, 210, 255, 0.3); }
  50% { box-shadow: 0 0 30px rgba(88, 210, 255, 0.6); }
`;

const glow = keyframes`
  0%, 100% { box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15); }
  50% { box-shadow: 0 6px 25px rgba(88, 210, 255, 0.3); }
`;

// ============= STYLED COMPONENTS =============
interface GameWrapperProps {
  backgroundUrl?: string;
}

const GameWrapper = styled.div<GameWrapperProps>`
  width: 1200px;
  max-width: 95%;
  margin: 28px auto;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  box-shadow: 0 20px 50px rgba(20, 40, 80, 0.25);
  background: ${props => props.backgroundUrl ? `url(${props.backgroundUrl}) center/cover` : 'linear-gradient(135deg, #e9f6ff 0%, #d4e8f7 100%)'};
  min-height: 640px;
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  display: flex;
  flex-direction: column;
`;

const Header = styled.div`
  width: 100%;
  display: none;
`;

const DisplayBox = styled.div`
  display: none;
`;

const Label = styled.label`
  font-size: 16px;
  color: #ffffff;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ValueBox = styled.div`
  background-color: transparent;
  color: inherit;
`;

const TitleArea = styled.div`
  display: none;
`;

const GameTitle = styled.h1`
  display: none;
`;

const Stars = styled.span`
  display: none;
`;

const MenuBtn = styled.button`
  display: none;
`;

interface MachineContainerProps {
  $rows?: number;
}

const MachineContainer = styled.div<MachineContainerProps>`
  width: 86%;
  margin: 48px auto 20px;
  height: ${props => props.$rows ? `calc(${props.$rows} * 110px + 60px)` : '420px'};
  min-height: 380px;
  max-height: 700px;
  background: linear-gradient(135deg, rgba(100, 200, 255, 0.15) 0%, rgba(150, 100, 255, 0.1) 100%);
  border-radius: 20px;
  border: 12px solid;
  border-image: linear-gradient(135deg, #d946ef 0%, #ec4899 50%, #a855f7 100%) 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 26px;
  backdrop-filter: blur(8px);
  box-shadow: 0 0 40px rgba(217, 70, 239, 0.4), 
              inset 0 0 30px rgba(255, 255, 255, 0.1);
  position: relative;

  &::before {
    content: '';
    position: absolute;
    top: -12px;
    left: 50%;
    transform: translateX(-50%);
    width: 60%;
    height: 30px;
    background: linear-gradient(90deg, #d946ef, #ec4899, #a855f7);
    border-radius: 20px 20px 0 0;
    box-shadow: 0 -5px 20px rgba(217, 70, 239, 0.6);
  }
`;

interface MainPlayAreaProps {
  $cols?: number;
}

const MainPlayArea = styled.div<MainPlayAreaProps>`
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: ${props => props.$cols ? `repeat(${props.$cols}, 1fr)` : 'repeat(5, 1fr)'};
  gap: 16px;
  align-items: center;
  padding: 0 12px;
`;

const SideChips = styled.div`
  display: none;
`;

const Chip = styled.div`
  display: none;
`;

const SlotGridFrame = styled.div`
  display: contents;
`;

const SlotGrid = styled.div<{ $cols: number }>`
  display: contents;
`;

const Reel = styled.div`
  background: linear-gradient(180deg, #e0f4ff 0%, #c8e8ff 50%, #b0dcff 100%);
  border-radius: 12px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.4),
              inset 0 -2px 5px rgba(0, 0, 0, 0.15);
  height: 100%;
  min-height: 300px;
  border: 3px solid;
  border-image: linear-gradient(180deg, #ffffff 0%, #e0f4ff 100%) 1;
  width: 100%;
`;

const ReelHold = styled.div`
  position: absolute;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  background: linear-gradient(135deg, #ec4899 0%, #f472b6 100%);
  color: white;
  padding: 6px 16px;
  border-radius: 20px;
  font-weight: 900;
  font-size: 13px;
  box-shadow: 0 4px 12px rgba(236, 72, 153, 0.5),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
  z-index: 10;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ReelSlots = styled.div`
  margin-top: 52px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
  justify-content: center;
`;

const Symbol = styled.div<{ $winning?: boolean; $spinning?: boolean }>`
  width: 90%;
  height: 100px;
  background: linear-gradient(180deg, #f5fbff 0%, #e8f5ff 50%, #dbe8ff 100%);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 24px;
  color: #333;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.12),
              inset 0 1px 0 rgba(255, 255, 255, 0.5),
              inset 0 -1px 2px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  position: relative;
  transition: transform 0.45s cubic-bezier(0.2, 0.9, 0.2, 1);
  border: 2px solid rgba(255, 255, 255, 0.6);
  
  ${props =>
    props.$spinning &&
    css`
      animation: ${spinAnimation} 0.45s cubic-bezier(0.2, 0.9, 0.2, 1);
      opacity: 0.9;
    `}
  
  ${props =>
    props.$winning &&
    css`
      background: linear-gradient(180deg, #fef08a 0%, #fde047 50%, #facc15 100%);
      box-shadow: 0 0 25px rgba(250, 204, 21, 0.8),
                  inset 0 1px 0 rgba(255, 255, 255, 0.6);
      border: 2px solid #fbbf24;
      animation: ${pulse} 0.6s ease-in-out infinite;
    `}
`;

const SymbolImage = styled.img`
  max-height: 92%;
  max-width: 92%;
  display: block;
  object-fit: contain;
  pointer-events: none;
  user-select: none;
`;

const ControlsContainer = styled.div`
  width: 92%;
  margin: 0 auto 40px;
  display: flex;
  justify-content: space-around;
  align-items: center;
  padding: 20px 24px;
  background: linear-gradient(90deg, 
    rgba(139, 92, 246, 0.15) 0%,
    rgba(168, 85, 247, 0.1) 50%,
    rgba(139, 92, 246, 0.15) 100%);
  border-radius: 16px;
  gap: 24px;
  flex-wrap: wrap;
  border: 2px solid;
  border-image: linear-gradient(90deg, #8b5cf6 0%, #a855f7 50%, #8b5cf6 100%) 1;
  box-shadow: 0 8px 25px rgba(139, 92, 246, 0.2),
              inset 0 1px 0 rgba(255, 255, 255, 0.1);
`;

const ControlBlock = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-direction: column;
`;

const Counter = styled.div`
  display: flex;
  align-items: center;
  background: linear-gradient(135deg, rgba(200, 232, 255, 0.4), rgba(176, 220, 255, 0.3));
  padding: 8px 12px;
  border-radius: 12px;
  gap: 10px;
  border: 2px solid rgba(176, 220, 255, 0.6);
  box-shadow: 0 4px 12px rgba(100, 200, 255, 0.2);
`;

const CounterBtn = styled.button`
  background: linear-gradient(135deg, #58d2ff 0%, #2bb3ff 100%);
  border: none;
  padding: 6px 12px;
  border-radius: 8px;
  color: white;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 10px rgba(43, 179, 255, 0.3);
  font-size: 14px;

  &:hover {
    background: linear-gradient(135deg, #6dd9ff 0%, #3dbfff 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 15px rgba(43, 179, 255, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
`;

interface CounterValueProps {
  assetUrl?: string;
}

interface StatusBoxProps {
  bgAssetUrl?: string;
}

const CounterValue = styled.div<CounterValueProps>`
  min-width: 56px;
  text-align: center;
  font-weight: 800;
  color: #fff;
  ${props =>
    props.assetUrl &&
    css`
      background-image: url(${props.assetUrl});
      background-size: cover;
      background-position: center;
      color: transparent;
    `}
`;

const SpinContainer = styled.div`
  position: relative;
`;

const SpinBtn = styled.button`
  background: linear-gradient(180deg, #06b6d4 0%, #0891b2 100%);
  border-radius: 30px;
  padding: 20px 56px;
  font-size: 24px;
  color: white;
  font-weight: 900;
  box-shadow: 0 12px 35px rgba(6, 182, 212, 0.35),
              inset 0 1px 0 rgba(255, 255, 255, 0.2);
  border: 4px solid rgba(255, 255, 255, 0.25);
  cursor: pointer;
  transition: all 0.3s;
  text-transform: uppercase;
  letter-spacing: 1px;
  position: relative;

  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: 30px;
    padding: 4px;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.1));
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
  }

  &:hover:not(:disabled) {
    animation: ${pulse} 1s ease-in-out infinite;
    transform: translateY(-3px);
    box-shadow: 0 14px 40px rgba(6, 182, 212, 0.45),
                inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(-1px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusBox = styled.div<StatusBoxProps>`
  background: linear-gradient(135deg, rgba(176, 220, 255, 0.5), rgba(200, 232, 255, 0.3));
  padding: 12px 18px;
  border-radius: 12px;
  text-align: center;
  border: 2px solid rgba(176, 220, 255, 0.7);
  box-shadow: 0 4px 15px rgba(100, 200, 255, 0.25),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(4px);
  min-width: 120px;
  ${props =>
    props.bgAssetUrl &&
    css`
      background-image: url(${props.bgAssetUrl});
      background-size: contain;
      background-repeat: no-repeat;
      background-position: center;
      background-color: rgba(176, 220, 255, 0.3);
    `}
`;

const StatusBig = styled.div`
  font-size: 24px;
  color: #ffffff;
  font-weight: 900;
  text-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
`;

const StatusSmall = styled.div`
  font-size: 12px;
  color: #ffffff;
  opacity: 0.95;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
  font-weight: 600;
`;

const SpinBtnSubtext = styled.small`
  font-weight: 700;
  font-size: 12px;
  opacity: 0.95;
`;

const Footer = styled.div`
  display: none;
`;

const FooterLeft = styled.div`
  display: none;
`;

const FooterRight = styled.div`
  display: none;
`;

const HudPanel = styled.div`
  display: none;
`;

const HudLabel = styled.div`
  display: none;
`;

const HudValue = styled.div`
  display: none;
`;

const ActionBtn = styled.button`
  display: none;
`;

const ErrorMessage = styled.div`
  background: #ff4444;
  color: white;
  padding: 15px;
  border-radius: 8px;
  margin: 20px;
  text-align: center;
  font-weight: bold;
  border: 2px solid #ff0000;
`;

const LoadingNotice = styled.div`
  background: rgba(88, 210, 255, 0.1);
  color: #2bb3ff;
  padding: 15px;
  border-radius: 8px;
  margin: 20px;
  text-align: center;
  font-weight: bold;
  border: 2px dashed #58d2ff;
`;

const WinMessage = styled.div`
  background: linear-gradient(180deg, #58d2ff, #2bb3ff);
  color: white;
  padding: 20px;
  border-radius: 12px;
  margin: 20px;
  text-align: center;
  font-weight: 800;
  font-size: 1.5rem;
  animation: ${pulse} 0.6s ease-in-out;
  box-shadow: 0 10px 30px rgba(43, 123, 255, 0.3);
`;

// ============= COMPONENT =============
const SlotMachine: React.FC = () => {
  const location = useLocation();
  const history = useHistory();
  
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [themeDetails, setThemeDetails] = useState<Theme | null>(null);
  const [grid, setGrid] = useState<string[][]>([]);
  const [balance, setBalance] = useState<number>(10000);
  const [betAmount, setBetAmount] = useState<number>(100);
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<number>(0);
  const [winningPositions, setWinningPositions] = useState<Set<string>>(new Set());
  const [showWinMessage, setShowWinMessage] = useState(false);
  const [error, setError] = useState<string>('');
  const [isLoadingTheme, setIsLoadingTheme] = useState(false);
  const [isLoadingWallet, setIsLoadingWallet] = useState(false);
  const [assetManifest, setAssetManifest] = useState<Record<string, any>>({});

  const defaultSymbols = useMemo(
    () => ['💎', '7️⃣', '🍒', '🔔', '⭐', '🍋', '👑', '♠️', '♥️', '♣️', '♦️'],
    []
  );

  const rows = useMemo(() => themeDetails?.jsonSchema?.grid?.rows || 6, [themeDetails]);
  const cols = useMemo(() => themeDetails?.jsonSchema?.grid?.columns || 5, [themeDetails]);

  const symbolSet = useMemo(() => {
    if (themeDetails?.jsonSchema?.symbols?.length) {
      return themeDetails.jsonSchema.symbols.map((s: any) => s.id || s.name || '♦');
    }
    return defaultSymbols;
  }, [themeDetails, defaultSymbols]);

  // Map symbol ID to image URL
  const symbolImageMap = useMemo(() => {
    const map: { [key: string]: string } = {};
    if (themeDetails?.jsonSchema?.symbols) {
      themeDetails.jsonSchema.symbols.forEach((symbol: any) => {
        if (symbol.asset) {
          // Convert "public/theme/themenewfolder/symbols/k.png" to "http://localhost:5000/theme/themenewfolder/symbols/k.png"
          const assetPath = symbol.asset.replace(/^public\//, '');
          map[symbol.id] = `${process.env.REACT_APP_FILE_URL || 'http://localhost:5000'}/${assetPath}`;
        }
      });
    }
    return map;
  }, [themeDetails]);

  const getSymbolDisplay = (symbolId: string) => {
    const imageUrl = symbolImageMap[symbolId];
    if (imageUrl) {
      return <SymbolImage src={imageUrl} alt={symbolId} />;
    }
    return symbolId; // Fallback to text if no image
  };

  const initializeGrid = useCallback(() => {
    const emptyGrid: string[][] = [];
    for (let row = 0; row < rows; row++) {
      const rowData: string[] = [];
      for (let col = 0; col < cols; col++) {
        rowData.push(symbolSet[Math.floor(Math.random() * symbolSet.length)]);
      }
      emptyGrid.push(rowData);
    }
    setGrid(emptyGrid);
  }, [rows, cols, symbolSet]);

  const fetchThemeData = useCallback(async (themeId: string) => {
    try {
      setIsLoadingTheme(true);
      setIsLoadingWallet(true);
      const [themeResponse, walletResponse] = await Promise.all([
        getThemeDetails(themeId),
        getWalletBalance(),
      ]);

      if (themeResponse?.theme) {
        setSelectedTheme(themeResponse.theme);
        setThemeDetails(themeResponse.theme);
        // Extract and store asset manifest
        const manifest = (themeResponse.theme as any).assetManifest || {};
        setAssetManifest(manifest);
      }

      // Handle both response formats: { wallet: { balance } } or { balance }
      const walletBalance = (walletResponse?.wallet?.balance ?? walletResponse?.balance ?? 10000) as number;
      setBalance(walletBalance);
    } catch (err: any) {
      console.error('Failed to load theme details or wallet:', err);
      setError(err.response?.data?.message || 'Failed to load theme or wallet');
      // Set a default balance if wallet fetch fails
      setBalance(10000);
    } finally {
      setIsLoadingTheme(false);
      setIsLoadingWallet(false);
    }
  }, []);

  const loadThemes = useCallback(async () => {
    try {
      setError('');
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
            fetchThemeData(selectedThemeFromUrl.id);
          } else {
            // Theme not found, redirect back to theme selection
            console.warn(`Theme with ID ${themeId} not found, redirecting to theme selection`);
            history.push('/themes');
          }
        } else {
          // No themeId in URL, use first theme as fallback
          setSelectedTheme(data.themes[0]);
          fetchThemeData(data.themes[0].id);
        }
      } else {
        setError('No active themes available');
      }
    } catch (err) {
      console.error('Failed to load themes:', err);
      setError('Failed to load themes');
    }
  }, [location.search, history, fetchThemeData]);

  useEffect(() => {
    initializeGrid();
  }, [initializeGrid]);

  useEffect(() => {
    loadThemes();
  }, [loadThemes]);

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
      const spinResults: string[][] = Array.from({ length: cols }, () => []);
      const spinPromises: Promise<void>[] = [];

      for (let col = 0; col < cols; col++) {
        spinPromises.push(
          new Promise<void>((resolve) => {
            setTimeout(() => {
              const colSymbols: string[] = [];
              for (let row = 0; row < rows; row++) {
                colSymbols.push(
                  symbolSet[Math.floor(Math.random() * symbolSet.length)]
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
      for (let row = 0; row < rows; row++) {
        const rowData: string[] = [];
        for (let col = 0; col < cols; col++) {
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

  // Get background URL from asset manifest
  const backgroundUrl = useMemo(() => {
    if (assetManifest?.bkg?.url) {
      const url = assetManifest.bkg.url;
      // Convert relative URL to absolute if needed
      if (url.startsWith('/')) {
        return `${process.env.REACT_APP_FILE_URL || 'http://localhost:5000'}${url}`;
      }
      return url;
    }
    return undefined;
  }, [assetManifest]);

  return (
    <GameWrapper backgroundUrl={backgroundUrl}>
      {/* Error Message */}
      {(isLoadingTheme || isLoadingWallet) && (
        <LoadingNotice>Loading theme and wallet...</LoadingNotice>
      )}

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {/* Win Message */}
      {showWinMessage && <WinMessage>🎉 WIN: {Math.floor(lastWin || 0).toLocaleString()} 🎉</WinMessage>}

      {/* Machine Container */}
      <MachineContainer $rows={rows}>
        <MainPlayArea $cols={cols}>
          {/* Reels */}
          {Array.from({ length: cols }).map((_, colIdx) => (
            <Reel key={colIdx}>
              <ReelHold>Hold</ReelHold>
              <ReelSlots>
                {grid.map((row, rowIdx) => (
                  <Symbol
                    key={`${rowIdx}-${colIdx}`}
                    $spinning={isSpinning}
                    $winning={winningPositions.has(`${rowIdx}-${colIdx}`)}
                  >
                    {getSymbolDisplay(row[colIdx])}
                  </Symbol>
                ))}
              </ReelSlots>
            </Reel>
          ))}
        </MainPlayArea>
      </MachineContainer>

      {/* Footer Controls */}
      <ControlsContainer>
        <ControlBlock>
          <Label>Lines</Label>
          <Counter>
            <CounterBtn>-</CounterBtn>
            <CounterValue>{assetManifest?.lines_label?.url ? `url(${assetManifest.lines_label.url})` : ''}</CounterValue>
            <CounterBtn>+</CounterBtn>
          </Counter>
        </ControlBlock>

        <ControlBlock>
          <Label>Total Bet</Label>
          <Counter>
            <CounterBtn onClick={() => setBetAmount(Math.max(1, betAmount - 10))}>-</CounterBtn>
            <CounterValue>{betAmount}</CounterValue>
            <CounterBtn onClick={() => setBetAmount(betAmount + 10)}>+</CounterBtn>
          </Counter>
        </ControlBlock>

        <SpinContainer>
          <SpinBtn onClick={handleSpin} disabled={isSpinning || isLoadingTheme || isLoadingWallet}>
            Spin
            <br />
            <SpinBtnSubtext>Hold for AutoSpin</SpinBtnSubtext>
          </SpinBtn>
        </SpinContainer>

        <ControlBlock>
          <Label>Balance</Label>
          <StatusBox bgAssetUrl={assetManifest?.balance?.url ? `${process.env.REACT_APP_FILE_URL || 'http://localhost:5000'}${assetManifest.balance.url}` : undefined}>
            <StatusBig>{Math.floor(balance || 0).toLocaleString()}</StatusBig>
            <StatusSmall>Coins</StatusSmall>
          </StatusBox>
        </ControlBlock>

        <ControlBlock>
          <Label>Your Win</Label>
          <StatusBox bgAssetUrl={assetManifest?.your_win?.url ? `${process.env.REACT_APP_FILE_URL || 'http://localhost:5000'}${assetManifest.your_win.url}` : undefined}>
            <StatusBig>{Math.floor(lastWin || 0).toLocaleString()}</StatusBig>
            <StatusSmall>Last Win</StatusSmall>
          </StatusBox>
        </ControlBlock>
      </ControlsContainer>
    </GameWrapper>
  );
};

export default SlotMachine;
