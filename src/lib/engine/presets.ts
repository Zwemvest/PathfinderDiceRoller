import type { ModifierEntry } from './types';

// ─── Preset common PF2e modifiers ─────────────────────────────────────────────
// Source: PF2e CRB conditions + common table situations
//
// All presets ship with enabled=false — the UI layer activates them per roll.

export const PRESET_MODIFIERS: Readonly<ModifierEntry[]> = [
  // Combat positioning
  { id: 'flanking', label: 'Flanking', type: 'circumstance', value: 2, enabled: false },

  // Bard buffs
  { id: 'inspire-courage', label: 'Inspire Courage', type: 'status', value: 1, enabled: false },
  { id: 'inspire-heroism', label: 'Inspire Heroism', type: 'status', value: 2, enabled: false },

  // Frightened condition (status penalty)
  { id: 'frightened-1', label: 'Frightened 1', type: 'status', value: -1, enabled: false },
  { id: 'frightened-2', label: 'Frightened 2', type: 'status', value: -2, enabled: false },
  { id: 'frightened-3', label: 'Frightened 3', type: 'status', value: -3, enabled: false },

  // Sickened condition (status penalty)
  { id: 'sickened-1', label: 'Sickened 1', type: 'status', value: -1, enabled: false },

  // Clumsy condition (status penalty — affects AC and Reflex saves)
  { id: 'clumsy-1', label: 'Clumsy 1', type: 'status', value: -1, enabled: false },
  { id: 'clumsy-2', label: 'Clumsy 2', type: 'status', value: -2, enabled: false },
] as const;
