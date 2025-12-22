import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  OfferCodeDto,
  listOfferCodes,
  createOfferCode,
  activateOfferCode,
  deactivateOfferCode,
} from '../services/adminApi';

const OfferCodesManagement: React.FC = () => {
  const [offers, setOffers] = useState<OfferCodeDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    code: '',
    amount: 100,
    startsAt: '',
    endsAt: '',
    maxUsage: 100,
    active: true,
  });

  const loadOffers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await listOfferCodes();
      setOffers(res.offers);
    } catch (err) {
      setError('Failed to load offer codes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOffers();
  }, []);

  const handleInput = (field: keyof typeof form, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleCreate = async () => {
    setError('');
    setSuccess('');
    setFormLoading(true);
    try {
      await createOfferCode({
        code: form.code.trim().toUpperCase(),
        amount: Number(form.amount),
        startsAt: form.startsAt ? new Date(form.startsAt).toISOString() : undefined,
        endsAt: form.endsAt ? new Date(form.endsAt).toISOString() : undefined,
        maxUsage: form.maxUsage ? Number(form.maxUsage) : undefined,
        active: form.active,
      });
      setSuccess('Offer code created');
      setForm({ code: '', amount: 100, startsAt: '', endsAt: '', maxUsage: 100, active: true });
      await loadOffers();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to create offer code');
    } finally {
      setFormLoading(false);
    }
  };

  const toggleActive = async (code: string, active: boolean) => {
    setError('');
    try {
      if (active) {
        await deactivateOfferCode(code);
      } else {
        await activateOfferCode(code);
      }
      await loadOffers();
    } catch (err) {
      setError('Failed to update offer code status');
    }
  };

  return (
    <Container>
      <Header>
        <div>
          <Title>Manage Offer Codes</Title>
          <Subtitle>Create, schedule, and toggle promo codes.</Subtitle>
        </div>
        <RefreshButton onClick={loadOffers} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </RefreshButton>
      </Header>

      {error && <ErrorText>{error}</ErrorText>}
      {success && <SuccessText>{success}</SuccessText>}

      <Grid>
        <Card>
          <CardTitle>Create Offer Code</CardTitle>
          <FormRow>
            <Label>Code</Label>
            <Input
              value={form.code}
              onChange={(e) => handleInput('code', e.target.value)}
              placeholder="WELCOME100"
            />
          </FormRow>
          <FormRow>
            <Label>Amount</Label>
            <Input
              type="number"
              value={form.amount}
              onChange={(e) => handleInput('amount', Number(e.target.value))}
            />
          </FormRow>
          <FormRow>
            <Label>Starts At</Label>
            <Input
              type="datetime-local"
              value={form.startsAt}
              onChange={(e) => handleInput('startsAt', e.target.value)}
            />
          </FormRow>
          <FormRow>
            <Label>Ends At</Label>
            <Input
              type="datetime-local"
              value={form.endsAt}
              onChange={(e) => handleInput('endsAt', e.target.value)}
            />
          </FormRow>
          <FormRow>
            <Label>Max Usage</Label>
            <Input
              type="number"
              value={form.maxUsage}
              onChange={(e) => handleInput('maxUsage', Number(e.target.value))}
            />
          </FormRow>
          <ToggleRow>
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => handleInput('active', e.target.checked)}
            />
            <span>Active on creation</span>
          </ToggleRow>
          <CreateButton onClick={handleCreate} disabled={formLoading}>
            {formLoading ? 'Saving...' : 'Create Offer'}
          </CreateButton>
        </Card>

        <Card>
          <CardTitle>Offer Codes</CardTitle>
          {loading ? (
            <Muted>Loading...</Muted>
          ) : offers.length === 0 ? (
            <Muted>No offer codes yet.</Muted>
          ) : (
            <Table>
              <thead>
                <tr>
                  <th>Code</th>
                  <th>Amount</th>
                  <th>Usage</th>
                  <th>Window</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {offers.map((offer) => (
                  <tr key={offer.id}>
                    <td>{offer.code}</td>
                    <td>{offer.amount}</td>
                    <td>
                      {offer.usageCount}/{offer.maxUsage ?? '∞'}
                    </td>
                    <td>
                      <div>{offer.startsAt ? new Date(offer.startsAt).toLocaleString() : 'now'}</div>
                      <div>{offer.endsAt ? new Date(offer.endsAt).toLocaleString() : 'no end'}</div>
                    </td>
                    <td>
                      <StatusBadge $active={offer.active}>
                        {offer.active ? 'Active' : 'Inactive'}
                      </StatusBadge>
                    </td>
                    <td>
                      <ActionButton onClick={() => toggleActive(offer.code, offer.active)}>
                        {offer.active ? 'Deactivate' : 'Activate'}
                      </ActionButton>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </Card>
      </Grid>
    </Container>
  );
};

const Container = styled.div`
  padding: 30px;
  background: #f5f7fa;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.h1`
  margin: 0;
  color: #1e3c72;
`;

const Subtitle = styled.p`
  margin: 4px 0 0;
  color: #667eea;
`;

const RefreshButton = styled.button`
  padding: 10px 16px;
  background: #1e3c72;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
`;

const Card = styled.div`
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.08);
`;

const CardTitle = styled.h2`
  margin: 0 0 12px;
  color: #1e3c72;
`;

const FormRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
`;

const Label = styled.label`
  font-weight: 600;
  color: #1e3c72;
`;

const Input = styled.input`
  padding: 10px 12px;
  border: 1px solid #d0d7e2;
  border-radius: 8px;
`;

const ToggleRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 8px 0 12px;
`;

const CreateButton = styled.button`
  padding: 12px 14px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 700;
  width: 100%;
  cursor: pointer;
  transition: all 0.2s;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  &:hover:not(:disabled) {
    transform: translateY(-1px);
  }
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;

  th, td {
    padding: 10px;
    border-bottom: 1px solid #eee;
    text-align: left;
  }

  th {
    color: #1e3c72;
  }
`;

const StatusBadge = styled.span<{ $active: boolean }>`
  padding: 6px 10px;
  border-radius: 10px;
  background: ${(p) => (p.$active ? '#e0ffe0' : '#ffe0e0')};
  color: ${(p) => (p.$active ? '#2e7d32' : '#c33')};
  font-weight: 700;
`;

const ActionButton = styled.button`
  padding: 8px 12px;
  background: #1e3c72;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 700;
  transition: all 0.2s;

  &:hover {
    transform: translateY(-1px);
  }
`;

const ErrorText = styled.div`
  color: #c33;
`;

const SuccessText = styled.div`
  color: #2e7d32;
`;

const Muted = styled.div`
  color: #777;
`;

export default OfferCodesManagement;
