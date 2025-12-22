import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { regenerateReferralCode as regenerateReferralCodeApi } from '../services/authApi';
import styled from 'styled-components';
import { useHistory } from 'react-router-dom';

const ReferPage: React.FC = () => {
  const { user, accessToken, setReferralCode } = useAuth();
  const [regenerating, setRegenerating] = useState(false);
  const history = useHistory();

  const handleCopyReferral = async () => {
    if (user?.referralCode) {
      await navigator.clipboard.writeText(user.referralCode);
      alert('Referral code copied!');
    }
  };

  const handleRegenerateReferral = async () => {
    if (!accessToken) return;
    setRegenerating(true);
    try {
      const resp = await regenerateReferralCodeApi(accessToken);
      setReferralCode(resp.referralCode);
    } catch (e) {
      alert('Could not regenerate referral code');
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Container>
      <TopBar>
        <BackButton onClick={() => history.goBack()}>← Back</BackButton>
        <PageTitle>Referral Program</PageTitle>
      </TopBar>

      <Content>
        <HeroSection>
          <HeroIcon>🎁</HeroIcon>
          <HeroTitle>Invite Friends, Earn Together</HeroTitle>
          <HeroSubtitle>Share your referral code and both you and your friend get bonus rewards when they sign up!</HeroSubtitle>
        </HeroSection>

        <ReferralCard>
          <CardHeader>
            <CardTitle>Your Referral Code</CardTitle>
            <Badge>Active</Badge>
          </CardHeader>
          <CardBody>
            <CodeDisplay>{user?.referralCode || 'Generating...'}</CodeDisplay>
            <ActionRow>
              <ActionButton primary onClick={handleCopyReferral} disabled={!user?.referralCode}>
                📋 Copy Code
              </ActionButton>
              <ActionButton onClick={handleRegenerateReferral} disabled={regenerating}>
                {regenerating ? '⏳ Generating...' : '🔄 New Code'}
              </ActionButton>
            </ActionRow>
          </CardBody>
        </ReferralCard>

        <BenefitsSection>
          <SectionTitle>How It Works</SectionTitle>
          <BenefitsList>
            <BenefitItem>
              <BenefitIcon>1️⃣</BenefitIcon>
              <BenefitText>
                <BenefitName>Share your code</BenefitName>
                <BenefitDesc>Send your unique referral code to friends</BenefitDesc>
              </BenefitText>
            </BenefitItem>
            <BenefitItem>
              <BenefitIcon>2️⃣</BenefitIcon>
              <BenefitText>
                <BenefitName>Friend signs up</BenefitName>
                <BenefitDesc>They enter your code during registration</BenefitDesc>
              </BenefitText>
            </BenefitItem>
            <BenefitItem>
              <BenefitIcon>3️⃣</BenefitIcon>
              <BenefitText>
                <BenefitName>Both get rewarded</BenefitName>
                <BenefitDesc>You both receive bonus credits instantly</BenefitDesc>
              </BenefitText>
            </BenefitItem>
          </BenefitsList>
        </BenefitsSection>
      </Content>

      <BottomNav>
        <NavItem onClick={() => history.push('/themes')}>
          <span>🏠</span>
          <small>Home</small>
        </NavItem>
        <NavItem $active>
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

const Container = styled.div`
  min-height: 100vh;
  background: radial-gradient(circle at 20% 20%, #1f2d50, #0e1425 60%);
  padding: 16px 16px 86px;
  display: flex;
  flex-direction: column;
`;

const TopBar = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
`;

const BackButton = styled.button`
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e8edff;
  padding: 8px 16px;
  border-radius: 10px;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background: rgba(255, 255, 255, 0.15);
  }
`;

const PageTitle = styled.h1`
  color: #fdfdfd;
  font-size: 1.4rem;
  margin: 0;
`;

const Content = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
`;

const HeroSection = styled.div`
  text-align: center;
  padding: 20px;
  background: linear-gradient(145deg, rgba(255, 218, 121, 0.1), rgba(255, 107, 107, 0.1));
  border-radius: 16px;
  border: 1px solid rgba(255, 218, 121, 0.2);
`;

const HeroIcon = styled.div`
  font-size: 3rem;
  margin-bottom: 10px;
`;

const HeroTitle = styled.h2`
  color: #ffda79;
  font-size: 1.5rem;
  margin: 0 0 8px 0;
  font-weight: 800;
`;

const HeroSubtitle = styled.p`
  color: #cdd6ff;
  font-size: 0.95rem;
  margin: 0;
  line-height: 1.5;
`;

const ReferralCard = styled.div`
  background: linear-gradient(145deg, #1f2850, #141a33);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.25);
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
`;

const CardTitle = styled.h3`
  color: #fdfdfd;
  font-size: 1.1rem;
  margin: 0;
`;

const Badge = styled.span`
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 700;
  border: 1px solid rgba(76, 175, 80, 0.3);
`;

const CardBody = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const CodeDisplay = styled.div`
  background: rgba(255, 218, 121, 0.1);
  border: 2px solid rgba(255, 218, 121, 0.3);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: 3px;
  color: #ffda79;
  text-shadow: 0 2px 10px rgba(255, 218, 121, 0.3);
`;

const ActionRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const ActionButton = styled.button<{ primary?: boolean }>`
  padding: 12px 16px;
  background: ${(p) => p.primary ? 'linear-gradient(135deg, #ffb347, #ff6b6b)' : 'rgba(255, 255, 255, 0.12)'};
  color: ${(p) => p.primary ? '#1b1b1b' : '#e8edff'};
  border: ${(p) => p.primary ? 'none' : '1px solid rgba(255, 255, 255, 0.18)'};
  border-radius: 10px;
  font-weight: 800;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.95rem;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
  }
`;

const BenefitsSection = styled.div`
  background: linear-gradient(145deg, #1f2850, #141a33);
  border-radius: 16px;
  padding: 20px;
  border: 1px solid rgba(255, 255, 255, 0.08);
`;

const SectionTitle = styled.h3`
  color: #fdfdfd;
  font-size: 1.2rem;
  margin: 0 0 16px 0;
`;

const BenefitsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const BenefitItem = styled.div`
  display: flex;
  gap: 12px;
  align-items: flex-start;
`;

const BenefitIcon = styled.div`
  font-size: 1.8rem;
  flex-shrink: 0;
`;

const BenefitText = styled.div`
  flex: 1;
`;

const BenefitName = styled.div`
  color: #fdfdfd;
  font-weight: 700;
  font-size: 1rem;
  margin-bottom: 4px;
`;

const BenefitDesc = styled.div`
  color: #9fb3ff;
  font-size: 0.9rem;
  line-height: 1.4;
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

export default ReferPage;
