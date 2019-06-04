import { Maybe, Nothing } from "../../../Data/Maybe";
import { fromDefault, makeLenses } from "../../../Data/Record";
import { Pair } from "../../../Data/Tuple";

export interface EditPrimaryAttributeDamageThreshold {
  primary: Maybe<string>
  threshold: string | Pair<string, string>
}

export const EditPrimaryAttributeDamageThreshold =
  fromDefault<EditPrimaryAttributeDamageThreshold> ({
    primary: Nothing,
    threshold: "",
  })

export const EditPrimaryAttributeDamageThresholdL =
  makeLenses (EditPrimaryAttributeDamageThreshold)