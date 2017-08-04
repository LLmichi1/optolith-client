import { connect, Dispatch } from 'react-redux';
import { Action } from 'redux';
import * as EquipmentActions from '../actions/EquipmentActions';
import { AppState } from '../reducers/app';
import { getInitialStartingWealth } from '../selectors/activatableSelectors';
import { getTotal } from '../selectors/adventurePointsSelectors';
import { getCarryingCapacity } from '../selectors/attributeSelectors';
import { getAllCombatTechniques } from '../selectors/combatTechniquesSelectors';
import { getStartEl } from '../selectors/elSelectors';
import { getItems, getPurse, getTemplates, getTotalPrice, getTotalWeight } from '../selectors/equipmentSelectors';
import { getEquipmentSortOrder } from '../selectors/uisettingsSelectors';
import { ItemInstance } from '../types/data.d';
import { Equipment, EquipmentDispatchProps, EquipmentOwnProps, EquipmentStateProps } from '../views/belongings/Equipment';

function mapStateToProps(state: AppState) {
	return {
		combatTechniques: getAllCombatTechniques(state),
		carryingCapacity: getCarryingCapacity(state),
		initialStartingWealth: getInitialStartingWealth(state),
		items: getItems(state),
		hasNoAddedAP: getTotal(state) === getStartEl(state).ap,
		purse: getPurse(state),
		sortOrder: getEquipmentSortOrder(state),
		templates: getTemplates(state),
		totalPrice: getTotalPrice(state),
		totalWeight: getTotalWeight(state)
	};
}

function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		addToList(item: ItemInstance) {
			dispatch(EquipmentActions._addToList(item));
		},
		deleteItem(id: string) {
			dispatch(EquipmentActions._removeFromList(id));
		},
		set(id: string, item: ItemInstance) {
			dispatch(EquipmentActions._set(id, item));
		},
		setSortOrder(option: string) {
			dispatch(EquipmentActions._setSortOrder(option));
		},
		setDucates(value: string) {
			dispatch(EquipmentActions._setDucates(value));
		},
		setSilverthalers(value: string) {
			dispatch(EquipmentActions._setSilverthalers(value));
		},
		setHellers(value: string) {
			dispatch(EquipmentActions._setHellers(value));
		},
		setKreutzers(value: string) {
			dispatch(EquipmentActions._setKreutzers(value));
		}
	};
}

export const EquipmentContainer = connect<EquipmentStateProps, EquipmentDispatchProps, EquipmentOwnProps>(mapStateToProps, mapDispatchToProps)(Equipment);
