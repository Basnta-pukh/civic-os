"use strict";
(()=> {
 const DISTRICTS=["Imphal East","Imphal West","Thoubal","Bishnupur","Churachandpur","Chandel","Tamenglong","Ukhrul","Senapati","Jiribam","Kakching","Kangpokpi","Noney","Pherzawl"];
 const ROUTES=Object.fromEntries(DISTRICTS.map(d=>[d,"PWD "+d+" Division"]));
 const first=(t,arr)=>arr.find(x=>t.includes(x));
 function analyzeReport(input={}){
   const text=((input.description||"")+" "+(input.location||"")).toLowerCase();
   const category=first(text,["flood","waterlog","drainage"])?"Flooding / drainage":first(text,["light","lamp","dark"])?"Street lighting":first(text,["garbage","waste","trash","litter"])?"Waste / sanitation":"Road damage";
   const severity=/(collapsed|impassable|blocked|deep|huge|dangerous|unsafe|accident|emergency|major|severe)/.test(text)?"High":/(minor|small|slight|faded)/.test(text)?"Low":/(crack|damage|rough|pothole|flood|waterlog)/.test(text)?"Medium":"Medium";
   let priority=severity==="High"?70:severity==="Medium"?48:25;
   if(/school|hospital|market|bus|junction|main road|highway|heavy traffic|many vehicles/.test(text)) priority+=12;
   if(/night|dark|children|pedestrian|swerving|accident|blocked|emergency/.test(text)) priority+=10;
   if(/repeat|again|days|weeks|getting worse|worse/.test(text)) priority+=8;
   if(/deep|huge|large|severe|major/.test(text)) priority+=8;
   priority=Math.min(100,priority);
   const district=DISTRICTS.find(d=>text.includes(d.toLowerCase()));
   const routing=district?{division:ROUTES[district],confidence:96,reason:"District match found; exact road-segment jurisdiction still needs confirmation."}:{division:"Jurisdiction uncertain · human verification required",confidence:32,reason:"No supported district match found in the supplied text."};
   let confidence=45+(input.hasPhoto?24:0)+(input.description?.length>80?23:input.description?.length>35?18:11)+(input.location?20:0)+(district?18:0)+(severity!=="Medium"?8:5);
   confidence=Math.min(95,confidence);
   return {category,severity,priorityScore:priority,risk:priority,modelConfidence:confidence,confidence,visualAnalysis:input.hasPhoto?"Evidence attached; visual classification requires a validated vision model.":"No image evidence supplied.",routing,humanReviewRequired:true};
 }
 window.CivicLocalEngine={analyzeReport};
})();