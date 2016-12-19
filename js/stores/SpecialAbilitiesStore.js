import AppDispatcher from '../dispatcher/AppDispatcher';
import Store from './Store';
import { get, getAllByCategory, getAllByCategoryGroup, getObjByCategory, getObjByCategoryGroup } from './ListStore';
import PhaseStore from './PhaseStore';
import ActionTypes from '../constants/ActionTypes';
import Categories from '../constants/Categories';
import count from '../utils/count';
import validate from '../utils/validate';

const CATEGORY = Categories.SPECIAL_ABILITIES;
// const GROUPS = ['Allgemein', 'Schicksal', 'Kampf', 'Magisch', 'Magisch (Stab)', 'Magisch (Hexe)', 'Geweiht'];

var _filter = '';
var _sortOrder = 'group';

function _updateFilterText(text) {
	_filter = text;
}

function _updateSortOrder(option) {
	_sortOrder = option;
}

class _SpecialAbilitiesStore extends Store {

	validate(id) {
		let obj = this.get(id);
		return validate(obj.req);
	}

	getForSave() {
		var all = getAllByCategory(CATEGORY);
		var result = new Map();
		all.forEach(e => {
			let { active, id, sid, tier } = e;
			if (typeof active === 'boolean' && active) {
				result.set(id, { sid, tier });
			} else if (Array.isArray(active) && active.length > 0) {
				result.set(id, active);
			}
		});
		return {
			active: Array.from(result)
		};
	}

	get(id) {
		return get(id);
	}

	getAll() {
		return getAllByCategory(CATEGORY);
	}

	getActiveForView(...cgr) {
		var sasObj;
		if (cgr.length > 0) {
			sasObj = getObjByCategoryGroup(CATEGORY, ...cgr);
		} else {
			sasObj = getObjByCategory(CATEGORY);
		}
		var sas = [];
		for (let id in sasObj) {
			let sa = sasObj[id];
			let { name, active, cost, sid, sel, gr, dependencies } = sa;
			if (active === true) {
				let disabled = dependencies.length > 0;
				if (sel.length > 0 && cost === 'sel') {
					if (id === 'SA_86' && getAllByCategory('spells').some(e => e.active)) {
						disabled = true;
					}
					if (id === 'SA_102' && getAllByCategory('liturgies').some(e => e.active)) disabled = true; 
					sas.push({ id, name, add: sel[sid - 1][0], cost: sel[sid - 1][2], gr, disabled });
				} else {
					let phase = PhaseStore.get();
					if (id === 'SA_92' && phase < 3) {
						cost += 4;
					}
					sas.push({ id, name, cost, gr, disabled });
				}
			} else if (Array.isArray(active) && active.length > 0) {
				let disabled = dependencies.length > 0;
				let ap_default = cost;
				if (id === 'SA_10') {
					let counter = count(active);
					active.forEach(n => {
						let sid = n.join('&');
						let tal = get(n[0]);
						let cost = tal.ic * counter.get(n[0]);
						let add = `${tal.name}: ${typeof n[1] === 'number' ? tal.spec[n[1] - 1] : n[1]}`;
						sas.push({ id, name, sid, add, cost, gr, disabled });
					});
				} else for (let i = 0; i < active.length; i++) {
					let sid;
					let add;
					let tier;
					let tiers;
					let cost;
					if (id === 'SA_30') {
						sid = sa.active[i][0];
						cost = ap_default;
						tier = sa.active[i][1];
						tiers = 3;
						add = sa.sel[sid - 1][0];
					} else if (sel.length > 0 && ap_default === 'sel') {
						sid = sa.active[i];
						cost = sa.sel[sid - 1][2];
						add = sa.sel[sid - 1][0];
					} else if (sel.length > 0 && typeof ap_default === 'number') {
						sid = sa.active[i];
						cost = sa.cost;
						add = sa.sel[sid - 1][0];
					} else if (sa.input !== null) {
						sid = sa.active[i];
						add = sa.active[i];
						cost = sa.cost;
					}
					if (dependencies.includes(sid)) disabled = true;
					sas.push({ id, name, sid, add, cost, tier, tiers, gr, disabled });
				}
			}
		}
		if (_filter !== '') {
			let filter = _filter.toLowerCase();
			sas = sas.filter(obj => obj.name.toLowerCase().match(filter));
		}
		if (_sortOrder == 'name') {
			sas.sort((a, b) => {
				if (a.name < b.name) {
					return -1;
				} else if (a.name > b.name) {
					return 1;
				} else {
					if (a.add < b.add) {
						return -1;
					} else if (a.add > b.add) {
						return 1;
					} else {
						return 0;
					}
				}
			});
		} else if (_sortOrder == 'groups') {
			sas.sort((a, b) => {
				// if (GROUPS[a.gr - 1] < GROUPS[b.gr - 1]) {
				// 	return -1;
				// } else if (GROUPS[a.gr - 1] > GROUPS[b.gr - 1]) {
				// 	return 1;
				if (a.gr < b.gr) {
					return -1;
				} else if (a.gr > b.gr) {
					return 1;
				} else {
					if (a.name < b.name) {
						return -1;
					} else if (a.name > b.name) {
						return 1;
					} else {
						if (a.add < b.add) {
							return -1;
						} else if (a.add > b.add) {
							return 1;
						} else {
							return 0;
						}
					}
				}
			});
		}
		return sas;
	}

	getDeactiveForView() {
		var sasObj = getObjByCategory(CATEGORY), sas = [];
		for (let id in sasObj) {
			let sa = sasObj[id];
			let { name, active, cost, max, sel, input, gr, dependencies, reqs } = sa;
			if (!validate(reqs) || dependencies.includes(false)) continue;
			if (active === false) {
				switch (id) {
					case 'SA_18': {
						let sum = getAllByCategory('talents').filter(e => ['TAL_51','TAL_55'].includes(e.id)).reduce((a,b) => a.value + b.value, 0);
						if (sum >= 12)
							sas.push({ id, name, cost, gr });
						break;
					}
					case 'SA_19':
						if (getAllByCategoryGroup('combattech', 2).filter(e => e.value >= 10).length > 0)
							sas.push({ id, name, cost, gr });
						break;
					default:
						if (sel.length > 0 && cost === 'sel') {
							let _sel = sel.filter(e => !dependencies.includes(e[1]));
							sas.push({ id, name, sel: _sel, cost, gr });
						} else {
							let phase = PhaseStore.get();
							if (id === 'SA_92' && phase < 3) {
								cost += 4;
							}
							sas.push({ id, name, cost, gr });
						}
						break;
				}
			} else if (active.length === 0 || max === false || (active.length < sa.max)) {
				switch (id) {
					case 'SA_3': {
						let _sel = sel.filter(e => !active.includes(e[1]) && validate(e[3]) && !dependencies.includes(e[1]));
						if (_sel.length > 0) {
							sas.push({ id, name, sel: _sel, cost, gr });
						}
						break;
					}
					case 'SA_10': {
						let counter = count(active, true);
						let _sel = sel.filter(e => (
								(!counter.hasOwnProperty(e[1]) && get(e[1]).value >= 6) ||
								(counter.hasOwnProperty(e[1]) && counter[e[1]].length < 3 && get(e[1]).value >= 6 * (counter[e[1]].length + 1))
							) && !dependencies.includes(e[1])).map(e => {
								if (counter[e[1]]) {
									e[2] *= counter[e[1]].length + 1;
								}
								e[3] = e[3].filter(n => {
									if (counter[e[1]] === undefined) {
										return true;
									} else {
										return !counter[e[1]].includes(n[1]);
									}
								});
								return e;
							});
						_sel.sort((a,b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
						if (_sel.length > 0) {
							sas.push({ id, name, sel: _sel, cost, gr });
						}
						break;
					}
					case 'SA_29': {
						let _sel = sel.filter(e => !active.includes(e[1]) && get(e[2][0]).value >= e[2][1] && !dependencies.includes(e[1]));
						if (_sel.length > 0) {
							sas.push({ id, name, sel: _sel, cost, gr });
						}
						break;
					}
					case 'SA_30': {
						let _sel = sel.filter(e => active.every(n => n[0] !== e[1]) && !dependencies.includes(e[1]));
						_sel.sort((a,b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
						if (_sel.length > 0) {
							sas.push({ id, name, sel: _sel, cost, tiers: 3, gr });
						}
						break;
					}
					case 'SA_88': {
						let spellsAbove10 = getAllByCategory('spells').filter(e => e.value >= 10);
						let counter = {};
						for (let i = 0; i < spellsAbove10.length; i++) {
							let spell = spellsAbove10[i];
							if (!counter.hasOwnProperty(spell.merk))
								counter[spell.merk] = 1;
							else
								counter[spell.merk]++;
						}
						let newSel = [];
						for (let i = 0; i < sel.length; i++) {
							if (counter[sel[i][1]] >= 3 && !active.includes(sel[i][1]) && !dependencies.includes(sel[i][1]))
								newSel.push(sel[i]);
						}
						newSel.sort((a,b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
						if (newSel.length > 0) {
							let apArr = [10,20,40];
							let newAp = apArr[active.length];
							sas.push({ id, name, sel: newSel, cost: newAp, gr });
						}
						break;
					}
					case 'SA_103': {
						let liturgiesAbove10 = getAllByCategory('liturgies').filter(e => e.value >= 10);
						let counter = {};
						liturgiesAbove10.forEach(n => {
							n.aspc.forEach(e => {
								if (!counter.hasOwnProperty(e))
									counter[e] = 1;
								else
									counter[e]++;
							});
						});
						let newSel = [];
						for (let i = 0; i < sel.length; i++) {
							if (counter[sel[i][1]] >= 3 && !active.includes(sel[i][1]) && !dependencies.includes(sel[i][1]))
								newSel.push(sel[i]);
						}
						newSel.sort((a,b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
						if (newSel.length > 0) {
							let apArr = [15,25,45];
							let newAp = apArr[active.length];
							sas.push({ id, name, sel: newSel, cost: newAp, gr });
						}
						break;
					}
					default:
						if (sel.length > 0) {
							let _sel = sel.filter(e => !active.includes(e[1]) && !dependencies.includes(e[1]));
							_sel.sort((a,b) => a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0);
							if (_sel.length > 0) {
								sas.push({ id, name, sel: _sel, cost, gr });
							}
						} else if (input !== null) {
							sas.push({ id, name, input, cost, gr });
						}
						break;
				}
			}
		}
		if (_filter !== '') {
			let filter = _filter.toLowerCase();
			sas = sas.filter(obj => obj.name.toLowerCase().match(filter));
		}
		if (_sortOrder == 'name') {
			sas.sort((a, b) => {
				if (a.name < b.name) {
					return -1;
				} else if (a.name > b.name) {
					return 1;
				} else {
					return 0;
				}
			});
		} else if (_sortOrder == 'groups') {
			sas.sort((a, b) => {
				// if (GROUPS[a.gr - 1] < GROUPS[b.gr - 1]) {
				// 	return -1;
				// } else if (GROUPS[a.gr - 1] > GROUPS[b.gr - 1]) {
				// 	return 1;
				if (a.gr < b.gr) {
					return -1;
				} else if (a.gr > b.gr) {
					return 1;
				} else {
					if (a.name < b.name) {
						return -1;
					} else if (a.name > b.name) {
						return 1;
					} else {
						return 0;
					}
				}
			});
		}
		return sas;
	}

	getFilter() {
		return _filter;
	}

	getSortOrder() {
		return _sortOrder;
	}

}

const SpecialAbilitiesStore = new _SpecialAbilitiesStore();

SpecialAbilitiesStore.dispatchToken = AppDispatcher.register(payload => {

	switch( payload.actionType ) {

		case ActionTypes.FILTER_SPECIALABILITIES:
			_updateFilterText(payload.text);
			break;

		case ActionTypes.SORT_SPECIALABILITIES:
			_updateSortOrder(payload.option);
			break;
			
		case ActionTypes.ACTIVATE_SPECIALABILITY:
		case ActionTypes.DEACTIVATE_SPECIALABILITY:
		case ActionTypes.UPDATE_SPECIALABILITY_TIER:
			break;
		
		default:
			return true;
	}
	
	SpecialAbilitiesStore.emitChange();

	return true;

});

export default SpecialAbilitiesStore;