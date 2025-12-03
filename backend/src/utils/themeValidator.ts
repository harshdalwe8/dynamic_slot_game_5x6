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
          id: { type: 'string', minLength: 1 },
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
 */
export function validateThemeJson(themeJson: any): {
  valid: boolean;
  errors: string[];
} {
  const valid = validate(themeJson);

  if (!valid && validate.errors) {
    const errors = validate.errors.map(
      (err) => `${err.instancePath} ${err.message}`
    );
    return { valid: false, errors };
  }

  // Additional business logic validation
  const customErrors: string[] = [];

  // Validate that asset filenames don't contain path traversal
  for (const symbol of themeJson.symbols) {
    if (symbol.asset.includes('..') || symbol.asset.includes('/') || symbol.asset.includes('\\')) {
      customErrors.push(`Symbol ${symbol.id}: Invalid asset filename`);
    }
  }

  // Validate payline positions are within grid bounds
  for (const payline of themeJson.paylines) {
    for (const position of payline.positions) {
      if (position[0] >= themeJson.grid.columns || position[1] >= themeJson.grid.rows) {
        customErrors.push(`Payline ${payline.id}: Position out of grid bounds`);
      }
    }
  }

  // Validate symbol weights sum to reasonable total
  const totalWeight = themeJson.symbols.reduce((sum: number, s: any) => sum + s.weight, 0);
  if (totalWeight === 0) {
    customErrors.push('Total symbol weights must be greater than 0');
  }

  if (customErrors.length > 0) {
    return { valid: false, errors: customErrors };
  }

  return { valid: true, errors: [] };
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

  if (!Array.isArray(assetManifest.assets)) {
    return { valid: false, errors: ['Asset manifest must have an "assets" array'] };
  }

  // Validate each asset filename
  for (const asset of assetManifest.assets) {
    if (typeof asset !== 'string' || asset.length === 0) {
      errors.push('Invalid asset filename');
    }
    if (asset.includes('..') || asset.includes('/') || asset.includes('\\')) {
      errors.push(`Invalid asset filename: ${asset}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
