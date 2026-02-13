// js/ui/shared/modulators/ModulatorUIRegistry.js
// Central registry mapping modulator type → UI renderer.

import { MOD_TYPE } from '../../../modules/modulators/Modulator.js';
import { renderLfoUI } from './LfoUI.js';
import { renderEnvFollowUI } from './EnvFollowUI.js';
import { renderComparatorUI } from './ComparatorUI.js';
import { renderPhysicsUI } from './PhysicsUI.js';

const _uiMap = new Map([
    [MOD_TYPE.LFO, renderLfoUI],
    [MOD_TYPE.ENV_FOLLOW, renderEnvFollowUI],
    [MOD_TYPE.COMPARATOR, renderComparatorUI],
    [MOD_TYPE.PHYSICS, renderPhysicsUI],
]);

export function getModulatorUI(type) {
    return _uiMap.get(type) || renderLfoUI;
}

export function registerModulatorUI(type, renderFn) {
    _uiMap.set(type, renderFn);
}

/** Type labels for the selector buttons */
export const MOD_TYPE_LABELS = [
    { type: MOD_TYPE.LFO,         label: 'LFO', color: '#facc15' },
    { type: MOD_TYPE.ENV_FOLLOW,   label: 'ENV', color: '#34d399' },
    { type: MOD_TYPE.COMPARATOR,   label: 'CMP', color: '#f472b6' },
    { type: MOD_TYPE.PHYSICS,      label: 'PHY', color: '#60a5fa' },
];
