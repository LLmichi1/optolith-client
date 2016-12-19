import { filterAndSort } from '../../utils/ListUtils';
import BorderButton from '../../components/BorderButton';
import LiturgiesActions from '../../actions/LiturgiesActions';
import LiturgiesStore from '../../stores/LiturgiesStore';
import PhaseStore from '../../stores/PhaseStore';
import RadioButtonGroup from '../../components/RadioButtonGroup';
import React, { Component } from 'react';
import Scroll from '../../components/Scroll';
import SkillListItem from './SkillListItem';
import Slidein from '../../components/Slidein';
import TextField from '../../components/TextField';

export default class Liturgies extends Component {
	
	state = { 
		liturgies: LiturgiesStore.getAll(),
		addChantsDisabled: LiturgiesStore.isActivationDisabled(),
		filterText: LiturgiesStore.getFilterText(),
		sortOrder: LiturgiesStore.getSortOrder(),
		phase: PhaseStore.get(),
		showAddSlidein: false
	};
	
	_updateLiturgiesStore = () => this.setState({ 
		liturgies: LiturgiesStore.getAll(),
		addChantsDisabled: LiturgiesStore.isActivationDisabled(),
		filterText: LiturgiesStore.getFilterText(),
		sortOrder: LiturgiesStore.getSortOrder()
	});

	filter = event => LiturgiesActions.filter(event.target.value);
	sort = option => LiturgiesActions.sort(option);
	addToList = id => LiturgiesActions.addToList(id);
	addPoint = id => LiturgiesActions.addPoint(id);
	removeFromList = id => LiturgiesActions.removeFromList(id);
	removePoint = id => LiturgiesActions.removePoint(id);
	showAddSlidein = () => this.setState({ showAddSlidein: true });
	hideAddSlidein = () => this.setState({ showAddSlidein: false });
	
	componentDidMount() {
		LiturgiesStore.addChangeListener(this._updateLiturgiesStore );
	}
	
	componentWillUnmount() {
		LiturgiesStore.removeChangeListener(this._updateLiturgiesStore );
	}

	render() {

		const GROUPS = LiturgiesStore.getGroupNames();
		const ASPECTS = LiturgiesStore.getAspectNames();

		const { addChantsDisabled, filterText, phase, showAddSlidein, sortOrder, liturgies } = this.state;

		const sortArray = [
			{ name: 'Alphabetisch', value: 'name' },
			{ name: 'Nach Aspekt', value: 'aspect' },
			{ name: 'Nach Gruppe', value: 'group' },
			{ name: 'Nach Steigerungsfaktor', value: 'ic' }
		];

		const list = filterAndSort(liturgies, filterText, sortOrder);

		const listActive = [];
		const listDeactive = [];

		list.forEach(e => {
			if (e.active) {
				listActive.push(e);
			}
			else {
				if (e.isOwnTradition) {
					listDeactive.push(e);
				}
			}
		});

		return (
			<div className="page" id="liturgies">
				<Slidein isOpen={showAddSlidein} close={this.hideAddSlidein}>
					<div className="options">
						<TextField hint="Suchen" value={filterText} onChange={this.filter} fullWidth />
						<RadioButtonGroup
							active={sortOrder}
							onClick={this.sort}
							array={sortArray}
							/>
					</div>
					<Scroll className="list">
						<table>
							<thead>
								<tr>
									<td className="type">Gruppe</td>
									<td className="name">Liturgie</td>
									<td className="merk">Aspekte</td>
									<td className="check">Probe</td>
									<td className="skt">Sf.</td>
									<td className="inc"></td>
								</tr>
							</thead>
							<tbody>
								{
									listDeactive.map(liturgy => {
										const [ a, b, c, checkmod ] = liturgy.check;
										const check = [ a, b, c ];

										let name = liturgy.name;

										const aspc = liturgy.aspect.map(e => ASPECTS[e - 1]).sort().join(', ');

										const obj = liturgy.gr === 3 ? {} : {
											check,
											checkmod,
											ic: liturgy.ic
										};

										return (
											<SkillListItem
												key={liturgy.id}
												group={GROUPS[liturgy.gr - 1]}
												name={name}
												isNotActive
												activate={this.addToList.bind(null, liturgy.id)}
												activateDisabled={addChantsDisabled && liturgy.gr < 3}
												{...obj}
												>
												<td className="aspc">{aspc}</td>
											</SkillListItem>
										);
									})
								}
							</tbody>
						</table>
					</Scroll>
				</Slidein>
				<div className="options">
					<TextField hint="Suchen" value={filterText} onChange={this.filter} fullWidth />
					<RadioButtonGroup
						active={sortOrder}
						onClick={this.sort}
						array={sortArray}
						/>
					<BorderButton
						label="Hinzufügen"
						onClick={this.showAddSlidein}
						/>
				</div>
				<Scroll className="list">
					<table>
						<thead>
							<tr>
								<td className="type">Gruppe</td>
								<td className="name">Liturgie</td>
								<td className="fw">Fw</td>
								<td className="merk">Aspekte</td>
								<td className="check">Probe</td>
								<td className="skt">Sf.</td>
								<td className="inc"></td>
							</tr>
						</thead>
						<tbody>
							{
								listActive.map(obj => {
									const [ a1, a2, a3, checkmod ] = obj.check;
									const check = [ a1, a2, a3 ];

									let name = obj.name;

									const aspc = obj.aspc.map(e => ASPECTS[e - 1]).sort().join(', ');

									const other = obj.gr === 3 ? {} : {
										sr: obj.value,
										check,
										checkmod,
										ic: obj.ic,
										addPoint: this.addPoint.bind(null, obj.id),
										addDisabled: obj.disabledIncrease
									};

									return (
										<SkillListItem
											key={obj.id}
											group={GROUPS[obj.gr - 1]}
											name={name}
											removePoint={phase < 3 ? obj.gr === 3 || obj.value === 0 ? this.removeFromList.bind(null, obj.id) : this.removePoint.bind(null, obj.id) : undefined}
											removeDisabled={obj.disabledDecrease}
											{...other} >
											<td className="aspc">{aspc}</td>
										</SkillListItem>
									);
								})
							}
						</tbody>
					</table>
				</Scroll>
			</div>
		);
	}
}