import React, { useEffect, useState } from 'react';
import styled from 'styled-components';

interface Settings {
  minBetAmount: number;
  maxBetAmount: number;
  defaultBetAmount: number;
  rtpPercentage: number;
  maxWinMultiplier: number;
  maintenanceMode: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
}

const SettingsPage: React.FC = () => {
  const [settings, setSettings] = useState<Settings>({
    minBetAmount: 0.1,
    maxBetAmount: 1000,
    defaultBetAmount: 10,
    rtpPercentage: 96.5,
    maxWinMultiplier: 500,
    maintenanceMode: false,
    emailNotifications: true,
    smsNotifications: false,
  });

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (field: keyof Settings, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // TODO: Call backend API to save settings
      // await adminApi.updateSystemSettings(settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save settings:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>⚙️ System Settings</Title>
        <Subtitle>Configure game parameters and system behavior</Subtitle>
      </Header>

      {saved && <SuccessMessage>Settings saved successfully!</SuccessMessage>}

      <SettingsGrid>
        <SettingsSection>
          <SectionTitle>🎲 Game Settings</SectionTitle>
          <SettingItem>
            <Label htmlFor="minBet">Minimum Bet Amount</Label>
            <Input
              id="minBet"
              type="number"
              step="0.1"
              value={settings.minBetAmount}
              onChange={(e) => handleChange('minBetAmount', parseFloat(e.target.value))}
            />
          </SettingItem>

          <SettingItem>
            <Label htmlFor="maxBet">Maximum Bet Amount</Label>
            <Input
              id="maxBet"
              type="number"
              step="10"
              value={settings.maxBetAmount}
              onChange={(e) => handleChange('maxBetAmount', parseFloat(e.target.value))}
            />
          </SettingItem>

          <SettingItem>
            <Label htmlFor="defaultBet">Default Bet Amount</Label>
            <Input
              id="defaultBet"
              type="number"
              step="1"
              value={settings.defaultBetAmount}
              onChange={(e) => handleChange('defaultBetAmount', parseFloat(e.target.value))}
            />
          </SettingItem>

          <SettingItem>
            <Label htmlFor="rtp">RTP Percentage (%)</Label>
            <Input
              id="rtp"
              type="number"
              step="0.1"
              min="0"
              max="100"
              value={settings.rtpPercentage}
              onChange={(e) => handleChange('rtpPercentage', parseFloat(e.target.value))}
            />
          </SettingItem>

          <SettingItem>
            <Label htmlFor="maxWin">Maximum Win Multiplier</Label>
            <Input
              id="maxWin"
              type="number"
              step="10"
              value={settings.maxWinMultiplier}
              onChange={(e) => handleChange('maxWinMultiplier', parseFloat(e.target.value))}
            />
          </SettingItem>
        </SettingsSection>

        <SettingsSection>
          <SectionTitle>🔧 System Settings</SectionTitle>

          <ToggleItem>
            <ToggleLabel>
              <ToggleInput
                type="checkbox"
                checked={settings.maintenanceMode}
                onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
              />
              <span>Maintenance Mode</span>
            </ToggleLabel>
            <ToggleDescription>
              When enabled, only admins can access the system. Players will see a maintenance message.
            </ToggleDescription>
          </ToggleItem>

          <ToggleItem>
            <ToggleLabel>
              <ToggleInput
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) => handleChange('emailNotifications', e.target.checked)}
              />
              <span>Email Notifications</span>
            </ToggleLabel>
            <ToggleDescription>
              Send email alerts for important system events and admin actions.
            </ToggleDescription>
          </ToggleItem>

          <ToggleItem>
            <ToggleLabel>
              <ToggleInput
                type="checkbox"
                checked={settings.smsNotifications}
                onChange={(e) => handleChange('smsNotifications', e.target.checked)}
              />
              <span>SMS Notifications</span>
            </ToggleLabel>
            <ToggleDescription>
              Send SMS alerts for critical system events (requires SMS gateway).
            </ToggleDescription>
          </ToggleItem>
        </SettingsSection>
      </SettingsGrid>

      <ButtonContainer>
        <SaveButton onClick={handleSave} disabled={loading}>
          {loading ? 'Saving...' : '💾 Save Settings'}
        </SaveButton>
      </ButtonContainer>

      <InfoBox>
        <InfoTitle>📝 Important Notes</InfoTitle>
        <InfoList>
          <InfoItem>
            Changes to game settings will affect all future spins but not ongoing games.
          </InfoItem>
          <InfoItem>
            RTP Percentage should comply with local gaming regulations (typically 85-98%).
          </InfoItem>
          <InfoItem>
            Enable Maintenance Mode only during system updates or critical issues.
          </InfoItem>
          <InfoItem>
            All settings changes are logged in the admin audit logs for compliance tracking.
          </InfoItem>
        </InfoList>
      </InfoBox>
    </Container>
  );
};

const Container = styled.div`
  padding: 30px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  min-height: 100vh;
`;

const Header = styled.div`
  margin-bottom: 40px;
  text-align: center;
`;

const Title = styled.h1`
  font-size: 2.5rem;
  color: #1e3c72;
  margin-bottom: 10px;
`;

const Subtitle = styled.p`
  font-size: 1.1rem;
  color: #667eea;
`;

const SuccessMessage = styled.div`
  background: #e0ffe0;
  color: #2e7d32;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #2e7d32;
`;

const SettingsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 25px;
  margin-bottom: 30px;
`;

const SettingsSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
`;

const SectionTitle = styled.h2`
  font-size: 1.4rem;
  color: #1e3c72;
  margin-bottom: 20px;
  padding-bottom: 10px;
  border-bottom: 2px solid #667eea;
`;

const SettingItem = styled.div`
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const Label = styled.label`
  font-weight: 600;
  color: #1e3c72;
  font-size: 0.95rem;
`;

const Input = styled.input`
  padding: 12px 16px;
  border: 2px solid #667eea;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s ease;

  &:focus {
    outline: none;
    border-color: #1e3c72;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }

  &:hover {
    border-color: #1e3c72;
  }
`;

const ToggleItem = styled.div`
  margin-bottom: 20px;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 8px;
  border-left: 4px solid #667eea;

  &:last-child {
    margin-bottom: 0;
  }
`;

const ToggleLabel = styled.label`
  display: flex;
  align-items: center;
  cursor: pointer;
  font-weight: 600;
  color: #1e3c72;
  gap: 12px;

  span {
    flex: 1;
  }
`;

const ToggleInput = styled.input`
  width: 20px;
  height: 20px;
  cursor: pointer;
  accent-color: #667eea;
`;

const ToggleDescription = styled.p`
  font-size: 0.85rem;
  color: #999;
  margin-top: 8px;
  margin-left: 32px;
`;

const ButtonContainer = styled.div`
  display: flex;
  gap: 15px;
  margin-bottom: 30px;
  justify-content: center;
`;

const SaveButton = styled.button`
  padding: 14px 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const InfoBox = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
`;

const InfoTitle = styled.h3`
  font-size: 1.2rem;
  color: #1e3c72;
  margin-bottom: 15px;
`;

const InfoList = styled.ul`
  list-style: none;
  padding: 0;
  margin: 0;
`;

const InfoItem = styled.li`
  padding: 12px 0;
  color: #555;
  border-bottom: 1px solid #e0e0e0;
  line-height: 1.6;

  &:last-child {
    border-bottom: none;
  }

  &:before {
    content: '✓ ';
    color: #667eea;
    font-weight: bold;
    margin-right: 8px;
  }
`;

export default SettingsPage;
