import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import {
  activateTheme,
  createTheme,
  deactivateTheme,
  deleteTheme,
  getAllThemes,
  updateTheme,
  uploadThemeAssets,
  uploadThemeSymbols,
  CreateThemeRequest,
  Theme,
  UpdateThemeRequest,
} from '../services/adminApi';

// Slot symbol typing kept local to keep UI resilient to backend changes
export type SymbolType = 'regular' | 'wild' | 'scatter' | 'jackpot' | 'bonus';

interface SlotSymbol {
  id: string;
  name: string;
  type: SymbolType;
  weight: number;
  paytable: number[];
  asset?: string;
}

interface Payline {
  id: number;
  positions: number[][];
}

interface BonusRules {
  freeSpins: number;
  multiplier: number;
  scatterTriggerCount: number;
}

interface JackpotRules {
  type: 'fixed' | 'progressive';
  value: number;
}

interface GridConfig {
  rows: number;
  columns: number;
}

interface SlotConfiguration {
  version: number;
  grid: GridConfig;
  symbols: SlotSymbol[];
  paylines: Payline[];
  bonusRules: BonusRules;
  jackpotRules: JackpotRules;
}

interface FormData {
  id?: string;
  name: string;
  themeId: string;
  configuration: SlotConfiguration;
  minBet: number;
  maxBet: number;
  jsonSchema?: unknown;
  assetManifest?: unknown;
}

interface ThemeAssetItem {
  key: string;
  label: string;
}

const defaultSymbols: SlotSymbol[] = [
  { id: 'A', name: 'Ace', type: 'regular', weight: 8, paytable: [5, 15, 40] },
  { id: 'K', name: 'King', type: 'regular', weight: 8, paytable: [5, 12, 35] },
  { id: 'Q', name: 'Queen', type: 'regular', weight: 9, paytable: [4, 10, 30] },
  { id: 'J', name: 'Jack', type: 'regular', weight: 9, paytable: [4, 8, 25] },
  { id: '10', name: 'Ten', type: 'regular', weight: 10, paytable: [3, 6, 20] },
  { id: '9', name: 'Nine', type: 'regular', weight: 10, paytable: [3, 5, 18] },
  { id: 'BROWN', name: 'Brown Gem', type: 'bonus', weight: 7, paytable: [8, 18, 45] },
  { id: 'LILY', name: 'Lily Gem', type: 'bonus', weight: 7, paytable: [8, 18, 45] },
  { id: 'PINK', name: 'Pink Gem', type: 'bonus', weight: 7, paytable: [9, 22, 55] },
  { id: 'RED', name: 'Red Gem', type: 'bonus', weight: 6, paytable: [10, 25, 60] },
  { id: 'WHITE', name: 'White Gem', type: 'bonus', weight: 6, paytable: [10, 25, 60] },
  { id: 'YELLOW', name: 'Yellow Gem', type: 'bonus', weight: 6, paytable: [12, 28, 65] },
  { id: 'GOLD', name: 'Gold Gem', type: 'bonus', weight: 5, paytable: [15, 35, 80] },
  { id: 'WILD', name: 'Wild Substitute', type: 'wild', weight: 6, paytable: [0, 0, 0] },
  { id: 'SCATTER', name: 'Scatter Bonus', type: 'scatter', weight: 5, paytable: [0, 0, 0] },
  { id: 'JACKPOT', name: 'Jackpot Crown', type: 'jackpot', weight: 12, paytable: [25, 60, 150] },
];

const defaultThemeAssets: ThemeAssetItem[] = [
  { key: 'balance', label: 'Balance' },
  { key: 'bkg', label: 'BKG (background)' },
  { key: 'button_hold_hover', label: 'Button Hold Hover' },
  { key: 'button_hold_normal', label: 'Button Hold Normal' },
  { key: 'button_info_hover', label: 'Button Info Hover' },
  { key: 'button_info_normal', label: 'Button Info Normal' },
  { key: 'button_menu_hover', label: 'Button Menu Hover' },
  { key: 'button_menu_normal', label: 'Button Menu Normal' },
  { key: 'button_rules_hover', label: 'Button Rules Hover' },
  { key: 'button_rules_normal', label: 'Button Rules Normal' },
  { key: 'button_settings_hover', label: 'Button Settings Hover' },
  { key: 'button_settings_normal', label: 'Button Settings Normal' },
  { key: 'button_spin_hover', label: 'Button Spin Hover' },
  { key: 'button_spin_normal', label: 'Button Spin Normal' },
  { key: 'lines_button', label: 'Lines Button' },
  { key: 'lines_label', label: 'Lines' },
  { key: 'minus_hover', label: 'Minus Hover' },
  { key: 'minus_normal', label: 'Minus Normal' },
  { key: 'plus_hover', label: 'Plus Hover' },
  { key: 'plus_normal', label: 'Plus Normal' },
  { key: 'progress_base', label: 'Progresbar Base' },
  { key: 'progress_empty', label: 'Progresbar Empty' },
  { key: 'progress_full', label: 'Progresbar Full' },
  { key: 'progress_mask', label: 'Progresbar Mask' },
  { key: 'progress_full_end', label: 'Progressbar Full End' },
  { key: 'reels_border', label: 'Reels Border' },
  { key: 'reels', label: 'Reels' },
  { key: 'total_bet', label: 'Total Bet' },
  { key: 'win_line_dot', label: 'Win Line Dot' },
  { key: 'your_win', label: 'Your Win' },
];

const defaultPaylines: Payline[] = [
  { id: 1, positions: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]] },
  { id: 2, positions: [[0, 1], [1, 1], [2, 1], [3, 1], [4, 1]] },
  { id: 3, positions: [[0, 2], [1, 2], [2, 2], [3, 2], [4, 2]] },
  { id: 4, positions: [[0, 0], [1, 1], [2, 2], [3, 1], [4, 0]] },
  { id: 5, positions: [[0, 2], [1, 1], [2, 0], [3, 1], [4, 2]] },
];

const defaultConfiguration: SlotConfiguration = {
  version: 1,
  grid: { rows: 3, columns: 5 },
  symbols: defaultSymbols,
  paylines: defaultPaylines,
  bonusRules: { freeSpins: 5, multiplier: 2, scatterTriggerCount: 3 },
  jackpotRules: { type: 'fixed', value: 1000 },
};

const ensureConfiguration = (config?: Partial<SlotConfiguration>): SlotConfiguration => ({
  version: config?.version ?? 1,
  grid: {
    rows: config?.grid?.rows ?? 3,
    columns: config?.grid?.columns ?? 5,
  },
  symbols: config?.symbols && config.symbols.length > 0 ? config.symbols : defaultSymbols,
  paylines: config?.paylines ?? [],
  bonusRules: {
    freeSpins: config?.bonusRules?.freeSpins ?? 0,
    multiplier: config?.bonusRules?.multiplier ?? 1,
    scatterTriggerCount: config?.bonusRules?.scatterTriggerCount ?? 3,
  },
  jackpotRules: {
    type: config?.jackpotRules?.type ?? 'fixed',
    value: config?.jackpotRules?.value ?? 0,
  },
});

const ThemeCRUD: React.FC = () => {
  const [themes, setThemes] = useState<Theme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [groupByType, setGroupByType] = useState(false);
  const [symbolFiles, setSymbolFiles] = useState<Map<string, File>>(new Map());
  const [themeAssetFiles, setThemeAssetFiles] = useState<Record<string, File | null>>(
    () => Object.fromEntries(defaultThemeAssets.map((a) => [a.key, null])) as Record<string, File | null>
  );
  const [formData, setFormData] = useState<FormData>({
    name: '',
    themeId: '',
    configuration: defaultConfiguration,
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

  const resetForm = () => {
    setFormData({
      name: '',
      themeId: '',
      configuration: defaultConfiguration,
      minBet: 10,
      maxBet: 1000,
    });
    setEditingId(null);
    setSymbolFiles(new Map());
    setThemeAssetFiles(Object.fromEntries(defaultThemeAssets.map((a) => [a.key, null])) as Record<string, File | null>);
    setShowForm(false);
  };

  const handleSymbolFileChange = (index: number, file: File | null) => {
    const symbol = formData.configuration.symbols[index];
    const next = new Map(symbolFiles);
    if (file) {
      next.set(symbol.id, file);
    } else {
      next.delete(symbol.id);
    }
    setSymbolFiles(next);
    setFormData((prev) => {
      const symbols = [...prev.configuration.symbols];
      symbols[index] = { ...symbols[index], asset: file ? file.name : symbols[index].asset };
      return { ...prev, configuration: { ...prev.configuration, symbols } };
    });
  };

  const updateSymbol = <K extends keyof SlotSymbol>(index: number, field: K, value: SlotSymbol[K]) => {
    setFormData((prev) => {
      const symbols = [...prev.configuration.symbols];
      symbols[index] = { ...symbols[index], [field]: value } as SlotSymbol;
      return { ...prev, configuration: { ...prev.configuration, symbols } };
    });
  };

  const addSymbol = () => {
    setFormData((prev) => {
      const template = defaultSymbols[prev.configuration.symbols.length % defaultSymbols.length];
      const clone: SlotSymbol = { ...template, id: `${template.id}_${prev.configuration.symbols.length + 1}` };
      const nextSymbols = [...prev.configuration.symbols, clone];
      return { ...prev, configuration: { ...prev.configuration, symbols: nextSymbols } };
    });
  };

  const removeSymbol = (index: number) => {
    setFormData((prev) => {
      const nextSymbols = prev.configuration.symbols.filter((_, i) => i !== index);
      return { ...prev, configuration: { ...prev.configuration, symbols: nextSymbols } };
    });
  };

  const addPayline = () => {
    setFormData((prev) => {
      const cols = prev.configuration.grid.columns;
      const defaultPositions = Array.from({ length: cols }, (_, c) => [c, 0]);
      const nextPaylines = [...prev.configuration.paylines, { id: prev.configuration.paylines.length + 1, positions: defaultPositions }];
      return { ...prev, configuration: { ...prev.configuration, paylines: nextPaylines } };
    });
  };

  const updatePayline = (index: number, positions: number[][]) => {
    setFormData((prev) => {
      const paylines = [...prev.configuration.paylines];
      paylines[index] = { ...paylines[index], positions };
      return { ...prev, configuration: { ...prev.configuration, paylines } };
    });
  };

  const removePayline = (index: number) => {
    setFormData((prev) => {
      const paylines = prev.configuration.paylines.filter((_, i) => i !== index);
      return { ...prev, configuration: { ...prev.configuration, paylines } };
    });
  };

  const handleCreateOrUpdate = async () => {
    if (!formData.name.trim()) {
      setError('Theme name is required');
      return;
    }

    if (!formData.themeId.trim()) {
      setError('Theme ID is required');
      return;
    }

    if (formData.configuration.symbols.length < 3) {
      setError('At least 3 symbols are required');
      return;
    }

    if (formData.configuration.paylines.length < 1) {
      setError('At least 1 payline is required');
      return;
    }

    setLoading(true);
    setError('');
    try {
      // Prepare payload with all required strict schema fields
      const payload: CreateThemeRequest = {
        name: formData.name,
        themeId: formData.themeId,
        configuration: {
          ...formData.configuration,
          themeId: formData.themeId,
          name: formData.name,
        },
        minBet: formData.minBet,
        maxBet: formData.maxBet,
      };

      let themeId: string;
      if (editingId) {
        const result = await updateTheme(editingId, payload as UpdateThemeRequest);
        themeId = editingId;
        console.log('Theme updated:', result);
      } else {
        const result = await createTheme(payload);
        themeId = result.theme?.id || formData.themeId;
        console.log('Theme created:', result);
      }

      // Upload symbol files if any are selected
      if (symbolFiles.size > 0) {
        console.log(`Uploading ${symbolFiles.size} symbol file(s) for theme ${themeId}...`);
        try {
          const symbolsRecord = Object.fromEntries(symbolFiles);
          const uploadResult = await uploadThemeSymbols(themeId, symbolsRecord);
          console.log('Symbol upload successful:', uploadResult.data);
        } catch (uploadErr: any) {
          console.error('Symbol upload failed:', uploadErr);
          setError(`Theme saved but symbol upload failed: ${uploadErr.response?.data?.error || uploadErr.message}`);
          // Still reload themes and keep form open for retry
          await loadThemes();
          return;
        }
      }

      // Upload theme assets if any are selected
      const selectedAssets = Object.entries(themeAssetFiles).filter(([_, file]) => file !== null);
      if (selectedAssets.length > 0) {
        console.log(`Uploading ${selectedAssets.length} theme asset(s)...`);
        try {
          await uploadThemeAssets(themeId, themeAssetFiles);
          console.log('Theme assets uploaded successfully');
        } catch (assetErr: any) {
          console.warn('Theme asset upload warning:', assetErr.message);
          // Continue even if assets fail
        }
      }

      await loadThemes();
      resetForm();
    } catch (err: any) {
      console.error('Theme save error:', err);
      setError(err.response?.data?.error || err.message || 'Failed to save theme');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (theme: Theme) => {
    const configFromTheme = ensureConfiguration((theme as any).configuration);
    setFormData({
      id: theme.id,
      name: theme.name,
      themeId: (theme as any).themeId || theme.id,
      configuration: configFromTheme,
      minBet: (theme as any).minBet ?? 10,
      maxBet: (theme as any).maxBet ?? 1000,
    });
    setEditingId(theme.id);
    setShowForm(true);
    setGroupByType(false);
    setSymbolFiles(new Map());
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this theme?')) return;
    setLoading(true);
    try {
      await deleteTheme(id);
      await loadThemes();
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
    } catch (err: any) {
      setError(err.message || 'Failed to update theme status');
    } finally {
      setLoading(false);
    }
  };

  const handleThemeAssetFileChange = (key: string, file: File | null) => {
    setThemeAssetFiles((prev) => ({ ...prev, [key]: file }));
  };

  const renderSymbolCard = (symbol: SlotSymbol, idx: number) => {
    const borderColor = symbol.type === 'wild' ? '#ff9800' : symbol.type === 'scatter' ? '#2196f3' : symbol.type === 'jackpot' ? '#e91e63' : symbol.type === 'bonus' ? '#4caf50' : '#ddd';
    const badgeBg = symbol.type === 'wild' ? '#ff9800' : symbol.type === 'scatter' ? '#2196f3' : symbol.type === 'jackpot' ? '#e91e63' : symbol.type === 'bonus' ? '#4caf50' : '#666';
    const cardBg = symbol.type === 'wild' ? '#fff9e6' : symbol.type === 'scatter' ? '#e6f7ff' : symbol.type === 'jackpot' ? '#ffe6f0' : symbol.type === 'bonus' ? '#f1f8e9' : 'white';

    const totalWeight = formData.configuration.symbols.reduce((sum, s) => sum + s.weight, 0);
    const percentage = totalWeight > 0 ? ((symbol.weight / totalWeight) * 100).toFixed(1) : '0';

    return (
      <div
        key={idx}
        style={{
          border: `2px solid ${borderColor}`,
          padding: '15px',
          marginBottom: '10px',
          borderRadius: '8px',
          background: cardBg,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: badgeBg,
            color: 'white',
            padding: '4px 10px',
            borderRadius: '12px',
            fontSize: '11px',
            fontWeight: 'bold',
          }}
        >
          {symbol.type === 'wild'
            ? '🎰 WILD'
            : symbol.type === 'scatter'
              ? '✨ SCATTER'
              : symbol.type === 'jackpot'
                ? '💎 JACKPOT'
                : symbol.type === 'bonus'
                  ? '⭐ BONUS'
                  : '🎴 REGULAR'}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr 1fr', gap: '12px', marginBottom: '12px' }}>
          <div>
            <Label>Symbol ID</Label>
            <Input
              value={symbol.id}
              onChange={(e) => updateSymbol(idx, 'id', e.target.value)}
              placeholder="e.g., A"
            />
          </div>
          <div>
            <Label>Name</Label>
            <Input
              value={symbol.name}
              onChange={(e) => updateSymbol(idx, 'name', e.target.value)}
              placeholder="e.g., Ace"
            />
          </div>
          <div>
            <Label>Symbol Icon (PNG)</Label>
            <Input
              type="file"
              accept="image/png"
              onChange={(e) => handleSymbolFileChange(idx, e.target.files?.[0] || null)}
            />
            {symbolFiles.has(symbol.id) && (
              <small style={{ color: '#28a745', display: 'block', marginTop: '5px' }}>
                ✓ {symbolFiles.get(symbol.id)?.name}
              </small>
            )}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 0.8fr 1.2fr', gap: '12px', marginBottom: '10px', alignItems: 'flex-end' }}>
          <div>
            <Label>Type</Label>
            <select
              value={symbol.type}
              onChange={(e) => updateSymbol(idx, 'type', e.target.value as SymbolType)}
              style={{
                padding: '10px',
                border: '1px solid #ddd',
                borderRadius: '8px',
                fontSize: '1rem',
                width: '100%',
              }}
            >
              <option value="regular">Regular</option>
              <option value="wild">Wild (Substitute)</option>
              <option value="scatter">Scatter (Bonus)</option>
              <option value="jackpot">Jackpot</option>
              <option value="bonus">Bonus/Premium</option>
            </select>
          </div>
          <div>
            <Label>Weight</Label>
            <Input
              type="number"
              value={symbol.weight}
              onChange={(e) => updateSymbol(idx, 'weight', parseInt(e.target.value) || 0)}
              min="1"
            />
          </div>
          <div>
            <Label>Paytable (3, 4, 5 matches)</Label>
            <Input
              value={symbol.paytable.join(', ')}
              onChange={(e) =>
                updateSymbol(
                  idx,
                  'paytable',
                  e.target.value
                    .split(',')
                    .map((v) => parseInt(v.trim()))
                    .filter((v) => !isNaN(v))
                )
              }
              placeholder="e.g., 10, 50, 250"
            />
            <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
              Payout for 3/4/5 matching symbols on a payline
            </small>
          </div>
        </div>

        <div
          style={{
            background: '#f8f9fa',
            padding: '10px',
            borderRadius: '6px',
            marginTop: '10px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div>
            <small style={{ color: '#666' }}>Appearance Probability:</small>
            <strong style={{ marginLeft: '8px', color: '#333', fontSize: '14px' }}>
              {`${percentage}% (${symbol.weight}/${totalWeight})`}
            </strong>
          </div>
          {symbol.asset && <small style={{ color: '#666' }}>📁 {symbol.asset}</small>}
        </div>

        <SmallButton onClick={() => removeSymbol(idx)} style={{ marginTop: '10px', background: '#ff4444', color: 'white' }}>
          Remove Symbol
        </SmallButton>
      </div>
    );
  };

  return (
    <Container>
      <Header>
        <Title>Theme Management</Title>
        <CreateButton
          onClick={() => {
            setShowForm(true);
            setEditingId(null);
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
            {/* Basic Info */}
            <FormGroup>
              <Label>Theme Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Classic Gold"
              />
            </FormGroup>

            <FormGroup>
              <Label>Theme ID</Label>
              <Input
                value={formData.themeId}
                onChange={(e) => setFormData({ ...formData, themeId: e.target.value })}
                placeholder="e.g., test-classic-001"
              />
            </FormGroup>

            <FormGroup>
              <Label>Version</Label>
              <Input
                type="number"
                value={formData.configuration.version}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    configuration: { ...formData.configuration, version: parseInt(e.target.value) || 1 },
                  })
                }
                min="1"
              />
            </FormGroup>

            {/* Grid Configuration */}
            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label>Grid Configuration</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <Label>Rows</Label>
                  <Input
                    type="number"
                    value={formData.configuration.grid.rows}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          grid: { ...formData.configuration.grid, rows: parseInt(e.target.value) || 0 },
                        },
                      })
                    }
                    min="1"
                  />
                </div>
                <div>
                  <Label>Columns</Label>
                  <Input
                    type="number"
                    value={formData.configuration.grid.columns}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          grid: { ...formData.configuration.grid, columns: parseInt(e.target.value) || 0 },
                        },
                      })
                    }
                    min="1"
                  />
                </div>
              </div>
            </FormGroup>

            {/* Theme Asset Placeholders */}
            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label>Theme Assets</Label>
              <div style={{ background: '#f8faff', padding: '12px', borderRadius: '8px', border: '1px solid #e4ecf7', marginBottom: '10px' }}>
                <small style={{ color: '#555' }}>Upload PNG assets for the main UI elements.</small>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '12px' }}>
                {defaultThemeAssets.map((asset) => (
                  <div key={asset.key} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px' }}>
                    <Label>{asset.label}</Label>
                    <Input
                      type="file"
                      accept="image/png,image/*"
                      onChange={(e) => handleThemeAssetFileChange(asset.key, e.target.files?.[0] || null)}
                    />
                    {themeAssetFiles[asset.key] && (
                      <small style={{ color: '#28a745', display: 'block', marginTop: '5px' }}>
                        ✓ {themeAssetFiles[asset.key]?.name}
                      </small>
                    )}
                  </div>
                ))}
              </div>
            </FormGroup>

            {/* Symbols */}
            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <Label>Symbols ({formData.configuration.symbols.length})</Label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <SmallButton
                    onClick={() => setGroupByType(!groupByType)}
                    style={{ background: groupByType ? '#667eea' : '#eef', color: groupByType ? 'white' : '#333' }}
                  >
                    {groupByType ? '📊 Grouped' : '📋 List View'}
                  </SmallButton>
                  <SmallButton onClick={addSymbol}>+ Add Symbol</SmallButton>
                </div>
              </div>

              <div style={{ background: '#f0f8ff', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', lineHeight: '1.6' }}>
                <strong>📋 Symbol Types Explained:</strong>
                <div style={{ marginTop: '8px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <strong style={{ color: '#333' }}>🎴 Regular:</strong> Standard symbols (cards, fruits, etc.)
                  </div>
                  <div>
                    <strong style={{ color: '#ff9800' }}>🎰 Wild:</strong> Substitutes for any regular symbol
                  </div>
                  <div>
                    <strong style={{ color: '#2196f3' }}>✨ Scatter:</strong> Triggers free spins/bonus rounds
                  </div>
                  <div>
                    <strong style={{ color: '#e91e63' }}>💎 Jackpot:</strong> Triggers jackpot wins
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <strong style={{ color: '#4caf50' }}>⭐ Bonus/Premium:</strong> High-value symbols with special rewards
                  </div>
                </div>
              </div>

              <div style={{ background: '#fff3cd', padding: '10px', borderRadius: '6px', marginBottom: '15px', fontSize: '12px' }}>
                <strong>💡 Recommended:</strong> Include at least 1 Wild symbol and 1 Scatter symbol for engaging gameplay. Higher weight = more frequent appearance.
              </div>

              {(() => {
                const typeCounts = formData.configuration.symbols.reduce((acc, s) => {
                  acc[s.type] = (acc[s.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>);
                const totalWeight = formData.configuration.symbols.reduce((sum, s) => sum + s.weight, 0);

                return (
                  <div
                    style={{
                      background: '#e8f5e9',
                      padding: '10px',
                      borderRadius: '6px',
                      marginBottom: '15px',
                      fontSize: '12px',
                      display: 'flex',
                      gap: '15px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <strong>Symbol Summary:</strong>
                    <span>Regular: {typeCounts.regular || 0}</span>
                    <span style={{ color: '#ff9800', fontWeight: 'bold' }}>Wild: {typeCounts.wild || 0}</span>
                    <span style={{ color: '#2196f3', fontWeight: 'bold' }}>Scatter: {typeCounts.scatter || 0}</span>
                    <span style={{ color: '#e91e63', fontWeight: 'bold' }}>Jackpot: {typeCounts.jackpot || 0}</span>
                    <span>Bonus: {typeCounts.bonus || 0}</span>
                  </div>
                );
              })()}

              {symbolFiles.size > 0 && (
                <div
                  style={{
                    background: '#d4edda',
                    border: '1px solid #28a745',
                    padding: '12px',
                    borderRadius: '6px',
                    marginBottom: '15px',
                    fontSize: '13px',
                  }}
                >
                  <strong style={{ color: '#155724' }}>📁 Symbol Files Queued for Upload ({symbolFiles.size}):</strong>
                  <ul style={{ margin: '8px 0 0 20px', color: '#155724' }}>
                    {Array.from(symbolFiles.entries()).map(([symbolId, file]) => (
                      <li key={symbolId}>
                        <strong>{symbolId}</strong> → {file.name} ({(file.size / 1024).toFixed(1)} KB)
                      </li>
                    ))}
                  </ul>
                  <small style={{ color: '#155724', marginTop: '8px', display: 'block' }}>
                    ✓ These files will be uploaded to <code>/theme/&lt;theme_name&gt;/symbols/</code> after the theme is saved.
                  </small>
                </div>
              )}

              {(() => {
                if (!groupByType) {
                  return formData.configuration.symbols.map((symbol, idx) => renderSymbolCard(symbol, idx));
                }

                const grouped = formData.configuration.symbols.reduce((acc, symbol, idx) => {
                  if (!acc[symbol.type]) acc[symbol.type] = [];
                  acc[symbol.type].push({ symbol, idx });
                  return acc;
                }, {} as Record<SymbolType, Array<{ symbol: SlotSymbol; idx: number }>>);

                const typeOrder: SymbolType[] = ['regular', 'bonus', 'wild', 'scatter', 'jackpot'];
                const typeLabels: Record<SymbolType, string> = {
                  regular: '🎴 Regular Symbols',
                  wild: '🎰 Wild Symbols',
                  scatter: '✨ Scatter Symbols',
                  jackpot: '💎 Jackpot Symbols',
                  bonus: '⭐ Bonus/Premium Symbols',
                };

                return typeOrder.map((type) => {
                  if (!grouped[type]) return null;
                  return (
                    <div key={type} style={{ marginBottom: '20px' }}>
                      <h4
                        style={{
                          margin: '15px 0 10px 0',
                          color: '#333',
                          borderBottom: '2px solid #e0e0e0',
                          paddingBottom: '8px',
                        }}
                      >
                        {typeLabels[type]} ({grouped[type].length})
                      </h4>
                      {grouped[type].map(({ symbol, idx }) => renderSymbolCard(symbol, idx))}
                    </div>
                  );
                });
              })()}
            </FormGroup>

            {/* Paylines */}
            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <Label>Paylines</Label>
                <SmallButton onClick={addPayline}>+ Add Payline</SmallButton>
              </div>

              <div
                style={{ background: '#f0f8ff', padding: '12px', borderRadius: '6px', marginBottom: '15px', fontSize: '13px', lineHeight: '1.6' }}
              >
                <strong>ℹ️ What are Paylines?</strong>
                <p style={{ margin: '8px 0 0 0', color: '#555' }}>
                  Paylines are the patterns where matching symbols must land to win. Each payline connects positions across the reels from left to right.
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#555' }}>
                  <strong>Format:</strong> [[column, row], [column, row], ...]
                  <br />• <strong>Column</strong> = Reel number (0 to 4 for 5 reels)
                  <br />• <strong>Row</strong> = Position in reel (0 to 5 for 6 rows)
                </p>
                <p style={{ margin: '8px 0 0 0', color: '#555' }}>
                  <strong>Examples:</strong>
                  <br />• Top row: <code>[[0,0], [1,0], [2,0], [3,0], [4,0]]</code>
                  <br />• Middle row: <code>[[0,2], [1,2], [2,2], [3,2], [4,2]]</code>
                  <br />• V-shape: <code>[[0,0], [1,1], [2,2], [3,1], [4,0]]</code>
                </p>
              </div>

              {formData.configuration.paylines.map((payline, idx) => (
                <div key={payline.id} style={{ border: '1px solid #ddd', padding: '15px', marginBottom: '10px', borderRadius: '8px' }}>
                  <div style={{ marginBottom: '10px' }}>
                    <Label>Payline ID: {payline.id}</Label>
                  </div>
                  <div>
                    <Label>Positions (Pattern across the reels)</Label>
                    <Input
                      value={JSON.stringify(payline.positions)}
                      onChange={(e) => {
                        try {
                          const parsed = JSON.parse(e.target.value);
                          updatePayline(idx, parsed);
                        } catch (_) {
                          // ignore invalid JSON while typing
                        }
                      }}
                      placeholder="[[0,0], [1,0], [2,0], [3,0], [4,0]]"
                    />
                    <small style={{ color: '#666', display: 'block', marginTop: '5px' }}>
                      Example: [[0,0], [1,0], [2,0], [3,0], [4,0]] = straight line across top row
                    </small>
                  </div>
                  <SmallButton onClick={() => removePayline(idx)} style={{ marginTop: '10px', background: '#ff4444', color: 'white' }}>
                    Remove Payline
                  </SmallButton>
                </div>
              ))}
            </FormGroup>

            {/* Bonus Rules */}
            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label>Bonus Rules</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div>
                  <Label>Free Spins</Label>
                  <Input
                    type="number"
                    value={formData.configuration.bonusRules.freeSpins}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          bonusRules: {
                            ...formData.configuration.bonusRules,
                            freeSpins: parseInt(e.target.value) || 0,
                          },
                        },
                      })
                    }
                    min="0"
                  />
                </div>
                <div>
                  <Label>Multiplier</Label>
                  <Input
                    type="number"
                    value={formData.configuration.bonusRules.multiplier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          bonusRules: {
                            ...formData.configuration.bonusRules,
                            multiplier: parseFloat(e.target.value) || 1,
                          },
                        },
                      })
                    }
                    min="1"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label>Scatter Trigger Count</Label>
                  <Input
                    type="number"
                    value={formData.configuration.bonusRules.scatterTriggerCount}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          bonusRules: {
                            ...formData.configuration.bonusRules,
                            scatterTriggerCount: parseInt(e.target.value) || 0,
                          },
                        },
                      })
                    }
                    min="1"
                  />
                </div>
              </div>
            </FormGroup>

            {/* Jackpot Rules */}
            <FormGroup style={{ gridColumn: '1 / -1' }}>
              <Label>Jackpot Rules</Label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <Label>Type</Label>
                  <select
                    value={formData.configuration.jackpotRules.type}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          jackpotRules: { ...formData.configuration.jackpotRules, type: e.target.value as 'fixed' | 'progressive' },
                        },
                      })
                    }
                    style={{
                      padding: '12px',
                      border: '2px solid #e2e8f0',
                      borderRadius: '8px',
                      fontSize: '14px',
                      width: '100%',
                    }}
                  >
                    <option value="fixed">Fixed</option>
                    <option value="progressive">Progressive</option>
                  </select>
                </div>
                <div>
                  <Label>Value</Label>
                  <Input
                    type="number"
                    value={formData.configuration.jackpotRules.value}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        configuration: {
                          ...formData.configuration,
                          jackpotRules: { ...formData.configuration.jackpotRules, value: parseInt(e.target.value) || 0 },
                        },
                      })
                    }
                    min="0"
                  />
                </div>
              </div>
            </FormGroup>

            {/* Betting Limits */}
            <FormGroup>
              <Label>Minimum Bet</Label>
              <Input
                type="number"
                value={formData.minBet}
                onChange={(e) => setFormData({ ...formData, minBet: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </FormGroup>

            <FormGroup>
              <Label>Maximum Bet</Label>
              <Input
                type="number"
                value={formData.maxBet}
                onChange={(e) => setFormData({ ...formData, maxBet: parseInt(e.target.value) || 0 })}
                min="1"
              />
            </FormGroup>

            <FormActions>
              <SaveButton onClick={handleCreateOrUpdate} disabled={loading}>
                {loading ? 'Saving...' : 'Save Theme'}
              </SaveButton>
              <CancelButton onClick={resetForm} disabled={loading}>
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
                  <StatusBadge $status={(theme as any).status || 'DRAFT'}>{(theme as any).status || 'DRAFT'}</StatusBadge>
                </TableCell>
                <TableCell>${(theme as any).minBet ?? '-'}</TableCell>
                <TableCell>${(theme as any).maxBet ?? '-'}</TableCell>
                <TableCell>v{((theme as any).configuration?.version ?? (theme as any).version ?? 1) as number}</TableCell>
                <TableCell>
                  <ActionButtons>
                    <ActionButton onClick={() => handleEdit(theme)} title="Edit">
                      ✏️
                    </ActionButton>
                    <ActionButton
                      onClick={() => handleToggleStatus(theme)}
                      title={(theme as any).status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                    >
                      {(theme as any).status === 'ACTIVE' ? '⏸️' : '▶️'}
                    </ActionButton>
                    <ActionButton onClick={() => handleDelete(theme.id)} title="Delete" danger>
                      🗑️
                    </ActionButton>
                  </ActionButtons>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {themes.length === 0 && !loading && <EmptyState>No themes found. Create your first theme to get started!</EmptyState>}
      </TableContainer>
    </Container>
  );
};

/* Styled components */
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
  width: 100%;
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

export default ThemeCRUD;
