import type { Model } from '../model';
// drafts/ holds models that stand but don't look right yet (elephant, windmill)
import { bateauPirate } from './bateau-pirate';
import { chalet } from './chalet';
import { chateau } from './chateau';
import { fusee } from './fusee';
import { girafe } from './girafe';
import { igloo } from './igloo';
import { locomotive } from './locomotive';
import { phare } from './phare';
import { pont } from './pont';
import { tourTorsadee } from './tour-torsadee';

export const MODELS: Model[] = [tourTorsadee, chateau, fusee, bateauPirate, pont, igloo, chalet, girafe, locomotive, phare];
