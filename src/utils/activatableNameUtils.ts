import R from 'ramda';
import { WikiState } from '../reducers/wikiReducer';
import * as Data from '../types/data.d';
import * as Wiki from '../types/wiki.d';
import { CombinedName } from './ActivatableUtils';
import { _translate } from './I18n';
import { getRoman } from './NumberUtils';
import { getWikiEntry } from './WikiUtils';
import { match } from './match';
import { Maybe, MaybeFunctor } from './maybe';
import { findSelectOption, getSelectOptionName } from './selectionUtils';

/**
 * Returns the name of the given object. If the object is a string, it returns
 * the string.
 * @param obj
 */
export const getFullName = (obj: string | Data.ActiveViewObject): string => {
  if (typeof obj === 'string') {
    return obj;
  }
  const { tierName } = obj;
  let { name } = obj;

  if (tierName) {
    name += tierName;
  }

  return name;
}

/**
 * Accepts the full special ability namen and returns only the text between
 * parentheses. If no parentheses were found, returns an empty string.
 * @param name
 */
export const getTraditionNameFromFullName = (name: string): string => {
  const result = /\((.+)\)/.exec(name);

	if (result === null) {
		return '';
  }

	return result[1];
};

const getEntrySpecificNameAddition = (
  wikiEntry: Wiki.Activatable,
  instance: Data.ActiveObjectWithId,
  wiki: WikiState,
): string | undefined => {
  const { id, sid, sid2 } = instance;
  const { select, input } = wikiEntry;

  return match<string, string | undefined>(id)
    .on([
      'ADV_4',
      'ADV_47',
      'ADV_16',
      'ADV_17',
      'DISADV_48',
      'SA_231',
      'SA_250',
      'SA_472',
      'SA_473',
      'SA_531',
      'SA_533',
      'SA_569',
    ].includes, () => {
      if (typeof sid === 'string') {
        return getWikiEntry<Wiki.Skillish>(wiki, sid)
          .fmap(entry => entry.name)
          .value;
      }
      return;
    })
    .on('ADV_68', () => {
      return findSelectOption(wikiEntry, sid)
        .fmap(item => item && `${sid2} (${item.name})`)
        .value;
    })
    .on('DISADV_33', () => {
      return getSelectOptionName(wikiEntry, sid)
        .fmap(name => {
          if (isNumber(sid) && [7, 8].includes(sid)) {
            return `${name}: ${sid2}`;
          }
          else {
            return name;
          }
        })
        .value;
    })
    .on('SA_9', () => {
      if (typeof sid === 'string') {
        return Maybe(wiki.skills.get(sid))
          .fmap(skill => {
            return R.pipe(
              (sid2: string | number | undefined) => {
                return R.unless<string | number | undefined, string | undefined>(
                  isString,
                  R.always(
                    Maybe(skill.applications)
                      .fmap(R.find(e => e.id === sid2))
                      .fmap(app => app.name)
                      .value
                  )
                );
              },
              name => `${skill.name}: ${name}`
            )(sid2);
          })
          .value;
      }
      return;
    })
    .on([
      'SA_414',
      'SA_663',
    ].includes, () => {
      return findSelectOption(wikiEntry, sid)
        .fmap(item => {
          return Maybe(item.target)
            .fmap(target => {
              if (id === 'SA_414') {
                return wiki.spells.get(target);
              }
              else {
                return wiki.liturgicalChants.get(target);
              }
            })
            .fmap(target => `${target.name}: ${item.name}`)
            .value;
        })
        .value;
    })
    .on('SA_680', () => {
      if (typeof sid === 'string') {
        return Maybe(wiki.skills.get(sid as string))
          .fmap(entry => `: ${entry.name}`)
          .value;
      }
      return;
    })
    .on('SA_699', () => {
      return Maybe(wiki.specialAbilities.get('SA_29'))
        .fmap(languages => {
          return findSelectOption(languages, sid)
            .fmap(item => {
              return `${item.name}: ${
                R.unless<string | number | undefined, string | undefined>(
                  isString,
                  sid2 => Maybe(item.spec)
                    .fmap(spec => {
                      return Maybe(sid2 as number | undefined)
                        .fmap(sid2 => spec[sid2 - 1])
                        .value
                    })
                    .value,
                )(sid2)
              }`;
            })
            .value;
        })
        .value;
    })
    .otherwise(() => {
      if (typeof input === 'string' && typeof sid === 'string') {
        return sid;
      }
      else if (Array.isArray(select)) {
        return getSelectOptionName(wikiEntry, sid).value;
      }
      return;
    });
};

const getEntrySpecificNameReplacements = (
  wikiEntry: Wiki.Activatable,
  instance: Data.ActiveObjectWithId,
  nameAddition: string | undefined,
  locale?: Data.UIMessages,
): string => {
  const { id, sid2, tier } = instance;
  const { name } = wikiEntry;

  return R.defaultTo(name, match<string, string | undefined>(id)
    .on(['ADV_28', 'ADV_29'].includes, () => {
      return `${_translate(locale, 'activatable.view.immunityto')} ${nameAddition}`;
    })
    .on('ADV_68', () => {
      return `${_translate(locale, 'activatable.view.hatredof')} ${nameAddition}`;
    })
    .on('DISADV_1', () => {
      return `${_translate(locale, 'activatable.view.afraidof')} ${nameAddition}`;
    })
    .on(['DISADV_34', 'DISADV_50'].includes, () => {
      return `${name} ${getRoman(tier as number)} (${nameAddition})`;
    })
    .on('SA_639', () => {
      return `${name} ${nameAddition}`;
    })
    .on(['SA_677', 'SA_678'].includes, () => {
      return Maybe(locale)
        .fmap(locale => {
          const part = getTraditionNameFromFullName(name);
          const musictraditionLabels = _translate(locale, 'musictraditions');

          if (typeof sid2 === 'number') {
            return name.replace(part, `${part}: ${musictraditionLabels[sid2 - 1]}`);
          }

          return;
        })
        .value;
    })
    .otherwise(() => R.when(
      R.complement(R.isNil),
      () => `${name} (${nameAddition})`,
      nameAddition
    ))
  );
}

/**
 * Returns name, splitted and combined, of advantage/disadvantage/special
 * ability as a Maybe (in case the wiki entry does not exist).
 * @param instance The ActiveObject with origin id.
 * @param wiki The current hero's state.
 * @param locale The locale-dependent messages.
 */
export function getName(
  instance: Data.ActiveObjectWithId,
  wiki: WikiState,
  locale?: Data.UIMessages,
): MaybeFunctor<CombinedName | undefined> {
  return getWikiEntry<Wiki.Activatable>(wiki, instance.id)
    .fmap(wikiEntry => {
      const addName = getEntrySpecificNameAddition(
        wikiEntry,
        instance,
        wiki,
      );

      const combinedName = getEntrySpecificNameReplacements(
        wikiEntry,
        instance,
        addName,
        locale,
      );

      return {
        combinedName,
        baseName: wikiEntry.name,
        addName
      };
    });
}