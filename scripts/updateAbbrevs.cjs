#!/usr/bin/env node
/** Update book abbreviations inside every JSON bible in public/bibles. */
const fs = require('fs');
const path = require('path');
const BIBLES_DIR = path.join(__dirname,'..','public','bibles');
const MAP = {
  'Genesis':'Gen','Exodus':'Exo','Leviticus':'Lev','Numbers':'Num','Deuteronomy':'Deu','Joshua':'Josh','Judges':'Judg','Ruth':'Ruth',
  '1 Samuel':'1Sam','2 Samuel':'2Sam','1 Kings':'1Kin','2 Kings':'2Kin','1 Chronicles':'1Chr','2 Chronicles':'2Chr',
  'Ezra':'Ezr','Nehemiah':'Neh','Esther':'Esth','Job':'Job','Psalms':'Ps','Proverbs':'Prov','Ecclesiastes':'Eccl','Song of Solomon':'Song',
  'Isaiah':'Isa','Jeremiah':'Jer','Lamentations':'Lam','Ezekiel':'Ezek','Daniel':'Dan','Hosea':'Hos','Joel':'Joel','Amos':'Am','Obadiah':'Oba','Jonah':'Jon','Micah':'Mic','Nahum':'Nah','Habakkuk':'Hab','Zephaniah':'Zeph','Haggai':'Hag','Zechariah':'Zech','Malachi':'Mal',
  'Matthew':'Mat','Mark':'Mar','Luke':'Luk','John':'John','Acts':'Acts','Romans':'Rom','1 Corinthians':'1Cor','2 Corinthians':'2Cor','Galatians':'Gal','Ephesians':'Eph','Philippians':'Phil','Colossians':'Col','1 Thessalonians':'1Ths','2 Thessalonians':'2Ths','1 Timothy':'1Tim','2 Timothy':'2Tim','Titus':'Tit','Philemon':'Phlm','Hebrews':'Heb','James':'Jam','1 Peter':'1Pet','2 Peter':'2Pet','1 John':'1Jn','2 John':'2Jn','3 John':'3Jn','Jude':'Jude','Revelation':'Rev'
};
function updateFile(file){
  if(!file.endsWith('.json')) return;
  if(file==='index.json' || file==='report.json') return;
  const full = path.join(BIBLES_DIR,file);
  let raw; try { raw = fs.readFileSync(full,'utf-8'); } catch { return; }
  let data; try { data = JSON.parse(raw); } catch { console.error('Skip (parse error):', file); return; }
  if(!Array.isArray(data)) return;
  let changed=false;
  for(const book of data){
    if(book && book.name && MAP[book.name]){
      const want = MAP[book.name];
      if(book.abbrev !== want){ book.abbrev = want; changed=true; }
    }
  }
  if(changed){ fs.writeFileSync(full, JSON.stringify(data,null,2)); console.log('Updated', file); }
  else console.log('No change', file);
}
fs.readdirSync(BIBLES_DIR).forEach(updateFile);
