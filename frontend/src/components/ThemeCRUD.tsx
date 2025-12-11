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

interface ManifestComponent {
  placeholder: string;
  file_name: string;
  url: string;
}

interface Manifest {
  theme_name: string;
  theme_id: string;
  base_path: string;
  components: ManifestComponent[];
}

interface ComponentState extends ManifestComponent {
  file?: File | null;
}

const DEFAULT_MANIFEST: Manifest = {
  theme_name: 'Aqua Slot',
  theme_id: 'aqua_slot_001',
  base_path: 'themes/aqua-slot/game-screen/png-gui/',
  components: [
    { placeholder: 'ui.balance', file_name: 'Balance.png', url: 'themes/aqua-slot/game-screen/png-gui/Balance.png' },
    { placeholder: 'background.main', file_name: 'BKG.png', url: 'themes/aqua-slot/game-screen/png-gui/BKG.png' },
    { placeholder: 'button.hold.hover', file_name: 'Button Hold Hover.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Hold Hover.png' },
    { placeholder: 'button.hold.normal', file_name: 'Button Hold Normal.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Hold Normal.png' },
    { placeholder: 'button.info.hover', file_name: 'Button Info Hover.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Info Hover.png' },
    { placeholder: 'button.info.normal', file_name: 'Button Info Normal.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Info Normal.png' },
    { placeholder: 'button.menu.hover', file_name: 'Button Menu Hover.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Menu Hover.png' },
    { placeholder: 'button.menu.normal', file_name: 'Button Menu Normal.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Menu Normal.png' },
    { placeholder: 'button.rules.hover', file_name: 'Button Rules Hover.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Rules Hover.png' },
    { placeholder: 'button.rules.normal', file_name: 'Button Rules Normal.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Rules Normal.png' },
    { placeholder: 'button.settings.hover', file_name: 'Button Settings Hover.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Settings Hover.png' },
    { placeholder: 'button.settings.normal', file_name: 'Button Settings Normal.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Settings Normal.png' },
    { placeholder: 'button.spin.hover', file_name: 'Button Spin Hover.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Spin Hover.png' },
    { placeholder: 'button.spin.normal', file_name: 'Button Spin Normal.png', url: 'themes/aqua-slot/game-screen/png-gui/Button Spin Normal.png' },
    { placeholder: 'button.lines', file_name: 'Lines Button.png', url: 'themes/aqua-slot/game-screen/png-gui/Lines Button.png' },
    { placeholder: 'label.lines', file_name: 'Lines.png', url: 'themes/aqua-slot/game-screen/png-gui/Lines.png' },
    { placeholder: 'button.minus.hover', file_name: 'Minus Hover.png', url: 'themes/aqua-slot/game-screen/png-gui/Minus Hover.png' },
    { placeholder: 'button.minus.normal', file_name: 'Minus Normal.png', url: 'themes/aqua-slot/game-screen/png-gui/Minus Normal.png' },
    { placeholder: 'button.plus.hover', file_name: 'Plus Hover.png', url: 'themes/aqua-slot/game-screen/png-gui/Plus Hover.png' },
    { placeholder: 'button.plus.normal', file_name: 'Plus Normal.png', url: 'themes/aqua-slot/game-screen/png-gui/Plus Normal.png' },
    { placeholder: 'progress.base', file_name: 'Progresbar Base.png', url: 'themes/aqua-slot/game-screen/png-gui/Progresbar Base.png' },
    { placeholder: 'progress.empty', file_name: 'Progresbar Empty.png', url: 'themes/aqua-slot/game-screen/png-gui/Progresbar Empty.png' },
    { placeholder: 'progress.full', file_name: 'Progresbar Full.png', url: 'themes/aqua-slot/game-screen/png-gui/Progresbar Full.png' },
    { placeholder: 'progress.mask', file_name: 'Progresbar Mask.png', url: 'themes/aqua-slot/game-screen/png-gui/Progresbar Mask.png' },
    { placeholder: 'progress.full_end', file_name: 'Progressbar Full End.png', url: 'themes/aqua-slot/game-screen/png-gui/Progressbar Full End.png' },
    { placeholder: 'reels.border', file_name: 'Reels Border.png', url: 'themes/aqua-slot/game-screen/png-gui/Reels Border.png' },
    { placeholder: 'reels.background', file_name: 'Reels.png', url: 'themes/aqua-slot/game-screen/png-gui/Reels.png' },
    { placeholder: 'label.total_bet', file_name: 'Total Bet.png', url: 'themes/aqua-slot/game-screen/png-gui/Total Bet.png' },
    { placeholder: 'win.line_dot', file_name: 'Win Line Dot.png', url: 'themes/aqua-slot/game-screen/png-gui/Win Line Dot.png' },
    { placeholder: 'label.your_win', file_name: 'Your Win.png', url: 'themes/aqua-slot/game-screen/png-gui/Your Win.png' },
  ],
};

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
  
  const [themeIdInput, setThemeIdInput] = useState('');
  const [basePathInput, setBasePathInput] = useState(DEFAULT_MANIFEST.base_path || '');
  // the list of selected asset files (both from "bulk upload" and per-placeholder inputs)
  const [assetFiles, setAssetFiles] = useState<File[]>([]);
  // componentsState is the editable list derived from manifest.components
  const [componentsState, setComponentsState] = useState<ComponentState[]>([]);

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

  // Load default manifest into componentsState (call when creating new theme)
  const loadManifestToForm = (manifest?: Manifest) => {
    const m = manifest || DEFAULT_MANIFEST;
    setThemeIdInput(m.theme_id || '');
    setBasePathInput(m.base_path || '');
    const compState = m.components.map((c) => ({ ...c, file: null }));
    setComponentsState(compState);
  };

  useEffect(() => {
    // When user opens the create form, pre-load default manifest placeholders
    if (showForm && !editingId && componentsState.length === 0) {
      loadManifestToForm();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showForm]);

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      setError('Theme name is required');
      return;
    }

    setLoading(true);
    try {
      if (editingId) {
        const payload: UpdateThemeRequest = {
          name: formData.name,
          configuration: formData.configuration || {},
          minBet: formData.minBet,
          maxBet: formData.maxBet,
        };
        await updateTheme(editingId, payload);
      } else {
        // Build manifest from componentsState
        const themeId = themeIdInput || `${formData.name.toLowerCase().replace(/\s+/g, '_')}`;
        const basePath = basePathInput || '';

        const components: ManifestComponent[] = componentsState.map((c) => {
          const outputFileName = c.file ? c.file.name : c.file_name;
          return {
            placeholder: c.placeholder,
            file_name: outputFileName,
            url: `${basePath}${encodeURIComponent(outputFileName)}`,
          };
        });

        const manifest: Manifest = {
          theme_name: formData.name,
          theme_id: themeId,
          base_path: basePath,
          components,
        };

        const blob = new Blob([JSON.stringify(manifest, null, 2)], { type: 'application/json' });
        const file = new File([blob], `${themeId}.json`, { type: 'application/json' });

        const res = await createTheme({
          name: formData.name,
          jsonSchema: manifest,
          assetManifest: { base_path: basePath, components },
        } as any);
        const createdThemeId = res?.theme?.id || res?.id || themeId;

        // collect files to upload: any componentState.file plus global assetFiles
        const filesToUpload: File[] = [
          ...assetFiles,
          ...componentsState.filter((c) => c.file).map((c) => c.file!) // non-null asserted because filtered
        ];

        if (filesToUpload.length > 0) {
          // uploadThemeAssets is dynamically imported earlier in your code when used
          const api = await import('../services/adminApi');
          if (api.uploadThemeAssets) {
            await api.uploadThemeAssets(createdThemeId, filesToUpload);
          } else {
            console.warn('uploadThemeAssets not found in adminApi');
          }
        }
      }

      await loadThemes();
      // reset form
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', configuration: {}, minBet: 10, maxBet: 1000 });
      setThemeIdInput('');
      setBasePathInput(DEFAULT_MANIFEST.base_path || '');
      setAssetFiles([]);
      setComponentsState([]);
      setError('');
    } catch (err: any) {
      setError(err.message || 'Failed to save theme');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = async (theme: Theme) => {
    // load theme details (basic) -- if you have theme manifest endpoint you could fetch it and populate componentsState
    setEditingId(theme.id);
    setFormData({
      id: theme.id,
      name: theme.name,
      configuration: theme.configuration || {},
      minBet: theme.minBet,
      maxBet: theme.maxBet,
    });

    // If the theme contains a stored manifest as part of the theme object (common pattern), use it.
    // Otherwise, load placeholders from DEFAULT_MANIFEST and let admin replace files manually.
    const manifest: Manifest | undefined = (theme as any).manifest;
    if (manifest) {
      setThemeIdInput(manifest.theme_id || theme.id);
      setBasePathInput(manifest.base_path || DEFAULT_MANIFEST.base_path);
      setComponentsState(manifest.components.map((c) => ({ ...c, file: null })));
    } else {
      // fallback to default manifest placeholders but try to preserve theme id
      loadManifestToForm();
      setThemeIdInput(theme.id);
    }

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
    setComponentsState([]);
    setAssetFiles([]);
    setThemeIdInput('');
    setBasePathInput(DEFAULT_MANIFEST.base_path || '');
    setError('');
  };


  // update per-placeholder file
  const handlePlaceholderFileChange = (index: number, f: File | null) => {
    setComponentsState((prev) => {
      const next = [...prev];
      const item = { ...next[index] } as ComponentState;
      item.file = f;
      // if a new file chosen, update file_name for immediate preview/manifest building if desired
      if (f) item.file_name = f.name;
      next[index] = item;
      return next;
    });
  };

  // bulk asset input (files not tied to placeholders)
  const handleBulkAssetFiles = (files: FileList | null) => {
    setAssetFiles(files ? Array.from(files) : []);
  };

  return (
    <Container>
      <Header>
        <Title>Theme Management</Title>
        <CreateButton
          onClick={() => {
            setShowForm(true);
            // pre-load manifest if not loaded
            if (componentsState.length === 0) loadManifestToForm();
          }}
          disabled={loading}
        >
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
              <Label>Theme ID</Label>
              <Input
                value={themeIdInput}
                onChange={(e) => setThemeIdInput(e.target.value)}
                placeholder="unique_theme_id_001"
              />
            </FormGroup>

            <FormGroup>
              <Label>Base Path</Label>
              <Input
                value={basePathInput}
                onChange={(e) => setBasePathInput(e.target.value)}
                placeholder="themes/aqua-slot/game-screen/png-gui/"
              />
            </FormGroup>

            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label>Bulk Upload Asset Files (optional)</Label>
              <Input
                type="file"
                multiple
                onChange={(e) => handleBulkAssetFiles(e.target.files)}
                accept="image/*"
              />
              <small style={{ color: '#666' }}>
                These files will be uploaded in addition to per-placeholder files. For placeholders, use the table below.
              </small>
            </FormGroup>

            {/* Per-placeholder inputs */}
            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label>Placeholders (select file for each placeholder)</Label>
              <PlaceholderTable>
                <thead>
                  <tr>
                    <th>Placeholder</th>
                    <th>Current File Name</th>
                    <th>Upload Replacement</th>
                    <th>Preview</th>
                  </tr>
                </thead>
                <tbody>
                  {componentsState.map((c, idx) => (
                    <tr key={c.placeholder}>
                      <td style={{ width: '35%' }}>
                        <small style={{ color: '#333' }}>{c.placeholder}</small>
                      </td>
                      <td>
                        <small>{c.file ? c.file.name : c.file_name}</small>
                      </td>
                      <td>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handlePlaceholderFileChange(idx, e.target.files ? e.target.files[0] : null)}
                        />
                      </td>
                      <td>
                        {c.file ? (
                          <small>{c.file.name}</small>
                        ) : (
                          <small style={{ color: '#888' }}>{c.url.split('/').pop()}</small>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </PlaceholderTable>

              <div style={{ marginTop: 8 }}>
                <SmallButton
                  onClick={() => {
                    // Reload default manifest into placeholder list
                    loadManifestToForm(DEFAULT_MANIFEST);
                  }}
                >
                  Load Default Manifest Placeholders
                </SmallButton>
              </div>
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

/* Styled components (kept from original) */
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

const SmallButton = styled.button`
  padding: 8px 12px;
  margin-top: 8px;
  background: #eef;
  border: 1px solid #dde;
  border-radius: 8px;
  cursor: pointer;
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

const PlaceholderTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: white;
  border: 1px solid #e8ecf1;
  border-radius: 8px;
  overflow: hidden;

  thead {
    background: #f1f5f9;
  }

  th, td {
    padding: 10px;
    text-align: left;
    border-bottom: 1px solid #eef2f7;
    font-size: 0.9rem;
  }

  tbody tr:last-child td {
    border-bottom: none;
  }
`;

export default ThemeCRUD;
