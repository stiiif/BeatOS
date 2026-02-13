// js/modules/modulators/Modulator.js
// Base class for all modulator types. Defines the contract that all consumers rely on.

export const MOD_TYPE = { LFO: 0, ENV_FOLLOW: 1, COMPARATOR: 2, PHYSICS: 3 };
export const PHYSICS_MODE = { BOUNCE: 0, PENDULUM: 1, SPRING: 2 };
export const COMP_MODE = { DIFFERENCE: 0, MULTIPLY: 1, GATE: 2, MIN: 3, MAX: 4, XOR: 5 };

// Registry populated by each subclass when it loads
const _registry = new Map();

export class Modulator {
    constructor(type = MOD_TYPE.LFO) {
        this.type = type;
        this.amount = 0.0;
        this.targets = [];
        this.target = null;
    }

    /** Core contract — returns bipolar float (-amount..+amount). */
    getValue(time, bpm = 120, context = null) { return 0; }

    /** Raw value before amount scaling — used by Comparator. */
    getRawValue(time, bpm = 120, context = null) { return 0; }

    getType() { return this.type; }

    serialize() {
        return {
            type: this.type,
            amount: this.amount,
            targets: [...this.targets],
            target: this.target
        };
    }

    /** Register a modulator subclass in the factory */
    static register(type, cls) {
        _registry.set(type, cls);
    }

    /** Create a new modulator of the given type */
    static create(type) {
        const Cls = _registry.get(type);
        if (Cls) return new Cls();
        // Fallback to LFO
        const LfoCls = _registry.get(MOD_TYPE.LFO);
        return LfoCls ? new LfoCls() : new Modulator(MOD_TYPE.LFO);
    }

    /** Deserialize from saved data */
    static deserialize(data) {
        if (!data) return Modulator.create(MOD_TYPE.LFO);
        const type = data.type !== undefined ? data.type : MOD_TYPE.LFO;
        const Cls = _registry.get(type);
        if (Cls && Cls.fromData) return Cls.fromData(data);
        const mod = Modulator.create(type);
        if (data.amount !== undefined) mod.amount = data.amount;
        if (data.targets) mod.targets = [...data.targets];
        if (data.target !== undefined) mod.target = data.target;
        return mod;
    }

    /** Add a new modulator to an array. Returns true if added. */
    static addModulator(arr, maxCount = 8) {
        if (arr.length >= maxCount) return false;
        arr.push(Modulator.create(MOD_TYPE.LFO));
        return true;
    }

    /** Remove the last modulator from an array. Returns true if removed. Min 1. */
    static removeModulator(arr) {
        if (arr.length <= 1) return false;
        arr.pop();
        return true;
    }
}
