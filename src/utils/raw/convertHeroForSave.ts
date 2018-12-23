import { pipe } from 'ramda';
import * as Data from '../../types/data';
import * as Raw from '../../types/rawdata';
import { PrimaryAttributeDamageThreshold, WikiAll } from '../../types/wiki';
import { ActivatableDependentG, ActiveObjectG } from '../activeEntries/activatableDependent';
import { ActivatableSkillDependentG } from '../activeEntries/activatableSkillDependent';
import { AttributeDependentG } from '../activeEntries/attributeDependent';
import { getAPObject } from '../adventurePoints/adventurePointsSumUtils';
import { BelongingsG } from '../heroData/BelongingsCreator';
import { EnergiesG } from '../heroData/EnergiesCreator';
import { HeroG } from '../heroData/HeroCreator';
import { HitZoneArmorCreatorG } from '../heroData/HitZoneArmorCreator';
import { PersonalDataG } from '../heroData/PersonalDataCreator';
import { PrimaryAttributeDamageThresholdG } from '../heroData/PrimaryAttributeDamageThresholdCreator';
import { RulesG } from '../heroData/RulesCreator';
import { UndoHeroG } from '../heroData/UndoHeroCreator';
import { HeroStateMapKey } from '../heroStateUtils';
import { ifElse } from '../ifElse';
import { gt } from '../mathUtils';
import { ident } from '../structures/Function';
import { List, map } from '../structures/List';
import { bind, elem, fmap, maybeToUndefined } from '../structures/Maybe';
import { elems, foldl, foldlWithKey, OrderedMap, OrderedMapValueElement, toObjectWith, union } from '../structures/OrderedMap';
import { toArray } from '../structures/OrderedSet';
import { Record, StringKeyObject, toObject } from '../structures/Record';
import { UndoState } from '../undo';
import { currentVersion } from './VersionUtils';

const {
  attributes,
  attributeAdjustmentSelected,
  energies,
  advantages,
  disadvantages,
  specialAbilities,
  skills,
  combatTechniques,
  spells,
  cantrips,
  liturgicalChants,
  blessings,
  belongings,
  pets,
  player,
} = HeroG

const { id, value } = AttributeDependentG
const { active } = ActivatableSkillDependentG
const { active: activeList } = ActivatableDependentG
const { items, armorZones, purse } = BelongingsG

const {
  addedArcaneEnergyPoints,
  addedKarmaPoints,
  addedLifePoints,
  permanentArcaneEnergyPoints,
  permanentKarmaPoints,
  permanentLifePoints,
} = EnergiesG

const { cost, sid, sid2, tier } = ActiveObjectG

const getAttributesForSave = (hero: Record<Data.HeroDependent>): Raw.RawHero['attr'] =>
  ({
    values: foldl<Record<Data.AttributeDependent>, { id: string; value: number }[]>
      (acc => e => [...acc, { id: id (e), value: value (e) }])
      ([])
      (attributes (hero)),
    attributeAdjustmentSelected: attributeAdjustmentSelected (hero),
    ae: addedArcaneEnergyPoints (energies (hero)),
    kp: addedKarmaPoints (energies (hero)),
    lp: addedLifePoints (energies (hero)),
    permanentAE: toObject (permanentArcaneEnergyPoints (energies (hero))),
    permanentKP: toObject (permanentKarmaPoints (energies (hero))),
    permanentLP: toObject (permanentLifePoints (energies (hero))),
  })

const getActivatablesForSave = (hero: Record<Data.HeroDependent>) =>
  foldlWithKey<string, Record<Data.ActivatableDependent>, StringKeyObject<Raw.RawActiveObject[]>>
    (acc => key => obj => ({
      ...acc,
      [key]: List.foldl<Record<Data.ActiveObject>, Raw.RawActiveObject[]>
        (accActive => e => [
          ...accActive,
          {
            cost: maybeToUndefined (cost (e)),
            sid2: maybeToUndefined (sid2 (e)),
            sid: maybeToUndefined (sid (e)),
            tier: maybeToUndefined (tier (e)),
          },
        ])
        ([])
        (activeList (obj)),
    }))
    ({})
    (union (advantages (hero)) (union (disadvantages (hero)) (specialAbilities (hero))))

const getValuesForSave = <T extends Data.HeroDependent[HeroStateMapKey]>(
  sliceGetter: (hero: Record<Data.HeroDependent>) => T,
  testFn: (obj: OrderedMapValueElement<T>) => boolean
) =>
  (hero: Record<Data.HeroDependent>) =>
    foldlWithKey<string, Data.ExtendedSkillDependent, StringKeyObject<number>>
      (acc => key => obj => {
        if (testFn (obj as OrderedMapValueElement<T>)) {
          return {
            ...acc,
            [key]: value (obj),
          };
        }

        return acc;
      })
      ({})
      (sliceGetter (hero) as OrderedMap<string, Data.ExtendedSkillDependent>)

const getSkillsForSave = getValuesForSave (skills, pipe (value, gt (0)))

const getCombatTechniquesForSave = getValuesForSave (combatTechniques, pipe (value, gt (6)))

const getSpellsForSave = getValuesForSave (spells, active)

const getCantripsForSave = pipe (cantrips, toArray)

const getLiturgicalChantsForSave = getValuesForSave (liturgicalChants, active)

const getBlessingsForSave = pipe (blessings, toArray)

const { primary, threshold } = PrimaryAttributeDamageThresholdG

const getBelongingsForSave = (hero: Record<Data.HeroDependent>) =>
  ({
    items: toObjectWith<Record<Data.ItemInstance>, Raw.RawCustomItem>
      (obj => {
        const {
          improvisedWeaponGroup,
          damageBonus,
          range,
          at,
          iniMod,
          movMod,
          damageDiceNumber,
          damageFlat,
          enc,
          length,
          pa,
          pro,
          reloadTime,
          stp,
          stabilityMod,
          note,
          rules,
          advantage,
          disadvantage,
          src,
          ammunition,
          combatTechnique,
          damageDiceSides,
          reach,
          template,
          isParryingWeapon,
          where,
          isTwoHandedWeapon,
          loss,
          forArmorZoneOnly,
          addPenalties,
          armorType,
          ...other
        } = toObject (obj)

        return {
          ...other,
          at: maybeToUndefined (at),
          iniMod: maybeToUndefined (iniMod),
          movMod: maybeToUndefined (movMod),
          damageDiceNumber: maybeToUndefined (damageDiceNumber),
          damageFlat: maybeToUndefined (damageFlat),
          enc: maybeToUndefined (enc),
          length: maybeToUndefined (length),
          pa: maybeToUndefined (pa),
          pro: maybeToUndefined (pro),
          reloadTime: maybeToUndefined (reloadTime),
          stp: maybeToUndefined (stp),
          stabilityMod: maybeToUndefined (stabilityMod),
          note: maybeToUndefined (note),
          rules: maybeToUndefined (rules),
          advantage: maybeToUndefined (advantage),
          disadvantage: maybeToUndefined (disadvantage),
          src: maybeToUndefined (src),
          ammunition: maybeToUndefined (ammunition),
          combatTechnique: maybeToUndefined (combatTechnique),
          damageDiceSides: maybeToUndefined (damageDiceSides),
          reach: maybeToUndefined (reach),
          template: maybeToUndefined (template),
          isParryingWeapon: maybeToUndefined (isParryingWeapon),
          where: maybeToUndefined (where),
          isTwoHandedWeapon: maybeToUndefined (isTwoHandedWeapon),
          loss: maybeToUndefined (loss),
          forArmorZoneOnly: maybeToUndefined (forArmorZoneOnly),
          addPenalties: maybeToUndefined (addPenalties),
          armorType: maybeToUndefined (armorType),
          imp: maybeToUndefined (improvisedWeaponGroup),
          primaryThreshold:
            maybeToUndefined (
              fmap<Record<PrimaryAttributeDamageThreshold>, Raw.RawPrimaryAttributeDamageThreshold>
                (bonus => ({
                  primary: maybeToUndefined (primary (bonus)) ,
                  threshold:
                    ifElse<number | List<number>, List<number>, number | number[]>
                      (List.isList)
                      (List.toArray)
                      (ident)
                      (threshold (bonus)),
                }))
                (damageBonus)
            ),
          range: maybeToUndefined (fmap<List<number>, number[]> (List.toArray) (range)),
        }
      })
      (items (belongings (hero))),
    armorZones:
      toObjectWith<Record<Data.ArmorZonesInstance>, Raw.RawArmorZone>
        (obj => ({
          id: HitZoneArmorCreatorG.id (obj),
          name: HitZoneArmorCreatorG.name (obj),
          head: maybeToUndefined (HitZoneArmorCreatorG.head (obj)),
          headLoss: maybeToUndefined (HitZoneArmorCreatorG.headLoss (obj)),
          leftArm: maybeToUndefined (HitZoneArmorCreatorG.leftArm (obj)),
          leftArmLoss: maybeToUndefined (HitZoneArmorCreatorG.leftArmLoss (obj)),
          rightArm: maybeToUndefined (HitZoneArmorCreatorG.rightArm (obj)),
          rightArmLoss: maybeToUndefined (HitZoneArmorCreatorG.rightArmLoss (obj)),
          torso: maybeToUndefined (HitZoneArmorCreatorG.torso (obj)),
          torsoLoss: maybeToUndefined (HitZoneArmorCreatorG.torsoLoss (obj)),
          leftLeg: maybeToUndefined (HitZoneArmorCreatorG.leftLeg (obj)),
          leftLegLoss: maybeToUndefined (HitZoneArmorCreatorG.leftLegLoss (obj)),
          rightLeg: maybeToUndefined (HitZoneArmorCreatorG.rightLeg (obj)),
          rightLegLoss: maybeToUndefined (HitZoneArmorCreatorG.rightLegLoss (obj)),
        }))
        (armorZones (belongings (hero))),
    purse: toObject (purse (belongings (hero))),
  })

const getPetsForSave = pipe (
  pets,
  toObjectWith (
    (r): Raw.RawPet => {
      const obj = toObject (r)

      return {
        id: obj .id,
        name: obj .name,
        size: maybeToUndefined (obj .size),
        type: maybeToUndefined (obj .type),
        attack: maybeToUndefined (obj .attack),
        dp: maybeToUndefined (obj .dp),
        reach: maybeToUndefined (obj .reach),
        actions: maybeToUndefined (obj .actions),
        talents: maybeToUndefined (obj .talents),
        skills: maybeToUndefined (obj .skills),
        notes: maybeToUndefined (obj .notes),
        spentAp: maybeToUndefined (obj .spentAp),
        totalAp: maybeToUndefined (obj .totalAp),
        cou: maybeToUndefined (obj .cou),
        sgc: maybeToUndefined (obj .sgc),
        int: maybeToUndefined (obj .int),
        cha: maybeToUndefined (obj .cha),
        dex: maybeToUndefined (obj .dex),
        agi: maybeToUndefined (obj .agi),
        con: maybeToUndefined (obj .con),
        str: maybeToUndefined (obj .str),
        lp: maybeToUndefined (obj .lp),
        ae: maybeToUndefined (obj .ae),
        spi: maybeToUndefined (obj .spi),
        tou: maybeToUndefined (obj .tou),
        pro: maybeToUndefined (obj .pro),
        ini: maybeToUndefined (obj .ini),
        mov: maybeToUndefined (obj .mov),
        at: maybeToUndefined (obj .at),
        pa: maybeToUndefined (obj .pa),
      }
    }
  )
)

export const convertHeroForSave = (wiki: Record<WikiAll>) =>
  (locale: Record<Data.UIMessages>) =>
    (users: OrderedMap<string, Data.User>) =>
      (hero: Data.Hero): Raw.RawHero => {
        const {
          dateCreated,
          dateModified,
          phase,
          name,
          avatar,
          experienceLevel,
          race,
          raceVariant,
          culture,
          profession,
          professionName,
          professionVariant,
          sex,
          personalData,
          rules,
        } = toObject (hero)

        const adventurePoints = getAPObject (wiki) (locale) (hero)

        const maybeUser = bind<string, Data.User> (player (hero))
                                                  (OrderedMap.lookup_<string, Data.User> (users))

        const obj: Raw.RawHero = {
          clientVersion: currentVersion,
          dateCreated: dateCreated .toJSON (),
          dateModified: dateModified .toJSON (),
          id: id (hero),
          phase,
          player: maybeToUndefined (maybeUser),
          name,
          avatar: maybeToUndefined (avatar),
          ap: {
            total: adventurePoints.get ('total'),
            spent: adventurePoints.get ('spent'),
          },
          el: experienceLevel,
          r: maybeToUndefined (race),
          rv: maybeToUndefined (raceVariant),
          c: maybeToUndefined (culture),
          p: maybeToUndefined (profession),
          professionName: elem ('P_0') (profession) ? maybeToUndefined (professionName) : undefined,
          pv: maybeToUndefined (professionVariant),
          sex,
          pers: {
            family: maybeToUndefined (PersonalDataG.family (personalData)),
            placeofbirth: maybeToUndefined (PersonalDataG.placeOfBirth (personalData)),
            dateofbirth: maybeToUndefined (PersonalDataG.dateOfBirth (personalData)),
            age: maybeToUndefined (PersonalDataG.age (personalData)),
            haircolor: maybeToUndefined (PersonalDataG.hairColor (personalData)),
            eyecolor: maybeToUndefined (PersonalDataG.eyeColor (personalData)),
            size: maybeToUndefined (PersonalDataG.size (personalData)),
            weight: maybeToUndefined (PersonalDataG.weight (personalData)),
            title: maybeToUndefined (PersonalDataG.title (personalData)),
            socialstatus: maybeToUndefined (PersonalDataG.socialStatus (personalData)),
            characteristics: maybeToUndefined (PersonalDataG.characteristics (personalData)),
            otherinfo: maybeToUndefined (PersonalDataG.otherInfo (personalData)),
            cultureAreaKnowledge:
              maybeToUndefined (PersonalDataG.cultureAreaKnowledge (personalData)),
          },
          attr: getAttributesForSave (hero),
          activatable: getActivatablesForSave (hero),
          talents: getSkillsForSave (hero),
          ct: getCombatTechniquesForSave (hero),
          spells: getSpellsForSave (hero),
          cantrips: getCantripsForSave (hero),
          liturgies: getLiturgicalChantsForSave (hero),
          blessings: getBlessingsForSave (hero),
          belongings: getBelongingsForSave (hero),
          rules: {
            ...toObject (rules),
            enabledRuleBooks: toArray (RulesG.enabledRuleBooks (rules)),
          },
          pets: getPetsForSave (hero),
        }

        return obj
      }

const { present } = UndoHeroG

export const convertHeroesForSave = (wiki: Record<WikiAll>) =>
  (locale: Record<Data.UIMessages>) =>
    (users: OrderedMap<string, Data.User>) =>
      (heroes: OrderedMap<string, Record<UndoState<Data.Hero>>>) =>
       map (pipe (present, convertHeroForSave (wiki) (locale) (users)))
           (elems (heroes))
