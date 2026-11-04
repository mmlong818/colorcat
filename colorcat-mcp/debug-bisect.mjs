import { readFileSync } from 'node:fs';
import { z } from 'zod';
import express from 'express';
import * as E from './engine.js';
import MCU from './hct.js';

const PALETTES = JSON.parse(readFileSync('./data.json', 'utf8'));
const hex = E.parseColor('#6750A4');
const src = MCU.Hct.fromInt(MCU.argbFromHex(hex));
console.log('src:', src.hue.toFixed(1), src.chroma.toFixed(1), src.tone.toFixed(1));
const p2 = MCU.TonalPalette.fromHueAndChroma(src.hue, Math.max(src.chroma, 48));
console.log('after all imports — tone40:', MCU.hexFromArgb(p2.tone(40)).toUpperCase());
console.log('tone100:', MCU.hexFromArgb(p2.tone(100)).toUpperCase());
