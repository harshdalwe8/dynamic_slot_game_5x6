import React from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect } from 'react-router-dom';
import SlotMachine from './components/SlotMachine';
import ThemeSelector from './components/ThemeSelector';
import Login from './components/Login';
import Register from './components/Register';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import styled from 'styled-components';

// Protected Route Component
const ProtectedRoute: React.FC<{ component: React.ComponentType<any>; path: string; exact?: boolean }> = ({
  component: Component,
  ...rest
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingScreen>Loading...</LoadingScreen>;
  }

  return (
    <Route
      {...rest}
      render={(props) =>
        isAuthenticated ? <Component /> : <Redirect to="/login" />
      }
    />
  );
};

// Game Page Component
const GamePage: React.FC = () => {
  const { user, logout } = useAuth();

  return (
    <GameContainer>
      <Header>
        <HeaderLeft>
          <Logo>🎰 Slot Game</Logo>
          {user?.isGuest && <GuestBadge>Guest Mode</GuestBadge>}
        </HeaderLeft>
        <HeaderRight>
          <UserInfo>
            <UserEmail>{user?.email}</UserEmail>
            <LogoutButton onClick={logout}>Logout</LogoutButton>
          </UserInfo>
        </HeaderRight>
      </Header>

      <GameContent>
        <SlotMachine />
      </GameContent>
    </GameContainer>
  );
};

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Router>
          <Switch>
            <Route path="/login" exact component={Login} />
            <Route path="/register" exact component={Register} />
            <ProtectedRoute path="/game" component={GamePage} />
            <Route path="/" exact>
              <Redirect to="/login" />
            </Route>
          </Switch>
        </Router>
      </ThemeProvider>
    </AuthProvider>
  );
};

const LoadingScreen = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  font-size: 1.5rem;
  color: #667eea;
`;

const GameContainer = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
`;

const Header = styled.header`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const Logo = styled.h1`
  font-size: 1.8rem;
  color: white;
  margin: 0;
`;

const GuestBadge = styled.span`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  padding: 5px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserEmail = styled.span`
  color: white;
  font-size: 0.95rem;
`;

const LogoutButton = styled.button`
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 8px 20px;
  border-radius: 20px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;

  &:hover {
    background: rgba(255, 255, 255, 0.3);
    transform: translateY(-2px);
  }
`;

const GameContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
  gap: 30px;
`;

export default App;