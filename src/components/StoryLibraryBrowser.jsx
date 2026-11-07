import React,{useState} from 'react';
import NarrativeLibraryBrowser from './NarrativeLibraryBrowser.jsx';
import { buildStoryLibrarySections,buildGameContentSections, STORY_LIBRARY_MODES } from '../lib/narrativeLibrary.js';

export default function StoryLibraryBrowser({ library, mode = 'tools', onPick, onClose, includeSubnodes = true, inline = false, headerAction,game,onPickGame,onDeleteGame }) {
  const [source,setSource]=useState('game');
  const meta = STORY_LIBRARY_MODES[mode];
  const switchable=mode==='content'&&!!game&&!!onPickGame,gameView=switchable&&source==='game';
  const sections = gameView?buildGameContentSections(game,onPickGame,onDeleteGame):buildStoryLibrarySections(library, mode, onPick, { includeSubnodes });
  return <NarrativeLibraryBrowser title={meta.title} subtitle={switchable?(gameView?'Game · '+(game.meta?.name||'Current game'):'Database · reusable saved content'):meta.subtitle} sections={sections} onClose={onClose} categoryPane={mode === 'content'} cardVariant={mode === 'content' ? 'asset' : 'reference'} inline={inline}
    headerAction={switchable?<div className="library-content-header-actions">{headerAction}<div className="library-content-source" aria-label="Created content source">{[['game','Game'],['database','Database']].map(([id,label])=><button type="button" key={id} aria-pressed={source===id} onClick={()=>setSource(id)}>{label}</button>)}</div></div>:headerAction}
    searchLabel={switchable?(gameView?'Search game content':'Search database'):'Search library'} searchPlaceholder={switchable?(gameView?'Search this game…':'Search database…'):'Search library...'}
    emptyMessage={gameView?'No created story content in this game yet.':mode === 'content' ? 'No created content saved yet. Save a character, place, group, conversation or other narrative content to the library to find it here.' : 'No story tools match this search.'} />;
}
