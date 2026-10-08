/* Civic OS — transparent civic intelligence fallback.
   This is not a trained production model. It provides explainable rules until validated
   Vision/NLP/GIS services are connected. Never present its scores as model accuracy.
*/
(function(){
  const DISTRICTS=["Imphal East","Imphal West","Thoubal","Bishnupur","Churachandpur","Chandel","Tamenglong","Ukhrul","Senapati","Jiribam","Kakching","Kangpokpi","Noney","Pherzawl"];
  const ROUTES={
    "Imphal East":"PWD Imphal East Division","Imphal West":"PWD Imphal West Division",
    "Thoubal":"PWD Thoubal Division","Bishnupur":"PWD Bishnupur Division",
    "Churachandpur":"PWD Churachandpur Division","Chandel":"PWD Chandel Division",
    "Tamenglong":"PWD Tamenglong Division","Ukhrul":"PWD Ukhrul Division",
    "Senapati":"PWD Senapati Division","Jiribam":"PWD Jiribam Division",
    "Kakching":"PWD Kakching Division","Kangpokpi":"PWD Kangpokpi Division",
    "Noney":"PWD Noney Division","Pherzawl":"PWD Pherzawl Division"
  };
  const divisionFor=location=>{const raw=(location||"").toLowerCase();const hit=DISTRICTS.find(d=>raw.includes(d.toLowerCase()));return hit||""};
  const classify=text=>{const t=(text||"").toLowerCase();
    if(/flood|waterlog|drain|drainage|submerged/.test(t))return"Flooding / drainage";
    if(/street ?light|lamp|lighting|dark road/.test(t))return"Street lighting";
    if(/garbage|waste|trash|dump/.test(t))return"Waste / sanitation";
    if(/water supply|water leak|leak|pipe|pipeline/.test(t))return"Water supply";
    if(/pothole|crack|road|carriageway|surface|shoulder|culvert|damaged|damage|sink/.test(t))return"Road damage";
    return"Civic issue";
  };
  const severityFor=text=>{const t=(text||"").toLowerCase();
    if(/collapsed|impassable|blocked|deep|huge|dangerous|unsafe|accident|swerv|emergency/.test(t))return"High";
    if(/large|major|severe|school|hospital|market|heavy traffic|many vehicles/.test(t))return"High";
    if(/minor|small|slight|faded/.test(t))return"Low";
    if(/crack|damage|rough|pothole|flood|waterlog/.test(t))return"Medium";
    return"Medium";
  };
  function priorityFor(severity,text){
    const t=(text||"").toLowerCase();
    let score=severity==="High"?70:severity==="Medium"?48:25;
    if(/school|hospital|market|bus|junction|main road|highway|heavy traffic|many vehicles/.test(t))score+=12;
    if(/night|dark|children|pedestrian|swerv|accident|blocked|emergency/.test(t))score+=10;
    if(/repeat|again|days|weeks|getting worse|worse/.test(t))score+=8;
    if(/deep|huge|large|severe|major/.test(t))score+=8;
    score=Math.min(100,score);
    return {label:score>=75?"Critical":score>=55?"High":score>=35?"Medium":"Low",score};
  }
  function analyzeReport(input){
    const description=(input?.description||"").trim(),location=(input?.location||"").trim(),hasPhoto=!!input?.hasPhoto;
    const combined=description+" "+location,categoryLabel=classify(combined),severity=severityFor(combined);
    const priority=priorityFor(severity,combined),division=divisionFor(location);
    const evidenceQuality=hasPhoto&&location&&description?"Strong":hasPhoto||location?"Partial":"Weak";
    const confidence=Math.max(45,Math.min(95,(hasPhoto?24:0)+(description.length>=60?23:description.length>=25?18:11)+(location?20:0)+(division?18:0)+(severity!=="Medium"?8:5)));
    const routingConfidence=division?96:32;
    const risk=priority.score;
    const route=division?ROUTES[division]:"Jurisdiction uncertain · human verification required";
    let summary=categoryLabel==="Road damage"
      ? (priority.label==="Critical"?"Strong safety/access signals suggest urgent inspection priority.":"Road evidence indicates a maintenance issue requiring inspection.")
      :"The issue was classified as "+categoryLabel+". Confirm the responsible service channel before submission.";
    return {categoryKey:input?.categoryKey||"civic",categoryLabel,severity,priority:priority.label,priorityScore:priority.score,confidence,evidenceQuality,summary,
      routing:{division:route,confidence:routingConfidence,reason:division?"District matched from supplied location; confirm exact road jurisdiction.":"No district matched confidently. Human verification required."},
      division,risk,provider:"deterministic-fallback",modelConfidence:confidence,
      visualAnalysis:hasPhoto?"Photo attached; trained external vision model is not connected in this prototype.":"No photo supplied.",
      humanReviewRequired:true};
  }
  window.CivicLocalEngine={analyzeReport,divisionFor,classify,severityFor,priorityFor};window.analyzeReport=analyzeReport;
})();