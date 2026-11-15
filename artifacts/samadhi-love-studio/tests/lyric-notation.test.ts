import test from 'node:test';
import assert from 'node:assert/strict';
import {parseLyricNotation,performanceLines} from '../app/lyric-notation';
import {productionLyricChunks,applyChunkStyleCues,notationStyles} from '../app/lyric-style-cues';
import {lyricLines} from '../app/lyric-video-data';
import {performanceWeight} from '../app/song-opening';
const sample='[Style: Celestial Oud-Trance – floating electronic pulses, warm oud lines, light darbuka, deep sub-bass, male lead with female ethereal harmonies. High-vibration, luminous, never heard before]\n\n[deep male vocals with soft female repition]\nsamadhi love original sending light and love\n\n[short Intro: soft oud over distant electronic shimmer]';
test('pasted example keeps performed words and sends instructions separately',()=>{
 const original=sample, chunks=productionLyricChunks(sample,true,true);
 const sent=applyChunkStyleCues(chunks.map(c=>({...c,positive_styles:notationStyles(c.directions??[])})));
 assert.equal(sample,original);
 assert.deepEqual(performanceLines(sample),['samadhi love original sending light and love']);
 assert.deepEqual(lyricLines(sample),performanceLines(sample));
 assert.equal(performanceWeight(sample),performanceWeight('samadhi love original sending light and love'));
 assert.match(JSON.stringify(sent.map(c=>c.positive_styles)),/Celestial Oud-Trance/);
 assert.match(JSON.stringify(sent.map(c=>c.positive_styles)),/deep male vocals/);
 assert.match(JSON.stringify(sent.map(c=>c.positive_styles)),/soft oud/);
 assert.equal(sent.map(c=>c.text).join('\n'),'samadhi love original sending light and love\n[Intro]');
});
test('inline, nested and multiline directions preserve outside words and line breaks',()=>{
 const source='Love(whisper [softly])light\n[Style: warm\nsoft]\nWe {double voice} shine (oh)';
 assert.deepEqual(performanceLines(source),['Love light','We shine']);
 assert.equal(parseLyricNotation(source).directions.length,4);
 const sent=applyChunkStyleCues([{text:source,positive_styles:[] as string[]}])[0];
 assert.equal(sent.text,'Love light\nWe shine');assert.match(JSON.stringify(sent.positive_styles),/whisper/);
});
test('malformed notation blocks generation, while incomplete editor parsing remains safe',()=>{
 for(const text of ['Love [soft','Love (soft]','Love ]']){assert(parseLyricNotation(text).errors.length);assert.throws(()=>productionLyricChunks(text,true,true));}
 assert.deepEqual(performanceLines('[only directions] (no lyrics)'),[]);
});
test('directions apply globally or to the correct section even with genre reading disabled',()=>{
 const chunks=productionLyricChunks('[warm oud]\n[Verse]\nHello (deep male)\n[Chorus]\nLight [female harmonies]',false,true);
 assert.deepEqual(chunks[0].directions,['warm oud','deep male']);assert.deepEqual(chunks[1].directions,['warm oud','female harmonies']);
 const sent=applyChunkStyleCues([{text:'[Verse | genre: Jazz]\nHello (whisper)',positive_styles:[] as string[]}],false)[0];
 assert.equal(sent.text,'[Verse]\nHello');assert.match(JSON.stringify(sent.positive_styles),/whisper/);assert.doesNotMatch(JSON.stringify(sent.positive_styles),/Jazz/);
});
