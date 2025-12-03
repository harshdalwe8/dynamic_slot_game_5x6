import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const history = useHistory();

  const validateForm = (): boolean => {
    if (!displayName.trim()) {
      setError('Display name is required');
      return false;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      await register(email, password, displayName);
      history.push('/game');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToLogin = () => {
    history.push('/login');
  };

  return (
    <Container>
      <RegisterCard>
        <Title>🎰 Slot Game</Title>
        <Subtitle>Create Your Account</Subtitle>

        {error && <ErrorMessage>{error}</ErrorMessage>}

        <Form onSubmit={handleSubmit}>
          <InputGroup>
            <Label>Email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              disabled={isLoading}
            />
          </InputGroup>

          <InputGroup>
            <Label>Display Name</Label>
            <Input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your display name"
              required
              disabled={isLoading}
            />
          </InputGroup>

          <InputGroup>
            <Label>Password</Label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              required
              disabled={isLoading}
              minLength={6}
            />
          </InputGroup>

          <InputGroup>
            <Label>Confirm Password</Label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter your password"
              required
              disabled={isLoading}
              minLength={6}
            />
          </InputGroup>

          <InfoBox>
            <InfoTitle>💡 Account Benefits:</InfoTitle>
            <InfoList>
              <li>Track your progress and achievements</li>
              <li>Compete on leaderboards</li>
              <li>Save your game statistics</li>
              <li>Access exclusive themes</li>
            </InfoList>
          </InfoBox>

          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </Form>

        <LoginPrompt>
          Already have an account?{' '}
          <LoginLink onClick={navigateToLogin}>Login here</LoginLink>
        </LoginPrompt>
      </RegisterCard>
    </Container>
  );
};

const Container = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;
`;

const RegisterCard = styled.div`
  background: white;
  border-radius: 20px;
  padding: 40px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  max-width: 450px;
  width: 100%;
`;

const Title = styled.h1`
  font-size: 2rem;
  text-align: center;
  margin: 0 0 10px 0;
  color: #333;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  margin: 0 0 30px 0;
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
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:disabled {
    background: #f5f5f5;
    cursor: not-allowed;
  }
`;

const InfoBox = styled.div`
  background: #f0f4ff;
  border: 2px solid #d0dfff;
  border-radius: 10px;
  padding: 15px;
`;

const InfoTitle = styled.div`
  font-weight: 600;
  color: #667eea;
  margin-bottom: 10px;
`;

const InfoList = styled.ul`
  margin: 0;
  padding-left: 20px;
  color: #555;

  li {
    margin: 5px 0;
    font-size: 0.9rem;
  }
`;

const Button = styled.button`
  padding: 14px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(102, 126, 234, 0.3);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const LoginPrompt = styled.p`
  text-align: center;
  margin-top: 25px;
  color: #666;
`;

const LoginLink = styled.span`
  color: #667eea;
  font-weight: 600;
  cursor: pointer;

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
`;

export default Register;
