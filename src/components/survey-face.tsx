// Decorative support for the adjacent visible text label; never the sole answer cue.
export function Face({value}:{value:number}){
 const mouths=['M 9 23 Q 16 13 23 23','M 9 22 Q 16 17 23 22','M 9 21 H 23','M 9 19 Q 16 25 23 19','M 9 18 Q 16 29 23 18'];
 return <svg data-survey-face={value} width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" focusable="false">
  <circle cx="16" cy="16" r="14"/>
  <circle cx="11" cy="12" r="1" fill="currentColor"/>
  <circle cx="21" cy="12" r="1" fill="currentColor"/>
  <path d={mouths[value-1]||mouths[2]}/>
 </svg>;
}
