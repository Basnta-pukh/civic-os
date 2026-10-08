/* Civic OS — deterministic civic intelligence fallback
   Contract: transparent, explainable, safe when no external AI provider is connected.
   Replace/augment this adapter with validated Vision/NLP providers later.
*/
(function(){
  const DISTRICTS=[
    "Imphal East","Imphal West","Thoubal","Bishnupur","Churachandpur",
    "Chandel","Tamenglong","Ukhrul","Senapati","Jiribam","Kakching",
    "Kangpokpi","Noney","Pherzawl"
  ];

  const divisionFor=(location)=>{
    const raw=(location||"").toLowerCase();
    const hit=DISTRICTS.find(d=>raw.includes(d.toLowerCase()));
    return hit||"";
  };

  function classify(text){
    const t=(text||"").toLowerCase();
    if(/flood|waterlog|drain|drainage|submerged/.test(t)) return "Flooding / drainage";
    if(/street ?light|lamp|lighting|dark road/.test(t)) return "Street lighting";
    if(/garbage|waste|trash|dump/.test(t)) return "Waste / sanitation";
    if(/water supply|water leak|leak|pipe|pipeline/.test(t)) return "Water supply";
    if(/pothole|crack|road|carriageway|surface|shoulder|culvert|damaged|damage|sink/.test(t)) return "Road damage";
    return "Civic issue";
  }

  function severityFor(text){
    const t=(text||"").toLowerCase();
    if(/deep|huge|large|danger|dangerous|unsafe|blocked|accident|swerv|hospital|emergency|school|collapsed|impassable/.test(t)) return "High";
    if(/crack|damage|rough|faded|minor|small|slight/.test(t)) return /minor|small|slight|faded/.test(t) ? "Low" : "Medium";
    return "Medium";
  }

  function priorityFor(severity,text){
    const t=(text||"").toLowerCase();
    if(severity==="High") return "High";
    if(severity==="Low") return "Low";
    if(/many vehicles|heavy traffic|market|school|hospital|emergency|blocked/.test(t)) return "High";
    return "Medium";
  }

  function analyzeReport(input){
    const description=(input?.description||"").trim();
    const location=(input?.location||"").trim();
    const hasPhoto=!!input?.hasPhoto;
    const combined=description+" "+location;
    const categoryLabel=classify(combined);
    const severity=severityFor(combined);
    const priority=priorityFor(severity,combined);
    const division=divisionFor(location);

    const evidenceQuality=hasPhoto&&location&&description ? "Strong" : hasPhoto||location ? "Partial" : "Weak";
    const confidence=Math.max(45,Math.min(94,
      (hasPhoto?22:0)+(description.length>=45?22:description.length>=18?16:9)+
      (location?20:0)+(division?18:0)+(severity!=="Medium"?8:5)
    ));

    let summary;
    if(categoryLabel==="Road damage"){
      summary=severity==="High"
        ? "Road evidence contains strong safety or access signals and should be reviewed promptly."
        : "Road evidence indicates a maintenance issue that should be reviewed.";
    }else{
      summary="The description was classified as "+categoryLabel+". Confirm the responsible service channel before submission.";
    }

    const routingConfidence=division ? 88 : 42;
    return {
      categoryKey:input?.categoryKey||"civic",
      categoryLabel,severity,priority,confidence,
      evidenceQuality,summary,
      routing:{
        division:division || "Jurisdiction uncertain · human verification required",
        confidence:routingConfidence,
        reason:division
          ? "District signal found in the supplied location."
          : "No district could be identified confidently from the supplied location."
      },
      division,
      risk:severity==="High"?90:severity==="Medium"?65:35,
      provider:"deterministic-fallback",
      modelConfidence:confidence,
      visualAnalysis:hasPhoto ? "Photo supplied; external vision model not connected." : "No photo supplied.",
      humanReviewRequired:true
    };
  }

  window.CivicLocalEngine={analyzeReport,divisionFor,classify,severityFor,priorityFor};
  window.analyzeReport=analyzeReport;
})();
