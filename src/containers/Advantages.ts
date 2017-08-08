import { connect, Dispatch } from 'react-redux';
import { Action } from 'redux';
import * as ConfigActions from '../actions/ConfigActions';
import * as DisAdvActions from '../actions/DisAdvActions';
import { ADVANTAGES } from '../constants/Categories';
import { AppState } from '../reducers/app';
import { getActiveForView, getAdvantagesRating, getDeactiveForView } from '../selectors/activatableSelectors';
import { getAp } from '../selectors/adventurePointsSelectors';
import { getPresent } from '../selectors/currentHeroSelectors';
import { get, getDependent } from '../selectors/dependentInstancesSelectors';
import { getAdvantagesDisadvantagesCultureRatingVisibility, getEnableActiveItemHints } from '../selectors/uisettingsSelectors';
import { ActivateArgs, DeactivateArgs } from '../types/data.d';
import { getAdvantagesDisadvantagesSubMax } from '../utils/APUtils';
import { Advantages, AdvantagesDispatchProps, AdvantagesOwnProps, AdvantagesStateProps } from '../views/disadv/Advantages';

function mapStateToProps(state: AppState) {
	return {
		activeList: getActiveForView(getPresent(state), ADVANTAGES),
		ap: getAp(state),
		deactiveList: getDeactiveForView(getPresent(state), ADVANTAGES),
		enableActiveItemHints: getEnableActiveItemHints(state),
		get(id: string) {
			return get(getDependent(state), id);
		},
		magicalMax: getAdvantagesDisadvantagesSubMax(getDependent(state), 1),
		rating: getAdvantagesRating(state),
		showRating: getAdvantagesDisadvantagesCultureRatingVisibility(state),
	};
}

function mapDispatchToProps(dispatch: Dispatch<Action>) {
	return {
		switchRatingVisibility() {
			dispatch(DisAdvActions._switchRatingVisibility());
		},
		switchActiveItemHints() {
			dispatch(ConfigActions._switchEnableActiveItemHints());
		},
		addToList(args: ActivateArgs) {
			const action = DisAdvActions._addToList(args);
			if (action) {
				dispatch(action);
			}
		},
		removeFromList(args: DeactivateArgs) {
			const action = DisAdvActions._removeFromList(args);
			if (action) {
				dispatch(action);
			}
		},
		setTier(id: string, index: number, tier: number, cost: number) {
			const action = DisAdvActions._setTier(id, index, tier, cost);
			if (action) {
				dispatch(action);
			}
		}
	};
}

export const AdvantagesContainer = connect<AdvantagesStateProps, AdvantagesDispatchProps, AdvantagesOwnProps>(mapStateToProps, mapDispatchToProps)(Advantages);