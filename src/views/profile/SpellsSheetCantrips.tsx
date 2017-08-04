import * as React from 'react';
import { TextBox } from '../../components/TextBox';
import { CantripInstance, UIMessages } from '../../types/data.d';
import { sortStrings } from '../../utils/FilterSortUtils';
import { _translate } from '../../utils/I18n';

export interface SpellsSheetCantripsProps {
	cantrips: CantripInstance[];
	locale: UIMessages;
}

export function SpellsSheetCantrips(props: SpellsSheetCantripsProps) {
	const { cantrips, locale } = props;
	return (
		<TextBox label={_translate(locale, 'charactersheet.spells.cantrips.title')} className="cantrips activatable-list">
			<div className="list">
				{
					sortStrings(cantrips.map(e => e.name), locale.id).join(', ')
				}
			</div>
		</TextBox>
	);
}
