import { Categories } from '../constants/Categories';
import { CurrentHeroInstanceState } from '../reducers/currentHero';
import { get, getAllByCategory } from '../selectors/dependentInstancesSelectors';
import { getStart } from '../selectors/elSelectors';
import { AttributeInstance, RequirementObject, SpecialAbilityInstance, TalentInstance } from '../types/data.d';
import { getExperienceLevelIdByAp } from '../utils/ELUtils';
import { getFlatPrerequisites } from './RequirementUtils';

export function getSum(list: AttributeInstance[]): number {
  return list.reduce((n, e) => n + e.value, 0);
}

export function isIncreasable(state: CurrentHeroInstanceState, obj: AttributeInstance): boolean {
  if (state.phase < 3) {
    const attributes = getAllByCategory(state.dependent, Categories.ATTRIBUTES) as AttributeInstance[];
    const el = getStart(state.el);
    const max = getSum(attributes) >= el.maxTotalAttributeValues ? 0 : el.maxAttributeValue + obj.mod;
    return obj.value < max;
  }
  else if (state.rules.attributeValueLimit === true) {
    const currentElId = getExperienceLevelIdByAp(state.el.all, state.ap);
    const currentEl = state.el.all.get(currentElId);
    return typeof currentEl === 'object' && obj.value < currentEl.maxAttributeValue + 2;
  }
  return true;
}

export function isDecreasable(state: CurrentHeroInstanceState, obj: AttributeInstance): boolean {
  const dependencies = obj.dependencies.map(e => {
    if (typeof e !== 'number') {
      const target = get(state.dependent, e.origin) as SpecialAbilityInstance;
      const req = getFlatPrerequisites(target.reqs).find(r => typeof r !== 'string' && Array.isArray(r.id) && r.id.includes(e.origin)) as RequirementObject | undefined;
      if (req) {
        const resultOfAll = (req.id as string[]).map(id => (get(state.dependent, id) as TalentInstance).value >= e.value);
        return resultOfAll.reduce((a, b) => b ? a + 1 : a, 0) > 1 ? 0 : e.value;
      }
      return 0;
    }
    return e;
  });

  return obj.value > Math.max(8, ...dependencies);
}

export function reset(obj: AttributeInstance): AttributeInstance {
  return {
    ...obj,
    dependencies: [],
    mod: 0,
    value: 8,
  };
}

export function convertId<T extends string | undefined>(id: T): T {
  switch (id) {
    case 'COU':
      return 'ATTR_1' as T;
    case 'SGC':
      return 'ATTR_2' as T;
    case 'INT':
      return 'ATTR_3' as T;
    case 'CHA':
      return 'ATTR_4' as T;
    case 'DEX':
      return 'ATTR_5' as T;
    case 'AGI':
      return 'ATTR_6' as T;
    case 'CON':
      return 'ATTR_7' as T;
    case 'STR':
      return 'ATTR_8' as T;

    default:
      return id;
  }
}