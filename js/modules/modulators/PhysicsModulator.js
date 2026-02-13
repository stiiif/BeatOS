// js/modules/modulators/PhysicsModulator.js

import { Modulator, MOD_TYPE, PHYSICS_MODE } from './Modulator.js';
import { LFO } from './LFO.js';

export class PhysicsModulator extends Modulator {
    constructor() {
        super(MOD_TYPE.PHYSICS);
        this.physics = PHYSICS_MODE.BOUNCE;
        this.gravity = 1.0;         // 0.1 - 10
        this.damping = 0.5;         // 0 - 0.99
        this.trigger = 'loop';      // 'loop', 'bar', 'free'
        this.triggerSync = 9;       // SYNC_RATES index for 'free' mode
        this.initial = 1.0;         // Starting height/displacement (0-1)

        // Internal simulation state
        this._position = 1.0;
        this._velocity = 0;
        this._lastTime = 0;
        this._lastResetStep = -1;
        this._needsReset = true;
    }

    _reset() {
        this._velocity = 0;
        switch (this.physics) {
            case PHYSICS_MODE.BOUNCE:
                this._position = this.initial;
                break;
            case PHYSICS_MODE.PENDULUM:
                this._position = this.initial * Math.PI * 0.5; // angle in radians
                break;
            case PHYSICS_MODE.SPRING:
                this._position = this.initial;
                break;
        }
    }

    _checkTrigger(time, bpm, context) {
        if (this._needsReset) {
            this._needsReset = false;
            this._reset();
            return;
        }

        const stepIndex = context?.stepIndex;

        if (this.trigger === 'loop' && stepIndex === 0 && this._lastResetStep !== 0) {
            this._lastResetStep = 0;
            this._reset();
        } else if (this.trigger === 'bar' && stepIndex !== undefined && stepIndex % 16 === 0 && this._lastResetStep !== stepIndex) {
            this._lastResetStep = stepIndex;
            this._reset();
        } else if (this.trigger === 'free') {
            // Use sync rate to determine period
            const rates = LFO.SYNC_RATES;
            const idx = Math.min(this.triggerSync, rates.length - 1);
            const periodBeats = rates[idx].beats;
            const periodSec = periodBeats * 60 / bpm;
            const cyclePos = (time % periodSec) / periodSec;
            // Reset at the start of each cycle
            if (cyclePos < 0.02 && this._lastResetStep !== Math.floor(time / periodSec)) {
                this._lastResetStep = Math.floor(time / periodSec);
                this._reset();
            }
        }

        if (stepIndex !== undefined && stepIndex !== 0) {
            this._lastResetStep = stepIndex;
        }
    }

    _simulate(dt) {
        const g = this.gravity * 9.81;
        const damp = this.damping;

        switch (this.physics) {
            case PHYSICS_MODE.BOUNCE: {
                this._velocity += g * dt;
                this._position -= this._velocity * dt;
                if (this._position <= 0) {
                    this._position = 0;
                    this._velocity = -this._velocity * (1 - damp);
                    if (Math.abs(this._velocity) < 0.01) this._velocity = 0;
                }
                return Math.max(0, Math.min(1, this._position));
            }
            case PHYSICS_MODE.PENDULUM: {
                const accel = -g * Math.sin(this._position);
                this._velocity += accel * dt;
                this._velocity *= (1 - damp * dt);
                this._position += this._velocity * dt;
                // Normalize output: position is angle, output is sin(angle) → -1..1
                return Math.sin(this._position);
            }
            case PHYSICS_MODE.SPRING: {
                const stiffness = g * 2;
                const force = -stiffness * this._position - damp * 5 * this._velocity;
                this._velocity += force * dt;
                this._position += this._velocity * dt;
                // Clamp to -1..1
                return Math.max(-1, Math.min(1, this._position));
            }
        }
        return 0;
    }

    getRawValue(time, bpm = 120, context = null) {
        this._checkTrigger(time, bpm, context);

        const dt = Math.max(0.001, Math.min(0.1, time - this._lastTime));
        this._lastTime = time;

        const raw = this._simulate(dt);

        // Bounce outputs 0-1 (unipolar), convert to bipolar
        if (this.physics === PHYSICS_MODE.BOUNCE) {
            return raw * 2 - 1;
        }
        // Pendulum and Spring already bipolar
        return raw;
    }

    getValue(time, bpm = 120, context = null) {
        if (this.amount === 0) return 0;
        return this.getRawValue(time, bpm, context) * this.amount;
    }

    serialize() {
        return {
            ...super.serialize(),
            physics: this.physics,
            gravity: this.gravity,
            damping: this.damping,
            trigger: this.trigger,
            triggerSync: this.triggerSync,
            initial: this.initial
        };
    }

    static fromData(data) {
        const p = new PhysicsModulator();
        if (!data) return p;
        if (data.amount !== undefined) p.amount = data.amount;
        if (data.targets) p.targets = [...data.targets];
        if (data.target !== undefined) p.target = data.target;
        if (data.physics !== undefined) p.physics = data.physics;
        if (data.gravity !== undefined) p.gravity = data.gravity;
        if (data.damping !== undefined) p.damping = data.damping;
        if (data.trigger !== undefined) p.trigger = data.trigger;
        if (data.triggerSync !== undefined) p.triggerSync = data.triggerSync;
        if (data.initial !== undefined) p.initial = data.initial;
        return p;
    }
}

Modulator.register(MOD_TYPE.PHYSICS, PhysicsModulator);
