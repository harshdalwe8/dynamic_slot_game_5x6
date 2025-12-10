import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  getAllUsers,
  updateUserStatus,
  updateUserRole,
  updateUserBalance,
  UserListResponse,
} from '../services/adminApi';
import { useAuth } from '../contexts/AuthContext';

interface Wallet {
  balance: number;
  currency: string;
}

interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'PLAYER' | 'SUPPORT_STAFF' | 'GAME_MANAGER' | 'SUPER_ADMIN';
  status: 'ACTIVE' | 'BANNED' | 'DISABLED';
  wallets: Wallet[];
  createdAt: string;
  lastLogin: string;
}

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [balanceInput, setBalanceInput] = useState<string>('');
  const [balanceLoading, setBalanceLoading] = useState(false);

  const { user } = useAuth();
  const currentUserRole = user?.role;

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, roleFilter, statusFilter, users]);

  const loadUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllUsers({ limit: 100 });
      setUsers(data.users || []);
    } catch (error: any) {
      console.error('Failed to load users:', error);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.displayName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (roleFilter) {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    if (statusFilter) {
      filtered = filtered.filter((user) => user.status === statusFilter);
    }

    setFilteredUsers(filtered);
  };

  const handleStatusChange = async (user: User, newStatus: 'ACTIVE' | 'BANNED' | 'DISABLED') => {
    setLoading(true);
    setError('');
    try {
      await updateUserStatus(user.id, newStatus);
      const updatedUsers = users.map((u) =>
        u.id === user.id ? { ...u, status: newStatus } : u
      );
      setUsers(updatedUsers);
      setSelectedUser(null);
      setShowModal(false);
    } catch (error: any) {
      console.error('Failed to update user status:', error);
      setError('Failed to update user status. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (user: User, newRole: User['role']) => {
    setLoading(true);
    setError('');
    try {
      await updateUserRole(user.id, newRole);
      const updatedUsers = users.map((u) => (u.id === user.id ? { ...u, role: newRole } : u));
      setUsers(updatedUsers);
      setSelectedUser(null);
      setShowModal(false);
    } catch (error: any) {
      console.error('Failed to update user role:', error);
      setError('Failed to update user role. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle balance update
  const handleBalanceUpdate = async () => {
    if (!selectedUser) return;
    setBalanceLoading(true);
    setError('');
    try {
      const newBalance = parseInt(balanceInput, 10);
      if (isNaN(newBalance) || newBalance < 0) {
        setError('Please enter a valid non-negative balance.');
        setBalanceLoading(false);
        return;
      }
      await updateUserBalance(selectedUser.id, newBalance);
      // Update local state
      const updatedUsers = users.map((u) =>
        u.id === selectedUser.id
          ? { ...u, wallets: [{ ...u.wallets[0], balance: newBalance, currency: u.wallets[0]?.currency || 'COINS' }] }
          : u
      );
      setUsers(updatedUsers);
      setSelectedUser({ ...selectedUser, wallets: [{ ...selectedUser.wallets[0], balance: newBalance, currency: selectedUser.wallets[0]?.currency || 'COINS' }] });
      setBalanceInput('');
    } catch (error: any) {
      setError('Failed to update balance. Please try again.');
    } finally {
      setBalanceLoading(false);
    }
  };

  return (
    <Container>
      <Header>
        <Title>User Management</Title>
        <HeaderInfo>Total Users: {users.length}</HeaderInfo>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <FilterBar>
        <SearchInput
          type="text"
          placeholder="Search by email or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />


        <FilterSelect
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          aria-label="Filter by user role"
          title="Filter users by role"
        >
          <option value="">All Roles</option>
          <option value="PLAYER">Player</option>
          <option value="SUPPORT_STAFF">Support Staff</option>
          <option value="GAME_MANAGER">Game Manager</option>
          <option value="SUPER_ADMIN">Super Admin</option>
        </FilterSelect>

        <FilterSelect
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          aria-label="Filter by user status"
          title="Filter users by status"
        >
          <option value="">All Status</option>
          <option value="ACTIVE">Active</option>
          <option value="BANNED">Banned</option>
          <option value="DISABLED">Disabled</option>
        </FilterSelect>
      </FilterBar>

      <TableContainer>
        {loading ? (
          <LoadingSpinner>Loading users...</LoadingSpinner>
        ) : (
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Balance</TableCell>
                <TableCell>Last Login</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <UserInfo>
                      <UserAvatar>{user.displayName.charAt(0).toUpperCase()}</UserAvatar>
                      <div>
                        <UserName>{user.displayName}</UserName>
                        <UserDate>{new Date(user.createdAt).toLocaleDateString()}</UserDate>
                      </div>
                    </UserInfo>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <RoleBadge $role={user.role}>{user.role}</RoleBadge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge $status={user.status}>{user.status}</StatusBadge>
                  </TableCell>
                  <TableCell>${(user.wallets && user.wallets[0]?.balance !== undefined ? user.wallets[0].balance : 0).toLocaleString()}</TableCell>
                  <TableCell>{new Date(user.lastLogin).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <ActionButton
                      onClick={() => {
                        setSelectedUser(user);
                        setShowModal(true);
                      }}
                    >
                      ⚙️
                    </ActionButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {filteredUsers.length === 0 && !loading && (
          <EmptyState>No users found matching your filters.</EmptyState>
        )}
      </TableContainer>

      {showModal && selectedUser && (
        <Modal>
          <ModalContent>
            <ModalHeader>
              <ModalTitle>Manage User: {selectedUser.displayName}</ModalTitle>
              <CloseButton onClick={() => setShowModal(false)}>✕</CloseButton>
            </ModalHeader>

            <ModalBody>
              <Section>
                <SectionTitle>User Information</SectionTitle>
                <InfoGrid>
                  <InfoItem>
                    <InfoLabel>Email</InfoLabel>
                    <InfoValue>{selectedUser.email}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Created</InfoLabel>
                    <InfoValue>{new Date(selectedUser.createdAt).toLocaleDateString()}</InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Balance</InfoLabel>
                    <InfoValue>
                      ${
                        selectedUser.wallets && selectedUser.wallets[0]?.balance !== undefined
                          ? selectedUser.wallets[0].balance.toLocaleString()
                          : '0'
                      }
                    </InfoValue>
                  </InfoItem>
                  <InfoItem>
                    <InfoLabel>Last Login</InfoLabel>
                    <InfoValue>{new Date(selectedUser.lastLogin).toLocaleDateString()}</InfoValue>
                  </InfoItem>
                </InfoGrid>
                {/* Balance update input for SUPER_ADMIN and SUPPORT_STAFF only */}
                {(currentUserRole === 'SUPER_ADMIN' || currentUserRole === 'SUPPORT_STAFF') && (
                  <BalanceUpdateSection>
                    <SectionTitle>Update Balance</SectionTitle>
                    <BalanceInputWrapper>
                      <BalanceInput
                        type="number"
                        min="0"
                        value={balanceInput}
                        onChange={(e) => setBalanceInput(e.target.value)}
                        placeholder="Enter new balance"
                        disabled={balanceLoading}
                      />
                      <BalanceUpdateButton
                        onClick={handleBalanceUpdate}
                        disabled={balanceLoading || !balanceInput}
                      >
                        {balanceLoading ? 'Updating...' : 'Update'}
                      </BalanceUpdateButton>
                    </BalanceInputWrapper>
                  </BalanceUpdateSection>
                )}
              </Section>

              <Section>
                <SectionTitle>Change Role</SectionTitle>
                <RoleGrid>
                  {(['PLAYER', 'SUPPORT_STAFF', 'GAME_MANAGER', 'SUPER_ADMIN'] as const).map(
                    (role) => (
                      <RoleOption
                        key={role}
                        $selected={selectedUser.role === role}
                        onClick={() => handleRoleChange(selectedUser, role)}
                        disabled={loading}
                      >
                        {role}
                      </RoleOption>
                    )
                  )}
                </RoleGrid>
              </Section>

              <Section>
                <SectionTitle>Change Status</SectionTitle>
                <StatusGrid>
                  {(['ACTIVE', 'BANNED', 'DISABLED'] as const).map((status) => (
                    <StatusOption
                      key={status}
                      $selected={selectedUser.status === status}
                      $status={status}
                      onClick={() => handleStatusChange(selectedUser, status)}
                      disabled={loading}
                    >
                      {status}
                    </StatusOption>
                  ))}
                </StatusGrid>
              </Section>
            </ModalBody>

            <ModalFooter>
              <CloseModalButton onClick={() => setShowModal(false)} disabled={loading}>
                Close
              </CloseModalButton>
            </ModalFooter>
          </ModalContent>
        </Modal>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 30px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
`;

const ErrorMessage = styled.div`
  background: #ffe0e0;
  color: #d32f2f;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #d32f2f;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h2`
  margin: 0;
  color: #1e3c72;
  font-size: 1.5rem;
`;

const HeaderInfo = styled.div`
  color: #666;
  font-size: 0.95rem;
`;

const FilterBar = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr 1fr;
  gap: 15px;
  margin-bottom: 25px;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const SearchInput = styled.input`
  padding: 12px 15px;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const FilterSelect = styled.select`
  padding: 12px 15px;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  font-size: 0.95rem;
  background: white;
  cursor: pointer;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const TableContainer = styled.div`
  overflow-x: auto;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  background: #f8f9fa;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #e8ecf1;

  &:hover {
    background: #f8f9fa;
  }
`;

const TableCell = styled.td`
  padding: 15px;
  color: #333;
  font-size: 0.95rem;
`;

const UserInfo = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const UserAvatar = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.1rem;
`;

const UserName = styled.div`
  font-weight: 600;
  color: #1e3c72;
`;

const UserDate = styled.div`
  font-size: 0.8rem;
  color: #999;
`;

const RoleBadge = styled.span<{ $role: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${(props) => {
    switch (props.$role) {
      case 'SUPER_ADMIN':
        return '#f5576c';
      case 'GAME_MANAGER':
        return '#4facfe';
      case 'SUPPORT_STAFF':
        return '#43e97b';
      default:
        return '#ffa502';
    }
  }};
  color: white;
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${(props) => {
    switch (props.$status) {
      case 'ACTIVE':
        return '#d4edda';
      case 'BANNED':
        return '#f8d7da';
      case 'DISABLED':
        return '#fff3cd';
      default:
        return '#e8ecf1';
    }
  }};
  color: ${(props) => {
    switch (props.$status) {
      case 'ACTIVE':
        return '#155724';
      case 'BANNED':
        return '#721c24';
      case 'DISABLED':
        return '#856404';
      default:
        return '#666';
    }
  }};
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  background: #f0f1f3;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1.1rem;
  transition: all 0.3s;

  &:hover {
    background: #e8ecf1;
    transform: scale(1.05);
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #666;
  font-size: 1.1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 1.1rem;
`;

const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 15px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
`;

const ModalHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 25px;
  border-bottom: 1px solid #e8ecf1;
`;

const ModalTitle = styled.h3`
  margin: 0;
  color: #1e3c72;
  font-size: 1.3rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #999;
  transition: all 0.3s;

  &:hover {
    color: #333;
  }
`;

const ModalBody = styled.div`
  padding: 25px;
`;

const Section = styled.div`
  margin-bottom: 25px;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h4`
  margin: 0 0 15px 0;
  color: #1e3c72;
  font-size: 1.1rem;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
`;

const InfoItem = styled.div``;

const InfoLabel = styled.div`
  font-size: 0.85rem;
  color: #999;
  font-weight: 600;
  margin-bottom: 5px;
  text-transform: uppercase;
`;

const InfoValue = styled.div`
  color: #333;
  font-weight: 600;
`;

const RoleGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
`;

const RoleOption = styled.button<{ $selected: boolean }>`
  padding: 12px;
  border: 2px solid ${(props) => (props.$selected ? '#667eea' : '#e8ecf1')};
  border-radius: 8px;
  background: ${(props) => (props.$selected ? '#f0f4ff' : 'white')};
  color: ${(props) => (props.$selected ? '#667eea' : '#333')};
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    border-color: #667eea;
    background: #f0f4ff;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const StatusGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
`;

const StatusOption = styled.button<{ $selected: boolean; $status: string }>`
  padding: 12px;
  border: 2px solid
    ${(props) => {
      if (!props.$selected) return '#e8ecf1';
      switch (props.$status) {
        case 'ACTIVE':
          return '#43e97b';
        case 'BANNED':
          return '#f5576c';
        case 'DISABLED':
          return '#ffa502';
        default:
          return '#667eea';
      }
    }};
  border-radius: 8px;
  background: ${(props) => {
    if (!props.$selected) return 'white';
    switch (props.$status) {
      case 'ACTIVE':
        return '#f0fff6';
      case 'BANNED':
        return '#fff5f7';
      case 'DISABLED':
        return '#fffbf0';
      default:
        return 'white';
    }
  }};
  color: ${(props) => {
    if (!props.$selected) return '#333';
    switch (props.$status) {
      case 'ACTIVE':
        return '#43e97b';
      case 'BANNED':
        return '#f5576c';
      case 'DISABLED':
        return '#ffa502';
      default:
        return '#333';
    }
  }};
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ModalFooter = styled.div`
  padding: 20px 25px;
  border-top: 1px solid #e8ecf1;
  display: flex;
  justify-content: flex-end;
`;

const CloseModalButton = styled.button`
  padding: 10px 24px;
  background: #e8ecf1;
  color: #666;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #ddd;
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const BalanceUpdateSection = styled.div`
  margin-top: 18px;
`;

const BalanceInputWrapper = styled.div`
  display: flex;
  gap: 10px;
  align-items: center;
`;

const BalanceInput = styled.input`
  padding: 8px;
  border-radius: 6px;
  border: 1px solid #e8ecf1;
  width: 140px;
  font-size: 0.95rem;
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

const BalanceUpdateButton = styled.button`
  padding: 8px 18px;
  border-radius: 6px;
  background: #4facfe;
  color: white;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    background: #3d9bef;
    transform: translateY(-2px);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export default UserManagement;
