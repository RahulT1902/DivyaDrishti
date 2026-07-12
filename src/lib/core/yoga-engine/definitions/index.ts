import { YogaDefinition } from "../../types";
import { RAJ_YOGAS }              from "./raj";
import { PANCHA_MAHAPURUSHA_YOGAS } from "./pancha-mahapurusha";
import { DHANA_YOGAS }            from "./dhana";
import { CHANDRA_YOGAS }          from "./chandra";
import { VIPAREETA_YOGAS }        from "./vipareeta";
import { MISC_YOGAS }             from "./misc";
import { LUNAR_YOGAS }            from "./lunar";
import { MARRIAGE_YOGAS }         from "./marriage";
import { ARISHTA_YOGAS }          from "./arishta";
import { FINANCE_YOGAS }          from "./finance";

// All yoga definitions, sorted by priority (lower = evaluated first).
export const ALL_YOGA_DEFINITIONS: YogaDefinition[] = [
  ...RAJ_YOGAS,
  ...PANCHA_MAHAPURUSHA_YOGAS,
  ...DHANA_YOGAS,
  ...CHANDRA_YOGAS,
  ...VIPAREETA_YOGAS,
  ...MISC_YOGAS,
  ...LUNAR_YOGAS,
  ...MARRIAGE_YOGAS,
  ...ARISHTA_YOGAS,
  ...FINANCE_YOGAS,
].sort((a, b) => a.priority - b.priority);
