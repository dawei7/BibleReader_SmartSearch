#!/usr/bin/env node
/**
 * Update book abbreviations inside every JSON bible in public/bibles.
 * OSIS-style mapping; only updates "abbrev" when it differs.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BIBLES_DIR = path.join(__dirname,'..','public','bibles');

const MAP = {
  'Genesis':'Gen','Exodus':'Exod','Leviticus':'Lev','Numbers':'Num','Deuteronomy':'Deut','Joshua':'Josh','Judges':'Judg','Ruth':'Ruth',
  '1 Samuel':'1Sam','2 Samuel':'2Sam','1 Kings':'1Kgs','2 Kings':'2Kgs','1 Chronicles':'1Chr','2 Chronicles':'2Chr',
  'Ezra':'Ezra','Nehemiah':'Neh','Esther':'Esth','Job':'Job','Psalms':'Ps','Proverbs':'Prov','Ecclesiastes':'Eccl','Song of Solomon':'Song',
  'Isaiah':'Isa','Jeremiah':'Jer','Lamentations':'Lam','Ezekiel':'Ezek','Daniel':'Dan','Hosea':'Hos','Joel':'Joel','Amos':'Amos','Obadiah':'Obad','Jonah':'Jonah','Micah':'Mic','Nahum':'Nah','Habakkuk':'Hab','Zephaniah':'Zeph','Haggai':'Hag','Zechariah':'Zech','Malachi':'Mal',
  'Matthew':'Matt','Mark':'Mark','Luke':'Luke','John':'John','Acts':'Acts','Romans':'Rom','1 Corinthians':'1Cor','2 Corinthians':'2Cor','Galatians':'Gal','Ephesians':'Eph','Philippians':'Phil','Colossians':'Col','1 Thessalonians':'1Thess','2 Thessalonians':'2Thess','1 Timothy':'1Tim','2 Timothy':'2Tim','Titus':'Titus','Philemon':'Phlm','Hebrews':'Heb','James':'Jas','1 Peter':'1Pet','2 Peter':'2Pet','1 John':'1John','2 John':'2John','3 John':'3John','Jude':'Jude','Revelation':'Rev'
};

function updateFile(file){
  if(!file.endsWith('.json')) return;
  if(file==='index.json' || file==='report.json') return;
  const full = path.join(BIBLES_DIR,file);
  let raw; try { raw = fs.readFileSync(full,'utf-8'); } catch { return; }
  let data; try { data = JSON.parse(raw); } catch(e){ console.error('Skip (parse error):', file); return; }
  if(!Array.isArray(data)) return; // expect array of books array [{name, abbrev, chapters}]
  let changed = false;
  for(const book of data){
    if(book && book.name && MAP[book.name]){
      const want = MAP[book.name];
      if(book.abbrev !== want){ book.abbrev = want; changed = true; }
    }
  }
  if(changed){
    fs.writeFileSync(full, JSON.stringify(data,null,2));
    console.log('Updated', file);
  } else {
    console.log('No change', file);
  }
}

fs.readdirSync(BIBLES_DIR).forEach(updateFile);
