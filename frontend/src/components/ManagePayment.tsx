import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  createPaymentLink,
  listPaymentLinks,
  updatePaymentLink,
  deletePaymentLink,
  togglePaymentLink,
  listDeposits,
  approveDeposit,
  rejectDeposit,
  PaymentLink,
  Deposit,
} from '../services/adminApi';

const ManagePayment: React.FC = () => {
  const [paymentLinks, setPaymentLinks] = useState<PaymentLink[]>([]);
  const [deposits, setDeposits] = useState<Deposit[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingLink, setEditingLink] = useState<PaymentLink | null>(null);
  const [activeTab, setActiveTab] = useState<'links' | 'deposits'>('links');
  const [depositFilter, setDepositFilter] = useState<'PENDING' | 'SCREENSHOT_UPLOADED' | 'APPROVED' | 'REJECTED' | ''>('SCREENSHOT_UPLOADED');

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    payeeVPA: '',
    payeeName: '',
  });

  useEffect(() => {
    fetchData();
  }, [activeTab, depositFilter]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'links') {
        const response = await listPaymentLinks();
        setPaymentLinks(response.paymentLinks);
      } else {
        const response = await listDeposits(depositFilter || undefined);
        setDeposits(response.deposits);
      }
      setError('');
    } catch (err: any) {
      setError('Failed to load data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const resetForm = () => {
    setFormData({
      name: '',
      payeeVPA: '',
      payeeName: '',
    });
    setEditingLink(null);
    setShowCreateForm(false);
  };

  const handleCreate = async () => {
    try {
      if (!formData.name || !formData.payeeVPA || !formData.payeeName) {
        setError('All fields are required');
        return;
      }

      await createPaymentLink({
        name: formData.name,
        payeeVPA: formData.payeeVPA,
        payeeName: formData.payeeName,
      });

      await fetchData();
      resetForm();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create payment link');
      console.error(err);
    }
  };

  const handleUpdate = async () => {
    if (!editingLink) return;

    try {
      const updateData: any = {};
      if (formData.name && formData.name !== editingLink.name) updateData.name = formData.name;
      if (formData.payeeVPA && formData.payeeVPA !== editingLink.payeeVPA) updateData.payeeVPA = formData.payeeVPA;
      if (formData.payeeName && formData.payeeName !== editingLink.payeeName) updateData.payeeName = formData.payeeName;

      if (Object.keys(updateData).length === 0) {
        setError('No changes detected');
        return;
      }

      await updatePaymentLink(editingLink.id, updateData);
      await fetchData();
      resetForm();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update payment link');
      console.error(err);
    }
  };

  const handleEdit = (link: PaymentLink) => {
    setEditingLink(link);
    setFormData({
      name: link.name,
      payeeVPA: link.payeeVPA,
      payeeName: link.payeeName,
    });
    setShowCreateForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this payment link?')) return;

    try {
      await deletePaymentLink(id);
      await fetchData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete payment link');
      console.error(err);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await togglePaymentLink(id);
      await fetchData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to toggle payment link');
      console.error(err);
    }
  };

  const handleApproveDeposit = async (depositId: string) => {
    try {
      await approveDeposit(depositId);
      await fetchData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve deposit');
      console.error(err);
    }
  };

  const handleRejectDeposit = async (depositId: string) => {
    if (!window.confirm('Reject this deposit?')) return;
    try {
      await rejectDeposit(depositId);
      await fetchData();
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject deposit');
      console.error(err);
    }
  };

  return (
    <Container>
      <Header>
        <Title>Payment Management</Title>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      <TabsContainer>
        <Tab $active={activeTab === 'links'} onClick={() => setActiveTab('links')}>
          💳 Payment Links
        </Tab>
        <Tab $active={activeTab === 'deposits'} onClick={() => setActiveTab('deposits')}>
          💰 Deposits ({deposits.length})
        </Tab>
      </TabsContainer>

      {activeTab === 'links' ? (
        <>
          <SectionHeader>
            <div />
            <CreateButton onClick={() => setShowCreateForm(!showCreateForm)}>
              {showCreateForm ? 'Cancel' : '+ Create Link'}
            </CreateButton>
          </SectionHeader>

          {showCreateForm && (
            <FormCard>
              <FormTitle>{editingLink ? 'Edit Payment Link' : 'Create New Payment Link'}</FormTitle>
              <FormGrid>
                <FormGroup>
                  <Label>Link Name *</Label>
                  <Input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., Payment link 1"
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Payee VPA (UPI ID) *</Label>
                  <Input
                    type="text"
                    name="payeeVPA"
                    value={formData.payeeVPA}
                    onChange={handleInputChange}
                    placeholder="merchant@bank"
                    disabled={!!editingLink}
                  />
                </FormGroup>

                <FormGroup>
                  <Label>Payee Name *</Label>
                  <Input
                    type="text"
                    name="payeeName"
                    value={formData.payeeName}
                    onChange={handleInputChange}
                    placeholder="Merchant Name"
                  />
                </FormGroup>
              </FormGrid>

              <FormActions>
                <CancelButton onClick={resetForm}>Cancel</CancelButton>
                <SubmitButton onClick={editingLink ? handleUpdate : handleCreate}>
                  {editingLink ? 'Update Link' : 'Create Link'}
                </SubmitButton>
              </FormActions>
            </FormCard>
          )}

          <LinksSection>
            <SectionTitle>Active Payment Links ({paymentLinks.length})</SectionTitle>
            {loading ? (
              <LoadingMessage>Loading payment links...</LoadingMessage>
            ) : paymentLinks.length === 0 ? (
              <EmptyMessage>No payment links created yet.</EmptyMessage>
            ) : (
              <LinksList>
                {paymentLinks.map((link) => (
                  <LinkCard key={link.id} $active={link.active}>
                    <LinkHeader>
                      <LinkName>{link.name}</LinkName>
                      <StatusBadge $active={link.active}>{link.active ? 'Active' : 'Inactive'}</StatusBadge>
                    </LinkHeader>

                    <LinkDetails>
                      <DetailRow>
                        <DetailLabel>UPI ID:</DetailLabel>
                        <DetailValue>{link.payeeVPA}</DetailValue>
                      </DetailRow>
                      <DetailRow>
                        <DetailLabel>Payee:</DetailLabel>
                        <DetailValue>{link.payeeName}</DetailValue>
                      </DetailRow>
                      <DetailRow>
                        <DetailLabel>Deposits:</DetailLabel>
                        <DetailValue>{link._count?.deposits || 0}</DetailValue>
                      </DetailRow>
                    </LinkDetails>

                    <LinkActions>
                      <ActionButton onClick={() => handleEdit(link)}>Edit</ActionButton>
                      <ActionButton onClick={() => handleToggle(link.id)}>
                        {link.active ? 'Deactivate' : 'Activate'}
                      </ActionButton>
                      <DeleteButton onClick={() => handleDelete(link.id)}>Delete</DeleteButton>
                    </LinkActions>
                  </LinkCard>
                ))}
              </LinksList>
            )}
          </LinksSection>
        </>
      ) : (
        <>
          <FilterRow>
            <FilterSelect value={depositFilter} onChange={(e) => setDepositFilter(e.target.value as any)}>
              <option value="">All Deposits</option>
              <option value="PENDING">Pending</option>
              <option value="SCREENSHOT_UPLOADED">Awaiting Approval</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </FilterSelect>
          </FilterRow>

          <DepositsSection>
            <SectionTitle>Deposits ({deposits.length})</SectionTitle>
            {loading ? (
              <LoadingMessage>Loading deposits...</LoadingMessage>
            ) : deposits.length === 0 ? (
              <EmptyMessage>No deposits found.</EmptyMessage>
            ) : (
              <DepositsTable>
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Transaction ID</TableCell>
                    <TableCell>Link</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Screenshot</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {deposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>{deposit.user?.email}</TableCell>
                      <TableCell>₹{(deposit.amount / 100).toFixed(2)}</TableCell>
                      <TableCell>{deposit.transactionRef}</TableCell>
                      <TableCell>{deposit.paymentLink?.name}</TableCell>
                      <TableCell>
                        <StatusBadge $active={deposit.status === 'APPROVED'}>
                          {deposit.status}
                        </StatusBadge>
                      </TableCell>
                      <TableCell>
                        {deposit.screenshotUrl ? (
                          <ScreenshotLink href={deposit.screenshotUrl} target="_blank" rel="noreferrer">
                            View 📸
                          </ScreenshotLink>
                        ) : (
                          'No'
                        )}
                      </TableCell>
                      <TableCell>
                        {deposit.status === 'SCREENSHOT_UPLOADED' && (
                          <DepositActions>
                            <ApproveButton onClick={() => handleApproveDeposit(deposit.id)}>Approve</ApproveButton>
                            <RejectButton onClick={() => handleRejectDeposit(deposit.id)}>Reject</RejectButton>
                          </DepositActions>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </DepositsTable>
            )}
          </DepositsSection>
        </>
      )}
    </Container>
  );
};

const Container = styled.div`
  padding: 30px;
  max-width: 1400px;
  margin: 0 auto;
`;

const Header = styled.div`
  margin-bottom: 30px;
`;

const SectionHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
`;

const Title = styled.h1`
  font-size: 2rem;
  color: #333;
  margin: 0;
`;

const CreateButton = styled.button`
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
  }
`;

const TabsContainer = styled.div`
  display: flex;
  gap: 16px;
  margin-bottom: 30px;
  border-bottom: 2px solid #eee;
`;

const Tab = styled.button<{ $active: boolean }>`
  padding: 12px 24px;
  background: none;
  border: none;
  border-bottom: 3px solid ${(p) => (p.$active ? '#667eea' : 'transparent')};
  color: ${(p) => (p.$active ? '#667eea' : '#999')};
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    color: #667eea;
  }
`;

const ErrorMessage = styled.div`
  background-color: #ffe6e6;
  color: #d32f2f;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  border-left: 4px solid #d32f2f;
`;

const FormCard = styled.div`
  background: white;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const FormTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin: 0 0 20px 0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  font-weight: 600;
  color: #555;
  margin-bottom: 8px;
`;

const Input = styled.input`
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #667eea;
  }

  &:disabled {
    background-color: #f5f5f5;
    cursor: not-allowed;
  }
`;

const FormActions = styled.div`
  display: flex;
  gap: 12px;
  justify-content: flex-end;
`;

const CancelButton = styled.button`
  padding: 10px 24px;
  background: #f5f5f5;
  color: #666;
  border: 2px solid #ddd;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #e0e0e0;
  }
`;

const SubmitButton = styled.button`
  padding: 10px 24px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
`;

const LinksSection = styled.div`
  margin-top: 30px;
`;

const SectionTitle = styled.h2`
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 20px;
`;

const LoadingMessage = styled.div`
  text-align: center;
  padding: 40px;
  color: #999;
`;

const EmptyMessage = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  background: #f9f9f9;
  border-radius: 12px;
`;

const LinksList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
  gap: 20px;
`;

const LinkCard = styled.div<{ $active: boolean }>`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  border-left: 4px solid ${(p) => (p.$active ? '#4caf50' : '#f44336')};
`;

const LinkHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
`;

const LinkName = styled.h3`
  font-size: 1.2rem;
  color: #333;
  margin: 0;
`;

const StatusBadge = styled.span<{ $active?: boolean }>`
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${(p) => (p.$active ? '#e8f5e9' : '#ffebee')};
  color: ${(p) => (p.$active ? '#4caf50' : '#f44336')};
`;

const LinkDetails = styled.div`
  margin-bottom: 15px;
`;

const DetailRow = styled.div`
  display: flex;
  margin-bottom: 8px;
  font-size: 0.95rem;
`;

const DetailLabel = styled.span`
  font-weight: 600;
  color: #666;
  min-width: 100px;
`;

const DetailValue = styled.span`
  color: #333;
`;

const LinkActions = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
`;

const ActionButton = styled.button`
  padding: 8px 14px;
  background: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;

  &:hover {
    background: #e0e0e0;
  }
`;

const DeleteButton = styled(ActionButton)`
  color: #f44336;
  border-color: #f44336;

  &:hover {
    background: #ffebee;
  }
`;

// Deposits table styles
const FilterRow = styled.div`
  margin-bottom: 20px;
`;

const FilterSelect = styled.select`
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 1rem;

  &:focus {
    outline: none;
    border-color: #667eea;
  }
`;

const DepositsSection = styled.div``;

const DepositsTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const TableHead = styled.thead`
  background: #f5f5f5;
`;

const TableBody = styled.tbody``;

const TableRow = styled.tr`
  border-bottom: 1px solid #eee;

  &:last-child {
    border-bottom: none;
  }

  &:hover {
    background: #fafafa;
  }
`;

const TableCell = styled.td`
  padding: 12px 16px;
  text-align: left;
`;

const ScreenshotLink = styled.a`
  color: #667eea;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const DepositActions = styled.div`
  display: flex;
  gap: 8px;
`;

const ApproveButton = styled.button`
  padding: 6px 12px;
  background: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: #45a049;
  }
`;

const RejectButton = styled.button`
  padding: 6px 12px;
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  font-weight: 600;
  cursor: pointer;
  font-size: 0.9rem;

  &:hover {
    background: #da190b;
  }
`;

export default ManagePayment;
