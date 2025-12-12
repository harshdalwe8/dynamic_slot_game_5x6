import Ajv, { JSONSchemaType } from 'ajv';

const ajv = new Ajv();

export interface ThemeJsonSchema {
  themeId: string;
  name: string;
  version: number;
  grid: {
    rows: number;
    columns: number;
  };
  symbols: Array<{
    id: string;
    name: string;
    asset: string;
    weight: number;
    paytable: number[];
  }>;
  paylines: Array<{
    id: string;
    positions: number[][];
  }>;
  bonusRules: {
    scatterTriggerCount: number;
    freeSpins: number;
    multiplier: number;
  };
  jackpotRules: {
    type: 'fixed' | 'progressive';
    value: number;
  };
}

// JSON Schema for theme validation
const themeSchema: any = {
  type: 'object',
  properties: {
    themeId: { type: 'string', minLength: 1 },
    name: { type: 'string', minLength: 1 },
    version: { type: 'number', minimum: 1 },
    grid: {
      type: 'object',
      properties: {
        rows: { type: 'number', minimum: 3, maximum: 10 },
        columns: { type: 'number', minimum: 3, maximum: 10 },
      },
      required: ['rows', 'columns'],
    },
    symbols: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', minLength: 1 },
          name: { type: 'string', minLength: 1 },
          asset: { type: 'string', minLength: 1 },
          weight: { type: 'number', minimum: 1 },
          paytable: {
            type: 'array',
            items: { type: 'number', minimum: 0 },
            minItems: 1,
          },
        },
        required: ['id', 'name', 'asset', 'weight', 'paytable'],
      },
      minItems: 3,
    },
    paylines: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { oneOf: [{ type: 'string' }, { type: 'number' }] },
          positions: {
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'number' },
              minItems: 2,
              maxItems: 2,
            },
            minItems: 3,
          },
        },
        required: ['id', 'positions'],
      },
      minItems: 1,
    },
    bonusRules: {
      type: 'object',
      properties: {
        scatterTriggerCount: { type: 'number', minimum: 2 },
        freeSpins: { type: 'number', minimum: 0 },
        multiplier: { type: 'number', minimum: 1 },
      },
      required: ['scatterTriggerCount', 'freeSpins', 'multiplier'],
    },
    jackpotRules: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['fixed', 'progressive'] },
        value: { type: 'number', minimum: 0 },
      },
      required: ['type', 'value'],
    },
  },
  required: ['themeId', 'name', 'version', 'grid', 'symbols', 'paylines', 'bonusRules', 'jackpotRules'],
};

const validate = ajv.compile(themeSchema);

/**
 * Validate theme JSON against schema
 * Supports both strict schema (grid, symbols, paylines, etc.) and UI manifest format (components, base_path)
 */
export function validateThemeJson(themeJson: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!themeJson || typeof themeJson !== 'object') {
    return { valid: false, errors: ['Theme JSON must be an object'] };
  }

  // Check if this is the UI manifest format (components + base_path)
  if (Array.isArray(themeJson.components) && typeof themeJson.base_path === 'string') {
    // UI manifest format: just validate basic structure
    if (!themeJson.theme_id || typeof themeJson.theme_id !== 'string') {
      errors.push('Theme manifest must have a "theme_id" string');
    }
    if (!themeJson.theme_name || typeof themeJson.theme_name !== 'string') {
      errors.push('Theme manifest must have a "theme_name" string');
    }
    if (!Array.isArray(themeJson.components) || themeJson.components.length === 0) {
      errors.push('Theme manifest must have a non-empty "components" array');
    }
    // Validate each component
    for (const comp of themeJson.components) {
      if (!comp.placeholder || typeof comp.placeholder !== 'string') {
        errors.push('Each component must have a "placeholder" string');
      }
      if (!comp.file_name || typeof comp.file_name !== 'string') {
        errors.push('Each component must have a "file_name" string');
      }
    }
    return { valid: errors.length === 0, errors };
  }

  // Strict schema format (grid, symbols, paylines, etc.)
  const valid = validate(themeJson);

  if (!valid && validate.errors) {
    const schemaErrors = validate.errors.map(
      (err) => `${err.instancePath} ${err.message}`
    );
    return { valid: false, errors: schemaErrors };
  }

  // Additional business logic validation for strict format
  if (Array.isArray(themeJson.symbols)) {
    for (const symbol of themeJson.symbols) {
      if (symbol.asset && (symbol.asset.includes('..') || symbol.asset.includes('/') || symbol.asset.includes('\\'))) {
        errors.push(`Symbol ${symbol.id}: Invalid asset filename`);
      }
    }
  }

  if (Array.isArray(themeJson.paylines) && themeJson.grid) {
    for (const payline of themeJson.paylines) {
      for (const position of payline.positions) {
        if (position[0] >= themeJson.grid.columns || position[1] >= themeJson.grid.rows) {
          errors.push(`Payline ${payline.id}: Position out of grid bounds`);
        }
      }
    }
  }

  if (Array.isArray(themeJson.symbols)) {
    const totalWeight = themeJson.symbols.reduce((sum: number, s: any) => sum + (s.weight || 0), 0);
    if (totalWeight === 0) {
      errors.push('Total symbol weights must be greater than 0');
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate asset manifest
 */
export function validateAssetManifest(assetManifest: any): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!assetManifest || typeof assetManifest !== 'object') {
    return { valid: false, errors: ['Asset manifest must be an object'] };
  }

  // New default shape: { base_path: string, components: [{ placeholder, file_name, url }] }
  if (Array.isArray(assetManifest.components)) {
    for (const comp of assetManifest.components) {
      if (!comp || typeof comp !== 'object') {
        errors.push('Invalid component entry in asset manifest');
        continue;
      }
      if (typeof comp.placeholder !== 'string' || comp.placeholder.length === 0) {
        errors.push('Component must have a non-empty "placeholder" string');
      }
      if (typeof comp.file_name !== 'string' || comp.file_name.length === 0) {
        errors.push('Component must have a non-empty "file_name" string');
      }
      if (comp.url && typeof comp.url !== 'string') {
        errors.push('Component "url" must be a string when present');
      }
      // Prevent path traversal in file_name
      if (typeof comp.file_name === 'string' && (comp.file_name.includes('..') || comp.file_name.includes('/') || comp.file_name.includes('\\'))) {
        errors.push(`Invalid component file_name: ${comp.file_name}`);
      }
    }
    return { valid: errors.length === 0, errors };
  }

  // Legacy shape: { assets: [string | object] }
  if (Array.isArray(assetManifest.assets)) {
    for (const asset of assetManifest.assets) {
      if (!asset) {
        errors.push('Invalid asset entry');
        continue;
      }
      // allow either string filenames or object entries with filename/originalName
      if (typeof asset === 'string') {
        if (asset.length === 0) errors.push('Invalid asset filename');
        if (asset.includes('..') || asset.includes('/') || asset.includes('\\')) {
          errors.push(`Invalid asset filename: ${asset}`);
        }
      } else if (typeof asset === 'object') {
        const filename = asset.filename || asset.originalName || asset.file_name;
        if (!filename || typeof filename !== 'string') {
          errors.push('Asset object missing filename');
        } else if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
          errors.push(`Invalid asset filename: ${filename}`);
        }
      } else {
        errors.push('Invalid asset entry type');
      }
    }
    return { valid: errors.length === 0, errors };
  }

  return { valid: false, errors: ['Asset manifest must contain either "components" or "assets" array'] };
}
