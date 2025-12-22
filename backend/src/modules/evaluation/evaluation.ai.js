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
      vendor: p.vendor.company || p.vendor.name,
      cost: p.pricing.totalCost,
      currency: p.pricing.currency || "USD",
      timeline: p.timeline?.durationWeeks
        ? `${p.timeline.durationWeeks} weeks`
        : "N/A",
      complianceScore: p.aiAnalysis?.complianceScore || 0,
      strengths: (p.aiAnalysis?.strengths || []).slice(0, 3), 
      weaknesses: (p.aiAnalysis?.weaknesses || []).slice(0, 2), 
    }));

    // Concise prompt
    const prompt = `Compare proposals for: ${rfp.title}

Budget: ${rfp.budget || "N/A"} ${rfp.currency || "USD"}
Requirements: ${truncateText(rfp.requirements, 500)}

Proposals:
${JSON.stringify(proposalSummaries, null, 2)}

Provide a detailed comparison including:
1) Ranking of proposals (best to worst)
2) Key differences between proposals
3) Cost analysis
4) Timeline comparison
5) Overall recommendation

Format your response in a clear, structured way.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error("AI Comparison Error:", error);
    return "Comparative analysis unavailable due to an error. Please try again.";
  }
};

const generateRecommendation = async (proposals, rfp) => {
  try {
    // Optimize: Minimal but complete data
    const proposalData = proposals.map((p, i) => ({
      id: i + 1,
      vendor: p.vendor.company || p.vendor.name,
      cost: p.pricing.totalCost,
      currency: p.pricing.currency || "USD",
      timeline: p.timeline?.durationWeeks
        ? `${p.timeline.durationWeeks} weeks`
        : "N/A",
      complianceScore: p.aiAnalysis?.complianceScore || 0,
      evaluationScore: p.evaluationScore || 0,
    }));

    const prompt = `Analyze proposals for: ${rfp.title}

Budget: ${rfp.budget || "N/A"} ${rfp.currency || "USD"}

Proposals:
${JSON.stringify(proposalData, null, 2)}

**IMPORTANT: You MUST respond with valid JSON only. No markdown, no backticks, no extra text.**

Provide your recommendation in this EXACT JSON format:
{
  "recommendations": {
    "top_pick": {
      "proposal_id": 1,
      "vendor": "Vendor Name",
      "justification": "Detailed explanation of why this is the best choice"
    },
    "alternatives": [
      {
        "proposal_id": 2,
        "vendor": "Vendor Name",
        "reason": "Why this is a good alternative"
      }
    ],
    "key_points": [
      "Important consideration 1",
      "Important consideration 2",
      "Important consideration 3",
      "Important consideration 4"
    ]
  }
}

Respond ONLY with valid JSON. No other text.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let responseText = response.text();

    // ✅ Clean up response - remove markdown code blocks if AI adds them
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // ✅ Validate it's valid JSON
    try {
      JSON.parse(responseText);
      return responseText;
    } catch (parseError) {
      console.error("AI returned invalid JSON:", responseText);

      // Fallback: Create a basic recommendation structure
      const fallback = {
        recommendations: {
          top_pick: {
            proposal_id: 1,
            vendor: proposalData[0].vendor,
            justification:
              "Based on available data, this proposal offers the best overall value.",
          },
          alternatives: proposalData.slice(1, 3).map((p, i) => ({
            proposal_id: p.id,
            vendor: p.vendor,
            reason: `Alternative option with ${p.cost} cost and ${p.complianceScore} compliance score.`,
          })),
          key_points: [
            "Compliance and quality are critical factors",
            "Cost-effectiveness should be balanced with quality",
            "Timeline feasibility is important",
            "Vendor qualifications matter",
          ],
        },
      };
      return JSON.stringify(fallback);
    }
  } catch (error) {
    console.error("AI Recommendation Error:", error);

    // Return a valid fallback JSON
    const fallback = {
      recommendations: {
        top_pick: {
          proposal_id: 1,
          vendor: proposals[0]?.vendor?.company || "Vendor",
          justification:
            "Recommendation generation encountered an error. Please review proposals manually.",
        },
        alternatives: [],
        key_points: [
          "Manual review recommended due to technical error",
          "Consider all proposal aspects carefully",
        ],
      },
    };
    return JSON.stringify(fallback);
  }
};

module.exports = {
  compareProposals,
  generateRecommendation,
};
