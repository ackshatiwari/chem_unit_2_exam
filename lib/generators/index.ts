import type { Generator } from "../question";
import { generators as A } from "./A";
import { generators as B } from "./B";
import { generators as C } from "./C";
import { generators as D } from "./D";
import { generators as E } from "./E";
import { generators as F } from "./F";
import { generators as G } from "./G";
import { generators as H } from "./H";

/** Every question generator, keyed by sublabel id. */
export const GENERATORS: Record<string, Generator> = { ...A, ...B, ...C, ...D, ...E, ...F, ...G, ...H };
