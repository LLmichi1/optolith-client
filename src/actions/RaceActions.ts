import { SELECT_RACE, SET_RACES_SORT_ORDER, SWITCH_RACE_VALUE_VISIBILITY } from '../constants/ActionTypes';
import AppDispatcher from '../dispatcher/AppDispatcher';

export const selectRace = (id: string) => AppDispatcher.dispatch<SelectRaceAction>({
	type: SELECT_RACE,
	payload: {
		id
	}
});

export const setRacesSortOrder = (sortOrder: string) => AppDispatcher.dispatch<SetRacesSortOrderAction>({
	type: SET_RACES_SORT_ORDER,
	payload: {
		sortOrder
	}
});

export const switchRaceValueVisibilityFilter = () => AppDispatcher.dispatch<SwitchRaceValueVisibilityAction>({
	type: SWITCH_RACE_VALUE_VISIBILITY
});