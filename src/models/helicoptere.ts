import { at, type Plank } from '../geometry';
import type { Model, Step } from '../model';

// A helicopter, nose toward +x. Two skids and two cross bars carry a cabin of lengthwise floors,
// 3 strips wide: the floor ends draw a round nose. Halfway up, the middle strip becomes the tail boom,
// which runs back past the cabin, resting on a long plank whose front end carries the mast. Above the
// boom the middle strip stays open: the windscreen in front of the mast. 3 standing planks make the
// mast, two long planks crossing on top make the rotor. A plank standing beside the tail is the tail rotor.
const Y0 = 3; // cabin floor 0
const FRONT = [7, 8, 8.5, 9, 9, 9, 9, 9, 8.5, 7.5, 6.5, 5, 3]; // front end of the side strips, floor by floor
const TOP = FRONT.length - 1;
const SIDES = [-4.5, 1.5]; // z of the 2 side strips
const BASE = 5; // floor of the long plank under the boom and the mast
const MAST = 0; // x of the mast

const side = (f: number): Plank[] => SIDES.map((z) => at('flat-x', FRONT[f] - 15, Y0 + f, z));
const middle = (f: number, x: number) => at('flat-x', x, Y0 + f, -1.5);

const rails = [-7.5, 4.5].map((z) => at('flat-x', -6, 0, z));
const struts = (y: number) => [-3, 4.5].map((x) => at('flat-z', x, y, -7.5));
const base = middle(BASE, MAST - 10.5); // its front end carries the mast
const boom = [middle(BASE + 1, MAST - 15), middle(BASE + 2, MAST - 15), middle(BASE + 3, MAST - 21)];
const mastY = Y0 + BASE + 1;
const mast = [-1.5, -0.5, 0.5].map((z) => at('up-x', MAST, mastY, z));
const rotor = [at('flat-x', MAST - 6, mastY + 15, -1.5), at('flat-z', MAST, mastY + 16, -7.5)];
const tailRotor = at('up-z', MAST - 20, 0, 1.5);

const steps: Step[] = [
  { planks: rails, hint: 'Les deux patins' },
  { planks: struts(1), hint: 'Deux barres en travers' },
  { planks: struts(2) },
  ...Array.from({ length: BASE }, (_, f) => ({
    planks: [...side(f), middle(f, FRONT[f] - 15)],
    ...(f === 0 && { hint: 'La cabine : 3 rangées, le nez bien rond' }),
  })),
  { planks: [...side(BASE), base], hint: 'Celle du milieu dépasse derrière' },
  { planks: [...side(BASE + 1), boom[0]], hint: 'La queue part vers l’arrière. Devant, le milieu reste vide : le pare-brise' },
  { planks: [...side(BASE + 2), boom[1]] },
  { planks: mast, hint: 'Le mât : 3 planchettes debout, collées' },
  { planks: [...side(BASE + 3), boom[2]], hint: 'Le bout de la queue, encore plus loin' },
  ...Array.from({ length: TOP - BASE - 3 }, (_, i) => ({
    planks: side(BASE + 4 + i),
    ...(i === 0 && { hint: 'Les côtés de la cabine, de chaque côté du mât' }),
  })),
  { planks: [rotor[0]], hint: 'Le rotor : une grande planchette sur le mât' },
  { planks: [rotor[1]], hint: 'Et une autre en croix' },
  { planks: [tailRotor], hint: 'Le petit rotor : debout par terre, contre le bout de la queue' },
];

export const helicoptere: Model = { id: 'helicoptere', name: 'Hélicoptère', theme: 'vehicules', difficulty: 2, steps };

export default helicoptere;
