import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActiveThemes, Theme } from '../services/playerApi';
import styled from 'styled-components';
import PreviewModal from './PreviewModal';
import ThemePreview from './ThemePreview';

const ThemeSelection: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
  const [previewTheme, setPreviewTheme] = useState<Theme | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const { user, logout } = useAuth();
  const history = useHistory();

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    try {
      setLoading(true);
      const response = await getActiveThemes();
      setThemes(response.themes || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load themes');
      console.error('Error loading themes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTheme = (themeId: string) => {
    setSelectedThemeId(themeId);
    // Navigate to game with theme ID in query params
    history.push(`/game?themeId=${themeId}`);
  };

  const handlePreviewTheme = (theme: Theme) => {
    setPreviewTheme(theme);
    setShowPreview(true);
  };

  const handleClosePreview = () => {
    setShowPreview(false);
    setPreviewTheme(null);
  };

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <Container>
      <TopBar>
        <TopLeft>
          <Brand>SUPER Slot</Brand>
          <UserPill>{user?.displayName || user?.email}</UserPill>
        </TopLeft>
        <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
      </TopBar>

      <SectionHeader>
        <SectionTitle>Hot Games</SectionTitle>
        <Subtitle>Pick a theme and start</Subtitle>
      </SectionHeader>

      {error && <ErrorMessage>{error}</ErrorMessage>}
      {loading ? (
        <LoadingMessage>Loading themes...</LoadingMessage>
      ) : themes.length === 0 ? (
        <NoThemesMessage>No themes available right now.</NoThemesMessage>
      ) : (
        <CardGrid>
          {themes.map((theme) => (
            <GameCard key={theme.id} onClick={() => handleSelectTheme(theme.id)}>
              <Thumb>
                <span role="img" aria-label="game">🎮</span>
              </Thumb>
              <GameTitle>{theme.name}</GameTitle>
              <MetaRow>
                <MetaPill>Min {theme.minBet}</MetaPill>
                <MetaPill>Max {theme.maxBet}</MetaPill>
              </MetaRow>
              <PlayRow>
                <PlayButton>Play</PlayButton>
                <PreviewButton onClick={(e) => { e.stopPropagation(); handlePreviewTheme(theme); }}>Preview</PreviewButton>
              </PlayRow>
            </GameCard>
          ))}
        </CardGrid>
      )}

      <PreviewModal isOpen={showPreview} onClose={handleClosePreview}>
        {previewTheme && <ThemePreview theme={previewTheme} onClose={handleClosePreview} />}
      </PreviewModal>

      <BottomNav>
        <NavItem onClick={() => history.push('/themes')} $active>
          <span>🏠</span>
          <small>Home</small>
        </NavItem>
        <NavItem onClick={() => history.push('/deposit')}>
          <span>💳</span>
          <small>Deposit</small>
        </NavItem>
        <NavItem onClick={() => history.push('/refer')}>
          <span>🤝</span>
          <small>Refer</small>
        </NavItem>
        <NavItem onClick={() => history.push('/wallet')}>
          <span>💰</span>
          <small>Wallet</small>
        </NavItem>
        <NavItem onClick={() => history.push('/profile')}>
          <span>👤</span>
          <small>Profile</small>
        </NavItem>
      </BottomNav>
    </Container>
  );
};

// ============= STYLED COMPONENTS =============

const Container = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #1f2d50, #0e1425 60%);
  padding: 16px 16px 86px;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 14px;
`;

const TopLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Brand = styled.div`
  color: #ffda79;
  font-weight: 800;
  font-size: 1.2rem;
  text-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
`;

const UserPill = styled.div`
  padding: 6px 12px;
  background: linear-gradient(120deg, #243b55, #141e30);
  border-radius: 18px;
  color: #f3f7ff;
  font-weight: 700;
  border: 1px solid rgba(255, 255, 255, 0.08);
  max-width: 180px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SectionHeader = styled.div`
  padding: 0 4px;
  margin-bottom: 10px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 40px;
  padding: 20px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 15px;
  backdrop-filter: blur(10px);

  @media (max-width: 768px) {
    flex-direction: column;
    gap: 15px;
    text-align: center;
  }
`;

const LogoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Logo = styled.h1`
  font-size: 2.5rem;
  margin: 0;
  color: white;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
`;

const Greeting = styled.p`
  margin: 0;
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
`;

const LogoutButton = styled.button`
  padding: 10px 20px;
  background-color: #ff6b6b;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background-color: #ff5252;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(255, 107, 107, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 0.9rem;
  }
`;

const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
`;

const SectionTitle = styled.h2`
  font-size: 1.3rem;
  color: #fdfdfd;
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: 0.95rem;
  color: #9fb3ff;
  margin: 4px 0 0;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 107, 107, 0.1);
  color: #ff9b9b;
  padding: 12px;
  border-radius: 10px;
  margin: 8px 0 14px;
  text-align: center;
  border: 1px solid rgba(255, 107, 107, 0.3);
`;

const LoadingMessage = styled.div`
  font-size: 1.05rem;
  color: #cdd6ff;
  text-align: center;
  padding: 20px;
`;

const NoThemesMessage = styled.div`
  font-size: 1.05rem;
  color: #cdd6ff;
  text-align: center;
  padding: 20px;
`;

const CardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
`;

const GameCard = styled.div`
  background: linear-gradient(145deg, #1f2850, #141a33);
  border-radius: 14px;
  padding: 10px;
  color: #e8edff;
  box-shadow: 0 8px 18px rgba(0, 0, 0, 0.25);
  border: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Thumb = styled.div`
  background: linear-gradient(120deg, #ff9f1c, #ff3c83);
  height: 120px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  color: white;
  box-shadow: inset 0 0 0 2px rgba(255, 255, 255, 0.15);
`;

const GameTitle = styled.div`
  font-weight: 800;
  font-size: 1rem;
  color: #fdfdfd;
`;

const MetaRow = styled.div`
  display: flex;
  gap: 6px;
`;

const MetaPill = styled.span`
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 10px;
  padding: 4px 8px;
  font-size: 0.75rem;
  color: #cdd6ff;
`;

const PlayRow = styled.div`
  display: flex;
  gap: 8px;
`;

const PlayButton = styled.button`
  flex: 1;
  padding: 8px 10px;
  background: linear-gradient(135deg, #ffb347, #ff6b6b);
  color: #1b1b1b;
  border: none;
  border-radius: 10px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
`;

const PreviewButton = styled.button`
  flex: 1;
  padding: 8px 10px;
  background: rgba(255, 255, 255, 0.12);
  color: #e8edff;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
`;

const BottomNav = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  height: 66px;
  background: #0b1020;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  align-items: center;
  padding: 6px 12px;
`;

const NavItem = styled.div<{ $active?: boolean }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
  color: ${(p) => (p.$active ? '#ffda79' : '#e8edff')};
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
`;

export default ThemeSelection;
