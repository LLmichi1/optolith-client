import * as R from 'ramda';
import { ActivatableSkillCategories, Categories } from '../../constants/Categories';
import * as Data from '../../types/data';
import { updateHeroListStateItemOr } from '../heroStateUtils';
import { getCategoryById } from '../IDUtils';

type IncreasableCreator = (id: string) => Data.ExtendedSkillDependent;

type Dependency<T extends Data.Dependent> =
  ListElement<RecordInterface<T>['dependencies']>

const addDependency = <T extends Data.Dependent>(
  add: Dependency<T>
) => (obj: T): Just<T> => Maybe.pure (
  // @ts-ignore
  (obj as any as Record<any>).update<'dependencies'> (
    (dependencies: RecordInterface<T>['dependencies']) =>
      Maybe.pure ((dependencies as List<any>).append (add))
  ) ('dependencies') as T
);

/**
 * Returns needed entry creator for given increasable category.
 * @param category
 */
const getIncreasableCreator: (id: string) => IncreasableCreator = R.pipe (
  getCategoryById,
  category =>
    Maybe.elem (true) (category .fmap (List.elem_ (ActivatableSkillCategories as List<Categories>)))
      ? CreateEntryUtils.createActivatableDependentSkill
      : Maybe.elem (Categories.COMBAT_TECHNIQUES) (category)
      ? CreateEntryUtils.createDependentSkillWithValue6
      : CreateEntryUtils.createDependentSkillWithValue0
);

export const addAttributeDependency = (
  id: string,
  value: Data.SkillDependency
) => updateHeroListStateItemOr (
  CreateEntryUtils.createAttributeDependent,
  addDependency<Record<Data.AttributeDependent>> (value),
  id
);

export const addIncreasableDependency = (
  id: string,
  value: Data.SkillDependency
) => updateHeroListStateItemOr (
  getIncreasableCreator (id),
  addDependency<Data.ExtendedSkillDependent> (value),
  id
);

export const addActivatableDependency = (
  id: string,
  value: Data.ActivatableDependency
) => updateHeroListStateItemOr (
  CreateEntryUtils.createActivatableDependent,
  addDependency<Record<Data.ActivatableDependent>> (value),
  id
);
