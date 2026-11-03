/** Paired independent codes are inputs, never generated or inferred by this tool. */
export function agreement(a:string[],b:string[]){
 if(a.length!==b.length||!a.length||a.some(v=>!v.trim())||b.some(v=>!v.trim()))throw Error("Provide equal nonempty lists of aligned, completed codes from two coders.");
 const labels=[...new Set([...a,...b])],n=a.length,observed=a.filter((v,i)=>v===b[i]).length/n;
 const expected=labels.reduce((total,l)=>total+(a.filter(v=>v===l).length/n)*(b.filter(v=>v===l).length/n),0);
 return {units:n,raw_agreement:observed,expected_agreement:expected,kappa:expected===1?null:(observed-expected)/(1-expected),note:expected===1?"Kappa is undefined when expected agreement is one.":"Single-label paired units only; code each hierarchy level separately. Does not establish coder independence or coding validity."};
}
