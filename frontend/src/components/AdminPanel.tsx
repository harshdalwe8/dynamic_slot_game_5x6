import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import ThemeCRUD from './ThemeCRUD';
import UserManagement from './UserManagement';
import ReportsAnalytics from './ReportsAnalytics';
import SettingsPage from './SettingsPage';

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const AdminPanel: React.FC<{ page: 'dashboard' | 'themes' | 'users' | 'reports' | 'settings' }> = ({ page }) => {
  const { user, logout } = useAuth();
  const history = useHistory();

  const menuItems: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/admin/dashboard' },
    { id: 'themes', label: 'Theme Management', icon: '🎨', path: '/admin/themes' },
    { id: 'users', label: 'User Management', icon: '👥', path: '/admin/users' },
    { id: 'reports', label: 'Reports & Analytics', icon: '📈', path: '/admin/reports' },
    { id: 'settings', label: 'Settings', icon: '⚙️', path: '/admin/settings' },
  ];

  const handleMenuClick = (item: MenuItem) => {
    history.push(item.path);
  };

  const handleLogout = () => {
    logout();
    history.push('/admin/login');
  };

  const renderContent = () => {
    switch (page) {
      case 'themes':
        return <ThemeCRUD />;
      case 'users':
        return <UserManagement />;
      case 'reports':
        return <ReportsAnalytics />;
      case 'settings':
        return <SettingsPage />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <Container>
      <Sidebar>
        <Logo>
          <LogoIcon>🎰</LogoIcon>
          <LogoText>Admin Panel</LogoText>
        </Logo>

        <Menu>
          {menuItems.map((item) => (
            <MenuItemStyled
              key={item.id}
              $active={page === item.id}
              onClick={() => handleMenuClick(item)}
            >
              <MenuIcon>{item.icon}</MenuIcon>
              <MenuLabel>{item.label}</MenuLabel>
            </MenuItemStyled>
          ))}
        </Menu>

        <UserSection>
          <UserInfo>
            <UserAvatar>{user?.email?.charAt(0).toUpperCase()}</UserAvatar>
            <UserDetails>
              <UserName>{user?.displayName || user?.email}</UserName>
              <UserRole>{user?.role}</UserRole>
            </UserDetails>
          </UserInfo>
          <LogoutButton onClick={handleLogout}>
            <span>🚪</span> Logout
          </LogoutButton>
        </UserSection>
      </Sidebar>

      <MainContent>
        <Header>
          <HeaderTitle>
            {menuItems.find((m) => m.id === page)?.label || 'Dashboard'}
          </HeaderTitle>
          <HeaderActions>
            <ActionButton>
              <span>🔔</span>
              <Badge>3</Badge>
            </ActionButton>
          </HeaderActions>
        </Header>

        <Content>{renderContent()}</Content>
      </MainContent>
    </Container>
  );
};

const DashboardContent = () => (
  <>
    <StatsGrid>
      <StatCard>
        <StatIcon style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          👥
        </StatIcon>
        <StatInfo>
          <StatLabel>Total Users</StatLabel>
          <StatValue>1,234</StatValue>
          <StatChange positive>+12% from last month</StatChange>
        </StatInfo>
      </StatCard>

      <StatCard>
        <StatIcon style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
          🎰
        </StatIcon>
        <StatInfo>
          <StatLabel>Total Spins</StatLabel>
          <StatValue>45,678</StatValue>
          <StatChange positive>+8% from last month</StatChange>
        </StatInfo>
      </StatCard>

      <StatCard>
        <StatIcon style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' }}>
          💰
        </StatIcon>
        <StatInfo>
          <StatLabel>Total Wagered</StatLabel>
          <StatValue>$128,450</StatValue>
          <StatChange>-2% from last month</StatChange>
        </StatInfo>
      </StatCard>

      <StatCard>
        <StatIcon style={{ background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          🎨
        </StatIcon>
        <StatInfo>
          <StatLabel>Active Themes</StatLabel>
          <StatValue>8</StatValue>
          <StatChange positive>+2 new themes</StatChange>
        </StatInfo>
      </StatCard>
    </StatsGrid>

    <Section>
      <SectionHeader>
        <SectionTitle>Quick Actions</SectionTitle>
      </SectionHeader>
      <QuickActions>
        <QuickActionCard>
          <QuickActionIcon>🎨</QuickActionIcon>
          <QuickActionLabel>Manage Themes</QuickActionLabel>
          <QuickActionDesc>Create, edit, or delete game themes</QuickActionDesc>
        </QuickActionCard>

        <QuickActionCard>
          <QuickActionIcon>👥</QuickActionIcon>
          <QuickActionLabel>View Users</QuickActionLabel>
          <QuickActionDesc>Manage user accounts and permissions</QuickActionDesc>
        </QuickActionCard>

        <QuickActionCard>
          <QuickActionIcon>📈</QuickActionIcon>
          <QuickActionLabel>View Reports</QuickActionLabel>
          <QuickActionDesc>Access analytics and reports</QuickActionDesc>
        </QuickActionCard>
      </QuickActions>
    </Section>
  </>
);

const Container = styled.div`
  display: flex;
  height: 100vh;
  background: #f5f7fa;
`;

const Sidebar = styled.aside`
  width: 280px;
  background: linear-gradient(180deg, #1e3c72 0%, #2a5298 100%);
  display: flex;
  flex-direction: column;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  padding: 30px 20px;
  display: flex;
  align-items: center;
  gap: 12px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
`;

const LogoIcon = styled.div`
  font-size: 2rem;
`;

const LogoText = styled.h1`
  color: white;
  font-size: 1.4rem;
  margin: 0;
`;

const Menu = styled.nav`
  flex: 1;
  padding: 20px 0;
  overflow-y: auto;
`;

const MenuItemStyled = styled.div<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px 20px;
  margin: 4px 10px;
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.3s;
  background: ${props => props.$active ? 'rgba(255, 255, 255, 0.15)' : 'transparent'};
  border-left: 3px solid ${props => props.$active ? '#fff' : 'transparent'};

  &:hover {
    background: rgba(255, 255, 255, 0.1);
  }
`;

const MenuIcon = styled.span`
  font-size: 1.5rem;
`;

const MenuLabel = styled.span`
  color: white;
  font-weight: 500;
  font-size: 0.95rem;
`;

const UserSection = styled.div`
  padding: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 15px;
`;

const UserAvatar = styled.div`
  width: 45px;
  height: 45px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  font-size: 1.2rem;
`;

const UserDetails = styled.div`
  flex: 1;
`;

const UserName = styled.div`
  color: white;
  font-weight: 600;
  font-size: 0.9rem;
  margin-bottom: 2px;
`;

const UserRole = styled.div`
  color: rgba(255, 255, 255, 0.7);
  font-size: 0.75rem;
  text-transform: uppercase;
`;

const LogoutButton = styled.button`
  width: 100%;
  padding: 10px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  color: white;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;

  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const Header = styled.header`
  background: white;
  padding: 20px 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderTitle = styled.h2`
  margin: 0;
  color: #1e3c72;
  font-size: 1.5rem;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 10px;
`;

const ActionButton = styled.button`
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  background: #f5f7fa;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  transition: all 0.3s;

  &:hover {
    background: #e8ecf1;
  }
`;

const Badge = styled.span`
  position: absolute;
  top: -5px;
  right: -5px;
  background: #f5576c;
  color: white;
  font-size: 0.7rem;
  font-weight: bold;
  padding: 2px 6px;
  border-radius: 10px;
  min-width: 18px;
`;

const Content = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 30px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
`;

const StatCard = styled.div`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  gap: 15px;
  transition: all 0.3s;

  &:hover {
    transform: translateY(-5px);
    box-shadow: 0 5px 20px rgba(0, 0, 0, 0.1);
  }
`;

const StatIcon = styled.div`
  width: 60px;
  height: 60px;
  border-radius: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  color: #666;
  font-size: 0.85rem;
  margin-bottom: 5px;
`;

const StatValue = styled.div`
  color: #1e3c72;
  font-size: 1.8rem;
  font-weight: bold;
  margin-bottom: 5px;
`;

const StatChange = styled.div<{ positive?: boolean }>`
  color: ${props => props.positive ? '#43e97b' : '#f5576c'};
  font-size: 0.8rem;
  font-weight: 600;
`;

const Section = styled.section`
  background: white;
  border-radius: 15px;
  padding: 25px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 20px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
`;

const SectionTitle = styled.h3`
  margin: 0;
  color: #1e3c72;
  font-size: 1.2rem;
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
`;

const QuickActionCard = styled.div`
  padding: 20px;
  border: 2px solid #e8ecf1;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s;
  text-align: center;

  &:hover {
    border-color: #2a5298;
    background: #f5f7fa;
    transform: translateY(-3px);
  }
`;

const QuickActionIcon = styled.div`
  font-size: 2.5rem;
  margin-bottom: 10px;
`;

const QuickActionLabel = styled.div`
  color: #1e3c72;
  font-weight: 600;
  margin-bottom: 5px;
`;

const QuickActionDesc = styled.div`
  color: #666;
  font-size: 0.85rem;
`;

export default AdminPanel;
