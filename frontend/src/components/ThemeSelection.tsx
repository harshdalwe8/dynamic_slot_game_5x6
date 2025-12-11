import React, { useState, useEffect } from 'react';
import { useHistory } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getActiveThemes, Theme } from '../services/playerApi';
import styled from 'styled-components';

const ThemeSelection: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedThemeId, setSelectedThemeId] = useState<string | null>(null);
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

  const handleLogout = () => {
    logout();
    history.push('/login');
  };

  return (
    <Container>
      <Header>
        <LogoSection>
          <Logo>🎰 Slot Game</Logo>
          <Greeting>Welcome, {user?.displayName || user?.email}!</Greeting>
        </LogoSection>
        <LogoutButton onClick={handleLogout}>Logout</LogoutButton>
      </Header>

      <Content>
        <SectionTitle>Select a Theme</SectionTitle>
        <Subtitle>Choose your favorite theme and start playing!</Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        {loading ? (
          <LoadingMessage>Loading themes...</LoadingMessage>
        ) : themes.length === 0 ? (
          <NoThemesMessage>No themes available at the moment.</NoThemesMessage>
        ) : (
          <ThemesGrid>
            {themes.map((theme) => (
              <ThemeCard
                key={theme.id}
                onClick={() => handleSelectTheme(theme.id)}
                selected={selectedThemeId === theme.id}
              >
                <ThemeIcon>🎮</ThemeIcon>
                <ThemeName>{theme.name}</ThemeName>
                <ThemeInfo>
                  <InfoItem>Min Bet: ${theme.minBet}</InfoItem>
                  <InfoItem>Max Bet: ${theme.maxBet}</InfoItem>
                </ThemeInfo>
                <SelectButton>Select Theme</SelectButton>
              </ThemeCard>
            ))}
          </ThemesGrid>
        )}
      </Content>
    </Container>
  );
};

// ============= STYLED COMPONENTS =============

const Container = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
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
  font-size: 2.5rem;
  color: white;
  margin: 0;
  text-align: center;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);

  @media (max-width: 768px) {
    font-size: 2rem;
  }
`;

const Subtitle = styled.p`
  font-size: 1.2rem;
  color: rgba(255, 255, 255, 0.9);
  margin: 0;
  text-align: center;

  @media (max-width: 768px) {
    font-size: 1rem;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ff6b6b;
  color: white;
  padding: 15px;
  border-radius: 10px;
  margin: 20px 0;
  text-align: center;
  font-weight: 600;
  max-width: 500px;
`;

const LoadingMessage = styled.div`
  font-size: 1.5rem;
  color: white;
  text-align: center;
  padding: 40px;
`;

const NoThemesMessage = styled.div`
  font-size: 1.5rem;
  color: rgba(255, 255, 255, 0.9);
  text-align: center;
  padding: 40px;
`;

const ThemesGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 25px;
  width: 100%;
  max-width: 1200px;
  padding: 20px;

  @media (max-width: 1024px) {
    grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
    gap: 20px;
  }

  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 15px;
    padding: 10px;
  }

  @media (max-width: 480px) {
    grid-template-columns: 1fr;
    gap: 10px;
    padding: 5px;
  }
`;

const ThemeCard = styled.div<{ selected?: boolean }>`
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(240, 240, 240, 0.95) 100%);
  border: 3px solid ${(props) => (props.selected ? '#ffd700' : '#ddd')};
  border-radius: 15px;
  padding: 25px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
  box-shadow: ${(props) =>
    props.selected
      ? '0 8px 25px rgba(255, 215, 0, 0.4), 0 0 20px rgba(255, 215, 0, 0.3)'
      : '0 4px 15px rgba(0, 0, 0, 0.1)'};

  &:hover {
    transform: translateY(-8px);
    border-color: #ffd700;
    box-shadow: 0 10px 30px rgba(255, 215, 0, 0.3), 0 0 20px rgba(255, 215, 0, 0.2);
  }

  &:active {
    transform: translateY(-4px);
  }

  @media (max-width: 480px) {
    padding: 20px;
  }
`;

const ThemeIcon = styled.div`
  font-size: 3.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 80px;
  width: 80px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 10px;
  color: white;

  @media (max-width: 480px) {
    font-size: 2.5rem;
    height: 60px;
    width: 60px;
  }
`;

const ThemeName = styled.h3`
  font-size: 1.3rem;
  margin: 0;
  color: #333;
  text-align: center;
  font-weight: 700;

  @media (max-width: 480px) {
    font-size: 1.1rem;
  }
`;

const ThemeInfo = styled.div`
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: center;
  width: 100%;
`;

const InfoItem = styled.span`
  background: #f0f0f0;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.9rem;
  color: #555;
  font-weight: 600;

  @media (max-width: 480px) {
    font-size: 0.85rem;
    padding: 4px 10px;
  }
`;

const SelectButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  width: 100%;

  &:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: scale(0.98);
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
    padding: 8px 16px;
  }
`;

export default ThemeSelection;
