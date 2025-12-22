import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useHistory } from 'react-router-dom';
import styled from 'styled-components';
import { getWalletBalance, getTransactionHistory, Transaction as TransactionType } from '../services/playerApi';

const WalletPage: React.FC = () => {
  const { user } = useAuth();
  const history = useHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(true);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError('');
        
        // Fetch wallet balance
        const walletData = await getWalletBalance();
        const balance = walletData.wallet?.balance ?? walletData.balance ?? 0;
        setWalletBalance(balance);
        
        // Fetch transaction history
        const txHistory = await getTransactionHistory(100, 0);
        setTransactions(txHistory.transactions);
      } catch (err: any) {
        console.error('Failed to fetch wallet data:', err);
        setError('Failed to load wallet data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const totalInvest = transactions
    .filter(t => t.type === 'SPIN' || t.type === 'DEBIT')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const totalWin = transactions
    .filter(t => t.type === 'WIN' || t.type === 'BONUS' || t.type === 'JACKPOT')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);

  const filteredTransactions = transactions.filter(t =>
    t.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.reference?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CREDIT':
      case 'WIN':
      case 'BONUS':
      case 'JACKPOT':
      case 'REFERRAL':
      case 'COUPON':
        return '⬆';
      case 'DEBIT':
      case 'SPIN':
        return '⬇';
      default:
        return '•';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'CREDIT':
      case 'WIN':
      case 'BONUS':
      case 'JACKPOT':
      case 'REFERRAL':
      case 'COUPON':
        return '#4caf50';
      case 'DEBIT':
      case 'SPIN':
        return '#f44336';
      default:
        return '#9fb3ff';
    }
  };

  return (
    <Container>
      <Header>
        <HeaderIcon>💰</HeaderIcon>
        <HeaderTitle>WALLET</HeaderTitle>
      </Header>

      <BalanceCard>
        <BalanceLabel>Wallet Balance</BalanceLabel>
        <BalanceAmount>${(walletBalance / 100).toFixed(2)}</BalanceAmount>
      </BalanceCard>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <ActionButtons>
        <ActionButton $variant="deposit" onClick={() => history.push('/deposit')}>
          ⬇ Deposit
        </ActionButton>
        <ActionButton $variant="withdraw">
          ⬆ Withdraw
        </ActionButton>
      </ActionButtons>

      <StatsRow>
        <StatCard>
          <StatIcon>📥</StatIcon>
          <StatInfo>
            <StatLabel>Total Invest</StatLabel>
            <StatValue>${totalInvest.toFixed(2)}</StatValue>
          </StatInfo>
        </StatCard>
        <StatCard>
          <StatIcon>🏆</StatIcon>
          <StatInfo>
            <StatLabel>Total Win</StatLabel>
            <StatValue>${totalWin.toFixed(2)}</StatValue>
          </StatInfo>
        </StatCard>
      </StatsRow>

      <HistorySection>
        <HistoryHeader>TRANSACTION HISTORY</HistoryHeader>
        <SearchBar>
          <SearchInput
            type="text"
            placeholder="Search transaction"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <SearchIcon>🔍</SearchIcon>
        </SearchBar>

        <TransactionList>
          {loading ? (
            <LoadingText>Loading transactions...</LoadingText>
          ) : filteredTransactions.length === 0 ? (
            <EmptyText>No transactions found</EmptyText>
          ) : (
            filteredTransactions.map((transaction, index) => (
              <TransactionItem key={`${transaction.id}-${index}`}>
                <TransactionIcon $color={getTransactionColor(transaction.type)}>
                  {getTransactionIcon(transaction.type)}
                </TransactionIcon>
                <TransactionInfo>
                  <TransactionId>{transaction.reference || transaction.id.slice(0, 12).toUpperCase()}</TransactionId>
                  <TransactionDate>{formatDate(transaction.createdAt)}</TransactionDate>
                  <TransactionDesc>{transaction.reason}</TransactionDesc>
                </TransactionInfo>
                <TransactionAmount $positive={transaction.amount > 0}>
                  {transaction.amount > 0 ? '+' : ''}{(Math.abs(transaction.amount) / 100).toFixed(2)}USD
                </TransactionAmount>
              </TransactionItem>
            ))
          )}
        </TransactionList>
      </HistorySection>

      <BottomNav>
        <NavItem onClick={() => history.push('/themes')}>
          <span>🏠</span>
          <small>Lobby</small>
        </NavItem>
        <NavItem onClick={() => history.push('/game')}>
          <span>🎮</span>
          <small>Games</small>
        </NavItem>
        <NavItem $active>
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
  gap: 16px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const HeaderIcon = styled.span`
  font-size: 1.5rem;
  color: #ffb347;
`;

const HeaderTitle = styled.h1`
  color: #fdfdfd;
  font-size: 1.3rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.5px;
`;

const BalanceCard = styled.div`
  background: linear-gradient(145deg, #1f2850, #141a33);
  border: 2px solid rgba(255, 179, 71, 0.3);
  border-radius: 14px;
  padding: 20px;
  text-align: center;
`;

const BalanceLabel = styled.div`
  color: #9fb3ff;
  font-size: 0.9rem;
  margin-bottom: 8px;
`;

const BalanceAmount = styled.div`
  color: #ffb347;
  font-size: 2.5rem;
  font-weight: 800;
  text-shadow: 0 2px 10px rgba(255, 179, 71, 0.4);
`;

const ActionButtons = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const ActionButton = styled.button<{ $variant: 'deposit' | 'withdraw' }>`
  padding: 14px;
  background: ${p => p.$variant === 'deposit' 
    ? 'linear-gradient(135deg, #4caf50, #45a049)' 
    : 'linear-gradient(135deg, #f44336, #e53935)'};
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 800;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(0, 0, 0, 0.3);
  }

  &:active {
    transform: translateY(0);
  }
`;

const StatsRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
`;

const StatCard = styled.div`
  background: linear-gradient(145deg, #1f2850, #141a33);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const StatIcon = styled.div`
  font-size: 2rem;
  flex-shrink: 0;
`;

const StatInfo = styled.div`
  flex: 1;
`;

const StatLabel = styled.div`
  color: #9fb3ff;
  font-size: 0.8rem;
  margin-bottom: 4px;
`;

const StatValue = styled.div`
  color: #ffb347;
  font-size: 1.1rem;
  font-weight: 800;
`;

const HistorySection = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const HistoryHeader = styled.h2`
  color: #fdfdfd;
  font-size: 1rem;
  font-weight: 800;
  margin: 0;
  letter-spacing: 0.5px;
`;

const SearchBar = styled.div`
  position: relative;
`;

const SearchInput = styled.input`
  width: 100%;
  padding: 12px 40px 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 10px;
  color: #e8edff;
  font-size: 0.95rem;

  &::placeholder {
    color: #6b7a99;
  }

  &:focus {
    outline: none;
    border-color: rgba(255, 179, 71, 0.5);
  }
`;

const SearchIcon = styled.div`
  position: absolute;
  right: 14px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 1.1rem;
  color: #ffb347;
`;

const TransactionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const TransactionItem = styled.div`
  background: linear-gradient(145deg, #1f2850, #141a33);
  border: 1px solid rgba(255, 255, 255, 0.06);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const TransactionIcon = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: ${p => p.$color}22;
  border: 2px solid ${p => p.$color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  color: ${p => p.$color};
  flex-shrink: 0;
`;

const TransactionInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const TransactionId = styled.div`
  color: #fdfdfd;
  font-weight: 700;
  font-size: 0.95rem;
  margin-bottom: 2px;
`;

const TransactionDate = styled.div`
  color: #6b7a99;
  font-size: 0.75rem;
  margin-bottom: 2px;
`;

const TransactionDesc = styled.div`
  color: #9fb3ff;
  font-size: 0.85rem;
`;

const TransactionAmount = styled.div<{ $positive: boolean }>`
  color: ${p => p.$positive ? '#4caf50' : '#f44336'};
  font-weight: 800;
  font-size: 1rem;
  flex-shrink: 0;
`;

const ErrorMessage = styled.div`
  background: rgba(255, 107, 107, 0.1);
  color: #ff9b9b;
  padding: 12px;
  border-radius: 10px;
  margin: 8px 0;
  text-align: center;
  border: 1px solid rgba(255, 107, 107, 0.3);
`;

const LoadingText = styled.div`
  color: #9fb3ff;
  text-align: center;
  padding: 40px 20px;
  font-size: 0.95rem;
`;

const EmptyText = styled.div`
  color: #6b7a99;
  text-align: center;
  padding: 40px 20px;
  font-size: 0.95rem;
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
  color: ${p => p.$active ? '#ffda79' : '#e8edff'};
  font-weight: 700;
  cursor: pointer;
  font-size: 0.9rem;
`;

export default WalletPage;
