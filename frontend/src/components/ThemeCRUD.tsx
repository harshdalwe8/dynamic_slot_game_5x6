import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import {
  getAllThemes,
  createTheme,
  updateTheme,
  activateTheme,
  deactivateTheme,
  deleteTheme,
  Theme,
  CreateThemeRequest,
  UpdateThemeRequest,
} from '../services/adminApi';

interface FormData extends CreateThemeRequest {
  id?: string;
}

const ThemeCRUD: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    configuration: {},
    minBet: 10,
    maxBet: 1000,
  });

  useEffect(() => {
    loadThemes();
  }, []);

  const loadThemes = async () => {
    setLoading(true);
    try {
      const data = await getAllThemes();
      setThemes(data.themes || []);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to load themes');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('Theme name is required');
      return;
    }

    setLoading(true);
    try {
      const payload: CreateThemeRequest = {
        name: formData.name,
        configuration: formData.configuration || {},
        minBet: formData.minBet,
        maxBet: formData.maxBet,
      };

      if (editingId) {
        await updateTheme(editingId, payload as UpdateThemeRequest);
      } else {
        await createTheme(payload);
      }

      await loadThemes();
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', configuration: {}, minBet: 10, maxBet: 1000 });
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to save theme');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (theme: Theme) => {
    setEditingId(theme.id);
    setFormData({
      id: theme.id,
      name: theme.name,
      configuration: theme.configuration || {},
      minBet: theme.minBet,
      maxBet: theme.maxBet,
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) return;

    setLoading(true);
    try {
      await deleteTheme(id);
      await loadThemes();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to delete theme');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (theme: Theme) => {
    setLoading(true);
    try {
      if (theme.status === 'ACTIVE') {
        await deactivateTheme(theme.id);
      } else {
        await activateTheme(theme.id);
      }
      await loadThemes();
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to update theme status');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingId(null);
    setFormData({ name: '', configuration: {}, minBet: 10, maxBet: 1000 });
  };

  return (
    <Container>
      <Header>
        <Title>Theme Management</Title>
        <CreateButton onClick={() => setShowForm(true)} disabled={loading}>
          ➕ Create Theme
        </CreateButton>
      </Header>

      {error && <ErrorMessage>{error}</ErrorMessage>}

      {showForm && (
        <FormContainer>
          <FormTitle>{editingId ? 'Edit Theme' : 'Create New Theme'}</FormTitle>
          <Form>
            <FormGroup>
              <Label>Theme Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Ancient Egypt"
              />
            </FormGroup>

            <FormGroup>
              <Label>Minimum Bet</Label>
              <Input
                type="number"
                value={formData.minBet}
                onChange={(e) => setFormData({ ...formData, minBet: parseInt(e.target.value) })}
                min="1"
              />
            </FormGroup>

            <FormGroup>
              <Label>Maximum Bet</Label>
              <Input
                type="number"
                value={formData.maxBet}
                onChange={(e) => setFormData({ ...formData, maxBet: parseInt(e.target.value) })}
                min="1"
              />
            </FormGroup>

            <FormActions>
              <SaveButton onClick={handleCreate} disabled={loading}>
                {loading ? 'Saving...' : 'Save Theme'}
              </SaveButton>
              <CancelButton onClick={handleCancel} disabled={loading}>
                Cancel
              </CancelButton>
            </FormActions>
          </Form>
        </FormContainer>
      )}

      <TableContainer>
        {loading && !showForm ? <LoadingSpinner>Loading themes...</LoadingSpinner> : null}

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Theme Name</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Min Bet</TableCell>
              <TableCell>Max Bet</TableCell>
              <TableCell>Version</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {themes.map((theme) => (
              <TableRow key={theme.id}>
                <TableCell>{theme.name}</TableCell>
                <TableCell>
                  <StatusBadge $status={theme.status}>{theme.status}</StatusBadge>
                </TableCell>
                <TableCell>${theme.minBet}</TableCell>
                <TableCell>${theme.maxBet}</TableCell>
                <TableCell>v{theme.version}</TableCell>
                <TableCell>
                  <ActionButtons>
                    <ActionButton onClick={() => handleEdit(theme)} title="Edit">
                      ✏️
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleToggleStatus(theme)}
                      title={theme.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      {theme.status === 'ACTIVE' ? '⏸️' : '▶️'}
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleDelete(theme.id)}
                      title="Delete"
                      danger
                    >
                      🗑️
                    </ActionButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {themes.length === 0 && !loading && (
          <EmptyState>No themes found. Create your first theme to get started!</EmptyState>
        )}
      </TableContainer>
    </Container>
  );
};

const Container = styled.div`
  padding: 30px;
  background: white;
  border-radius: 15px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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

const CreateButton = styled.button`
  padding: 10px 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(102, 126, 234, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background: #fee;
  border: 1px solid #f88;
  color: #c33;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-weight: 500;
`;

const FormContainer = styled.div`
  background: #f8f9fa;
  border: 2px solid #e8ecf1;
  border-radius: 12px;
  padding: 25px;
  margin-bottom: 30px;
`;

const FormTitle = styled.h3`
  margin: 0 0 20px 0;
  color: #1e3c72;
`;

const Form = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
`;

const Label = styled.label`
  color: #333;
  font-weight: 600;
  margin-bottom: 8px;
  font-size: 0.9rem;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
  transition: all 0.3s;

  &:focus {
    outline: none;
    border-color: #667eea;
    box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  }
`;

const FormActions = styled.div`
  grid-column: 1 / -1;
  display: flex;
  gap: 10px;
  margin-top: 10px;
`;

const SaveButton = styled.button`
  padding: 12px 24px;
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.3s;

  &:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(67, 233, 123, 0.4);
  }

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

const CancelButton = styled.button`
  padding: 12px 24px;
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

  &:first-child {
    font-weight: 600;
    color: #1e3c72;
  }
`;

const StatusBadge = styled.span<{ $status: string }>`
  display: inline-block;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 0.85rem;
  font-weight: 600;
  background: ${(props) =>
    props.$status === 'ACTIVE'
      ? '#d4edda'
      : props.$status === 'DRAFT'
      ? '#fff3cd'
      : '#f8d7da'};
  color: ${(props) =>
    props.$status === 'ACTIVE'
      ? '#155724'
      : props.$status === 'DRAFT'
      ? '#856404'
      : '#721c24'};
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 8px;
`;

const ActionButton = styled.button<{ danger?: boolean }>`
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: none;
  background: ${(props) => (props.danger ? '#fee' : '#eef')};
  cursor: pointer;
  font-size: 1.2rem;
  transition: all 0.3s;

  &:hover {
    background: ${(props) => (props.danger ? '#fcc' : '#ccf')};
    transform: scale(1.1);
  }
`;

const LoadingSpinner = styled.div`
  text-align: center;
  padding: 40px;
  color: #666;
  font-size: 1.1rem;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 1.1rem;
`;

export default ThemeCRUD;
