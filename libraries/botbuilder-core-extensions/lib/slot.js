"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
class Slot {
    constructor(frame, nameOrDefinition, defaultValue) {
        this.frame = frame;
        this.definition = typeof nameOrDefinition === 'string' ? { name: nameOrDefinition, defaultValue: defaultValue } : nameOrDefinition;
    }
    get(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const v = yield this.loadValue(context);
            return v ? v.value : undefined;
        });
    }
    has(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const v = yield this.loadValue(context);
            return v !== undefined;
        });
    }
    asReadOnly() {
        return {
            get: (context) => __awaiter(this, void 0, void 0, function* () {
                const v = yield this.cloneValue(context);
                return v ? v.value : undefined;
            }),
            has: (context) => __awaiter(this, void 0, void 0, function* () {
                return yield this.has(context);
            }),
            history: (context) => __awaiter(this, void 0, void 0, function* () {
                const v = yield this.cloneValue(context);
                return v ? v.history : [];
            })
        };
    }
    delete(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield this.frame.load(context, true);
            const { name } = this.definition;
            if (state && state.hasOwnProperty(name)) {
                delete state[name];
            }
        });
    }
    history(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const v = yield this.loadValue(context);
            return v ? v.history : [];
        });
    }
    set(context, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = yield this.frame.load(context, true);
            if (state) {
                const now = new Date();
                const { name, history, changeTags } = this.definition;
                let v = state.hasOwnProperty(name) ? state[name] : undefined;
                if (v) {
                    // Promote current value to history
                    if (history && history.maxCount > 0) {
                        v.history.push({
                            value: v.value,
                            timestamp: now.toISOString()
                        });
                    }
                    // Update slots current value
                    v.value = value;
                }
                else {
                    // Initialize slots value
                    v = { value: value, history: [], lastAccess: now.toISOString() };
                    state[name] = v;
                }
                // Signal value change
                if (changeTags && changeTags.length > 0) {
                    yield this.frame.slotValueChanged(context, changeTags, value);
                }
            }
        });
    }
    loadValue(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const state = this.frame.load(context, true);
            let v;
            if (state) {
                // Check for existing value and that it's not expired. 
                const now = new Date();
                const { name, expireAfterSeconds, history, defaultValue } = this.definition;
                if (state.hasOwnProperty(name)) {
                    v = state[name];
                    // Check for expiration of whole slot
                    const lastAccess = new Date(v.lastAccess);
                    if (typeof expireAfterSeconds === 'number' && now.getTime() > (lastAccess.getTime() + (expireAfterSeconds * 1000))) {
                        delete state[name];
                        v = undefined;
                    }
                    else {
                        v.lastAccess = now.toISOString();
                        // Purge expired history values
                        if (history && typeof history.expireAfterSeconds === 'number') {
                            v.history = v.history.filter((hv) => {
                                const timestamp = new Date(hv.timestamp);
                                if (now.getTime() < (timestamp.getTime() + (expireAfterSeconds * 1000))) {
                                    return hv;
                                }
                            });
                        }
                    }
                }
                // Populate with default value.
                if (v == undefined && defaultValue !== undefined) {
                    const clone = typeof defaultValue == 'object' || Array.isArray(defaultValue) ? JSON.parse(JSON.stringify(defaultValue)) : defaultValue;
                    v = { value: clone, history: [], lastAccess: now.toISOString() };
                    state[name] = v;
                }
            }
            return v;
        });
    }
    cloneValue(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const v = yield this.loadValue(context);
            return v ? JSON.parse(JSON.stringify(v)) : undefined;
        });
    }
}
exports.Slot = Slot;
//# sourceMappingURL=slot.js.map