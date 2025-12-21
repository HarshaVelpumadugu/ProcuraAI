const { model } = require("../../config/ai");

const truncateText = (text, maxLength = 1000) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const compareProposals = async (proposals, rfp) => {
  try {
    // Optimize: Only include essential data
    const proposalSummaries = proposals.map((p, i) => ({
      id: i + 1,
      vendor: p.vendor.company,
      cost: p.pricing.totalCost,
      score: p.aiAnalysis?.complianceScore || 0,
      strengths: (p.aiAnalysis?.strengths || []).slice(0, 2), // Top 2 only
      weaknesses: (p.aiAnalysis?.weaknesses || []).slice(0, 2),
    }));

    // Concise prompt
    const prompt = `Compare proposals for: ${rfp.title}

Budget: ${rfp.budget || "N/A"} ${rfp.currency || "USD"}
Requirements: ${truncateText(rfp.requirements, 500)}

Proposals:
${JSON.stringify(proposalSummaries, null, 2)}

Provide: 1) Ranking, 2) Key differences, 3) Recommendation`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Comparison Error:", error);
    return "Comparative analysis unavailable";
  }
};

const generateRecommendation = async (proposals, rfp) => {
  try {
    // Optimize: Minimal data
    const proposalData = proposals.map((p, i) => ({
      id: i + 1,
      vendor: p.vendor.company,
      cost: p.pricing.totalCost,
      complianceScore: p.aiAnalysis?.complianceScore || 0,
      evaluationScore: p.evaluationScore || 0,
    }));

    const prompt = `Recommend best proposal for: ${rfp.title}

Proposals:
${JSON.stringify(proposalData, null, 2)}

Provide: 1) Top pick with justification, 2) Alternatives, 3) Key points`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Recommendation Error:", error);
    return "Recommendation generation unavailable";
  }
};

module.exports = {
  compareProposals,
  generateRecommendation,
};

// const compareProposals = async (proposals, rfp) => {
//   try {
//     const proposalSummaries = proposals.map((p, index) => ({
//       id: index + 1,
//       vendor: p.vendor.company,
//       cost: p.pricing.totalCost,
//       currency: p.pricing.currency,
//       timeline: p.timeline
//         ? `${new Date(p.timeline.startDate).toLocaleDateString()} - ${new Date(
//             p.timeline.endDate
//           ).toLocaleDateString()}`
//         : "Not specified",
//       complianceScore: p.aiAnalysis?.complianceScore || 0,
//       strengths: p.aiAnalysis?.strengths || [],
//       weaknesses: p.aiAnalysis?.weaknesses || [],
//       evaluationScore: p.evaluationScore || 0,
//     }));

//     const prompt = `
//       As a procurement expert, compare these proposals for the following RFP:

//       RFP Details:
//       - Title: ${rfp.title}
//       - Requirements: ${rfp.requirements}
//       - Budget: ${rfp.budget?.min || "N/A"} - ${rfp.budget?.max || "N/A"} ${
//       rfp.budget?.currency || ""
//     }
//       - Evaluation Criteria: ${JSON.stringify(rfp.evaluationCriteria)}

//       Proposals:
//       ${JSON.stringify(proposalSummaries, null, 2)}

//       Provide:
//       1. A comparative analysis table
//       2. Ranking of proposals (best to worst)
//       3. Key differentiators between proposals
//       4. Risk assessment for each proposal
//       5. Value-for-money analysis

//       Be objective and data-driven in your analysis.
//     `;

//     // Generate content using Gemini
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const comparisonText = response.text();

//     return {
//       comparison: comparisonText,
//       proposalsCount: proposals.length,
//       generatedAt: new Date(),
//     };
//   } catch (error) {
//     console.error("AI Comparison Error:", error);
//     throw new Error("Failed to generate comparison analysis");
//   }
// };

// const generateRecommendation = async (proposals, rfp) => {
//   try {
//     const proposalData = proposals.map((p, index) => ({
//       id: index + 1,
//       vendor: p.vendor.company,
//       vendorEmail: p.vendor.email,
//       cost: p.pricing.totalCost,
//       currency: p.pricing.currency,
//       timeline: p.timeline,
//       complianceScore: p.aiAnalysis?.complianceScore || 0,
//       evaluationScore: p.evaluationScore || 0,
//       strengths: p.aiAnalysis?.strengths || [],
//       weaknesses: p.aiAnalysis?.weaknesses || [],
//       technicalApproach: p.technicalProposal.substring(0, 500) + "...",
//     }));

//     const prompt = `
//       As a senior procurement advisor, provide a final recommendation for this RFP:

//       RFP Details:
//       - Title: ${rfp.title}
//       - Requirements: ${rfp.requirements}
//       - Budget: ${rfp.budget?.min || "N/A"} - ${rfp.budget?.max || "N/A"} ${
//       rfp.budget?.currency || ""
//     }
//       - Evaluation Criteria: ${JSON.stringify(rfp.evaluationCriteria)}

//       Proposals Evaluated:
//       ${JSON.stringify(proposalData, null, 2)}

//       Provide:
//       1. Your top recommendation (which vendor to select)
//       2. Clear justification for the recommendation
//       3. Alternative options (2nd and 3rd choice)
//       4. Implementation considerations
//       5. Negotiation points to discuss with the recommended vendor
//       6. Risk mitigation strategies

//       Be specific, actionable, and business-focused.
//     `;

//     // Generate content using Gemini
//     const result = await model.generateContent(prompt);
//     const response = await result.response;
//     const recommendationText = response.text();

//     // Calculate scores
//     const scores = proposals.map((p) => {
//       const complianceWeight = 0.4;
//       const evaluationWeight = 0.4;
//       const costWeight = 0.2;

//       const maxCost = Math.max(...proposals.map((pr) => pr.pricing.totalCost));
//       const costScore =
//         maxCost > 0 ? ((maxCost - p.pricing.totalCost) / maxCost) * 100 : 0;

//       return {
//         vendor: p.vendor.company,
//         overallScore: (
//           (p.aiAnalysis?.complianceScore || 0) * complianceWeight +
//           (p.evaluationScore || 0) * evaluationWeight +
//           costScore * costWeight
//         ).toFixed(2),
//       };
//     });

//     const rankedVendors = scores.sort(
//       (a, b) => b.overallScore - a.overallScore
//     );

//     return {
//       recommendation: recommendationText,
//       scores: rankedVendors,
//       topChoice: rankedVendors[0],
//       generatedAt: new Date(),
//     };
//   } catch (error) {
//     console.error("AI Recommendation Error:", error);
//     throw new Error("Failed to generate recommendation");
//   }
// };
