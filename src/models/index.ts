import type { Model } from '../model';
// drafts/ holds models that stand but don't look right yet (elephant, windmill, tipi)
import { bateauPirate } from './bateau-pirate';
import { chalet } from './chalet';
import { chateau } from './chateau';
import { fusee } from './fusee';
import { girafe } from './girafe';
import { igloo } from './igloo';
import { locomotive } from './locomotive';
import { maison } from './maison';
import { phare } from './phare';
import { pont } from './pont';
import { tourTorsadee } from './tour-torsadee';
import { tourEiffel } from './tour-eiffel';
import { pyramide } from './pyramide';
import { araignee } from './araignee';
import { chouette } from './chouette';
import { tracteur } from './tracteur';
import { avion } from './avion';
import { viaduc } from './viaduc';
import { pagode } from './pagode';
import { dinosaure } from './dinosaure';

export const MODELS: Model[] = [tourTorsadee, chateau, fusee, bateauPirate, pont, igloo, maison, chalet, girafe, locomotive, phare, tourEiffel, pyramide, araignee, chouette, tracteur, avion, viaduc, pagode, dinosaure];
