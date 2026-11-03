/** CapTune §4.2.3 Eq. 1. A movable calibration knot also supports cross-axis recalibration. */
export function sliderValue(position:number, baseline:number, center=0, min=1, max=10) {
  if (![position,baseline,center,min,max].every(Number.isFinite) || position < -10 || position > 10 || center < -10 || center > 10 || min>max || baseline<min || baseline>max) throw Error("Invalid slider calibration.");
  if(position===center)return baseline;
  return position<center ? min+(position+10)/(center+10)*(baseline-min) : baseline+(position-center)/(10-center)*(max-baseline);
}
/** CapTune §4.3.3 Eqs. 2–3; collapsed axes are fixed rather than division by zero. */
export function ratios(current:number,next:number,min:number,max:number) {
  if(![current,next,min,max].every(Number.isFinite)||min>max||current<min||current>max||next<min||next>max)throw Error("Preference is outside the creator's anchors.");
  return max===min?{r:0,delta:0,fixed:true}:{r:(next-min)/(max-min),delta:(next-current)/(max-min),fixed:false};
}
export function contextWindow(start:number,duration:number){return {start:Math.max(0,start-5),end:Math.min(duration,start+5)};}

export function valueToSlider(value:number,baseline:number,center=0,min=1,max=10){
 if(![value,baseline,center,min,max].every(Number.isFinite)||value<min||value>max||baseline<min||baseline>max||center< -10||center>10)throw Error("Invalid inverse calibration.");
 if(value===baseline)return center;
 return value<baseline?-10+(value-min)/(baseline-min)*(center+10):center+(value-baseline)/(max-baseline)*(10-center);
}
