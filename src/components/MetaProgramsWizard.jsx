import React from 'react';
import { META_PROGRAM_STEPS, addMetaProgramException, exceptionIds, selectedMetaOptions, spectrumPosition, metaProgramTestPrompt } from '../data/metaProgramWizard.js';
import { questionAnswer } from '../lib/narrativeMemory.js';
import './MetaProgramsWizard.css';

export function MetaProgramsSteps({ step, questions, answers, onStepChange, compact = false }) {
  return <nav className={compact ? 'mp-step-list' : 'mp-stepper'} aria-label={compact ? 'Meta Programs step shortcuts' : 'Meta Programs steps'}>
    {META_PROGRAM_STEPS.map((item, index) => {
      const answered = questions.filter(row => row.step === index && questionAnswer(row, answers)).length;
      return <button type="button" key={item.short} aria-current={index === step ? 'step' : undefined} aria-label={`Step ${index + 1}: ${item.short}`} onClick={() => onStepChange(index)}>
        <span className="mp-step-number">{index + 1}</span><span><b>{item.short}</b><small>{answered ? `${answered} recorded` : 'Not started'}</small></span>
      </button>;
    })}
  </nav>;
}

function MetaProgramField({ row, answers, onPatch }) {
  const value = answers[row.choiceAnswerKey] || '';
  const noteKey = row.textAnswerKey || row.key;
  const notes = answers[noteKey] || '';
  const id = `mp-${encodeURIComponent(row.key)}`;
  const selected = selectedMetaOptions(row, value);
  const position = spectrumPosition(row, value);
  const recognised = row.control === 'spectrum' ? position !== null : row.options?.some(option => selected.includes(option.value));
  const choose = option => onPatch({ [row.choiceAnswerKey]: option });
  const toggle = option => choose(selected.includes(option) ? selected.filter(item => item !== option).join(' | ') : [...selected, option].join(' | '));
  return <fieldset className={`mp-field mp-field-${row.control}`} data-question={row.key}>
    <legend>{row.fieldLabel || row.prompt}</legend>
    {row.control === 'spectrum' && <>
      <div className="mp-range-ends"><span>{row.ends[0]}</span><span>{row.ends[1]}</span></div>
      <input id={id} className={value ? 'mp-range' : 'mp-range is-unset'} aria-label={row.prompt} aria-describedby={`${id}-state`} aria-valuetext={value || 'Not chosen'} type="range" min="0" max="4" step="1" value={position ?? 2}
        onPointerDown={() => { if (!value) choose(row.options[2].value); }}
        onKeyDown={event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); choose(row.options[position ?? 2].value); } }}
        onChange={event => choose(row.options[Number(event.target.value)].value)} />
      <div className="mp-range-state"><output id={`${id}-state`} htmlFor={id}>{value ? row.options.find(option => option.value === value)?.label || `Saved choice: ${value}` : 'Not chosen'}</output><button type="button" className="linkbtn" onClick={() => choose('Mixed')}>Use mixed</button></div>
      {!value && <small className="mp-hint">Move the slider or choose Mixed. Leaving it untouched records no preference.</small>}
    </>}
    {['single', 'multi'].includes(row.control) && <>
      {row.control === 'multi' && <small className="mp-hint">Choose any that fit.</small>}
      <div className={`mp-options ${row.options.length > 3 ? 'mp-options-many' : ''}`}>
        {row.options.map(option => <label key={option.value} className={`mp-option${selected.includes(option.value) ? ' is-selected' : ''}`}>
          <input type={row.control === 'multi' ? 'checkbox' : 'radio'} name={id} value={option.value} checked={selected.includes(option.value)} onChange={() => row.control === 'multi' ? toggle(option.value) : choose(option.value)} />
          <span><b>{option.label}</b>{option.help && <small>{option.help}</small>}</span>
        </label>)}
      </div>
    </>}
    {value && !recognised && row.control !== 'text' && <p className="mp-legacy-value">Saved choice: {value}. Choose an option only if you want to change it.</p>}
    {row.control === 'text' ? <textarea id={id} className="field-input mp-text" aria-label={row.prompt} rows={3} value={notes} onChange={event => onPatch({ [noteKey]: event.target.value })} placeholder={row.placeholder || 'A short answer or an example is enough.'} /> : <>
      {value && <button type="button" className="linkbtn mp-clear" onClick={() => choose('')}>Clear preference</button>}
      <details className="mp-note" open={!!notes}><summary>{notes ? 'Your explanation' : 'Add a reason or example'}</summary><textarea className="field-input mp-text" aria-label={`${row.prompt} — notes`} rows={3} value={notes} onChange={event => onPatch({ [noteKey]: event.target.value })} placeholder="Why this choice, and what would other people notice?" /></details>
    </>}
    {(row.hint || row.reference) && <details className="mp-about"><summary>About this choice</summary>{row.reference && <small>{row.reference}</small>}<p>{row.hint}</p></details>}
  </fieldset>;
}

function OptionalSection({ title, rows, answers, onPatch, children }) {
  const answered = rows.some(row => questionAnswer(row, answers));
  return <details className="mp-optional" open={answered}>
    <summary>{title}{answered && <small>Has saved answers</small>}</summary>
    {children}<div className="mp-grid">{rows.map(row => <MetaProgramField key={row.key} row={row} answers={answers} onPatch={onPatch} />)}</div>
  </details>;
}

export default function MetaProgramsWizard({ step, questions, answers, onPatch, onStepChange, title, context, memory }) {
  const info = META_PROGRAM_STEPS[step];
  const fields = questions.filter(row => row.step === step && !row.section);
  const contextRows = questions.filter(row => row.section === 'context');
  const role = memory.prior.find(record => record.archetype)?.archetype?.key;
  return <section className="mp-workshop" aria-label="Meta Programs workshop">
    <MetaProgramsSteps step={step} questions={questions} answers={answers} onStepChange={onStepChange} />
    <div className="mp-page-heading"><small>Step {step + 1} of 4 · {title}</small><h3>{info.title}</h3><p>{info.hint}</p></div>
    {step === 0 && <OptionalSection title="Context and opening questions" rows={contextRows} answers={answers} onPatch={onPatch}>
      {context && <p className="mp-context">{context}</p>}<p className="mp-hint">For a relationship, describe one side here and compare the other side in your notes. For communication, consider the listener as well as the speaker.</p>
    </OptionalSection>}
    {!!memory.prior.length && <details className="mp-background"><summary>Use earlier story work{role ? ` · ${role}` : ''}</summary>{memory.prior.map((record, index) => <div key={index}><b>{record.label}</b>{record.archetype && <p>{record.archetype.descriptions.adult}</p>}{record.answers.map(row => <p key={row.key}><strong>{row.prompt}</strong><br />{row.answer}</p>)}</div>)}</details>}
    {step === 3 && <div className="mp-scene-guidance"><b>Build on your recorded choices</b><p>{metaProgramTestPrompt(answers, role)}</p><details className="mp-scene-choices"><summary>Review recorded preferences</summary><MetaProgramsSnapshot questions={questions} answers={answers} /></details></div>}
    <div className="mp-grid">{fields.map(row => <MetaProgramField key={row.key} row={row} answers={answers} onPatch={onPatch} />)}</div>
    {step === 1 && <OptionalSection title="Optional: their part in a shared task" rows={questions.filter(row => row.section === 'creativity')} answers={answers} onPatch={onPatch} />}
    {step === 2 && <OptionalSection title="Optional: words and voice" rows={questions.filter(row => row.section === 'voice')} answers={answers} onPatch={onPatch} />}
    {step === 3 && <>
      <section className="mp-exceptions" aria-label="Changes in particular situations"><h4>Do they act differently in a particular situation?</h4><p>Add a change only if it helps your story. You decide the trigger and the behaviour.</p>
        {exceptionIds(answers).map((id, index) => <section className="mp-exception" key={id}><div className="mp-exception-heading"><b>Exception {index + 1}</b><button type="button" className="linkbtn" onClick={() => onPatch({ 'mp:exceptionIds': exceptionIds(answers).filter(item => item !== id).join('|') })}>Remove exception {index + 1}</button></div><div className="mp-grid">{questions.filter(row => row.exceptionId === id).map(row => <MetaProgramField key={row.key} row={row} answers={answers} onPatch={onPatch} />)}</div></section>)}
        <button type="button" className="btn" onClick={() => onPatch(addMetaProgramException(answers))}>+ Add an exception</button>
      </section>
      <OptionalSection title="Optional: what could lead to change?" rows={questions.filter(row => row.section === 'score')} answers={answers} onPatch={onPatch}><p className="mp-hint">Inspired by S.C.O.R.E.: the problem, what causes it, the goal, useful resources, and possible effects. Your scene problem and goal above supply the first and third parts.</p></OptionalSection>
      <OptionalSection title="Optional: attention to time" rows={questions.filter(row => row.section === 'time')} answers={answers} onPatch={onPatch} />
    </>}
    <p className="mp-bottom-note">Every choice is optional. Preferences can change with the situation; your examples explain how.</p>
  </section>;
}

export function MetaProgramsSnapshot({ questions, answers }) {
  const core = questions.filter(row => row.key.startsWith('phase:') && answers[row.choiceAnswerKey]);
  if (!core.length) return null;
  return <dl className="mp-snapshot">{core.map(row => {
    const raw = answers[row.choiceAnswerKey];
    const value = selectedMetaOptions(row, raw).map(value => row.options.find(option => option.value === value)?.label || value).join(' + ');
    return <div key={row.key}><dt>{row.prompt}</dt><dd>{value}</dd></div>;
  })}</dl>;
}
