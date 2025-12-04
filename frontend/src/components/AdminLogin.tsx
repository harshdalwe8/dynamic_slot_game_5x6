import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const history = useHistory();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(email, password);
      
      // Check if user has admin role
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const user = JSON.parse(storedUser);
        if (user.role === 'SUPER_ADMIN' || user.role === 'GAME_MANAGER' || user.role === 'SUPPORT_STAFF') {
          history.push('/admin/dashboard');
        } else {
          setError('Access denied. Admin privileges required.');
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
        }
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container>
      <LoginCard>
        <Header>
          <Icon>🔐</Icon>
          <Title>Admin Portal</Title>
          <Subtitle>Slot Game Management System</Subtitle>
        </Header>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Admin Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter admin email"
              required
              disabled={isLoading}
              autoComplete="username"
            />
          </InputGroup>

          <InputGroup>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={isLoading}
              autoComplete="current-password"
            />
          </InputGroup>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Spinner>⚙️</Spinner> Authenticating...
              </>
            ) : (
              <>🔓 Login to Admin Panel</>
            )}
          </Button>
        </Form>

        <Footer>
          <FooterLink onClick={() => history.push('/login')}>
            ← Back to Player Login
          </FooterLink>
        </Footer>
      </LoginCard>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  padding: 20px;
`;

const LoginCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.4);
  max-width: 450px;
  width: 100%;
  border-top: 5px solid #2a5298;
`;

const Header = styled.div`
  text-align: center;
  margin-bottom: 30px;
`;

const Icon = styled.div`
  font-size: 4rem;
  margin-bottom: 10px;
`;

const Title = styled.h1`
  font-size: 2rem;
  margin: 0 0 10px 0;
  color: #1e3c72;
`;

const Subtitle = styled.p`
  color: #666;
  margin: 0;
  font-size: 0.95rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #333;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #e0e0e0;
  border-radius: 10px;
  font-size: 1rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #2a5298;
    box-shadow: 0 0 0 3px rgba(42, 82, 152, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  padding: 14px 20px;
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;
  margin-top: 10px;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(42, 82, 152, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const Spinner = styled.span`
  display: inline-block;
  animation: spin 1s linear infinite;

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

const Footer = styled.div`
  margin-top: 25px;
  text-align: center;
`;

const FooterLink = styled.span`
  color: #2a5298;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.div`
  background: #fee;
  color: #c33;
  padding: 12px 16px;
  border-radius: 10px;
  margin-bottom: 20px;
  border: 1px solid #fcc;
  text-align: center;
`;

export default AdminLogin;
