const { model } = require("../../config/ai");

const truncateText = (text, maxLength = 1000) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

// ✅ Enhanced comparison with proper error handling
const compareProposals = async (proposals, rfp) => {
  try {
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

    const prompt = `Act as a Procurement Officer Compare proposals for: ${
      rfp.title
    }

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
    const comparisonText = response.text();

    if (!comparisonText || comparisonText.trim().length === 0) {
      throw new Error("AI returned empty comparison");
    }

    return {
      success: true,
      data: comparisonText,
      error: null,
    };
  } catch (error) {
    console.error("❌ AI Comparison Error:", error.message);

    // Return structured error with fallback data
    return {
      success: false,
      data: generateFallbackComparison(proposals, rfp),
      error: {
        message: "AI comparison temporarily unavailable",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }
};

// ✅ Fallback comparison when AI fails
const generateFallbackComparison = (proposals, rfp) => {
  const sortedProposals = [...proposals].sort((a, b) => {
    const scoreA =
      (a.aiAnalysis?.complianceScore || 0) + (a.evaluationScore || 0);
    const scoreB =
      (b.aiAnalysis?.complianceScore || 0) + (b.evaluationScore || 0);
    return scoreB - scoreA;
  });

  let comparison = `# Proposal Comparison for ${rfp.title}\n\n`;
  comparison += `⚠️ Note: This is an automated fallback comparison. AI analysis is temporarily unavailable.\n\n`;
  comparison += `## Budget: ${rfp.budget || "N/A"} ${
    rfp.currency || "USD"
  }\n\n`;
  comparison += `## Proposals Summary\n\n`;

  sortedProposals.forEach((p, i) => {
    comparison += `### ${i + 1}. ${p.vendor.company || p.vendor.name}\n`;
    comparison += `- **Cost:** ${p.pricing.totalCost} ${
      p.pricing.currency || "USD"
    }\n`;
    comparison += `- **Timeline:** ${
      p.timeline?.durationWeeks || "N/A"
    } weeks\n`;
    comparison += `- **Compliance Score:** ${
      p.aiAnalysis?.complianceScore || 0
    }/100\n`;
    comparison += `- **Evaluation Score:** ${p.evaluationScore || 0}/100\n\n`;
  });

  comparison += `\n## Recommendation\n`;
  comparison += `Please review the proposals manually and use the detailed proposal information to make an informed decision.\n`;

  return comparison;
};

// ✅ Enhanced recommendation with proper error handling
const generateRecommendation = async (proposals, rfp) => {
  try {
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

    const prompt = `Act as a Procurement Officer Analyze proposals for: ${
      rfp.title
    }

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

    // Clean up response
    responseText = responseText
      .replace(/```json\n?/g, "")
      .replace(/```\n?/g, "")
      .trim();

    // Validate JSON
    const parsed = JSON.parse(responseText);

    // Validate structure
    if (!parsed.recommendations || !parsed.recommendations.top_pick) {
      throw new Error("Invalid recommendation structure");
    }

    return {
      success: true,
      data: responseText,
      error: null,
    };
  } catch (error) {
    console.error("❌ AI Recommendation Error:", error.message);

    // Return structured error with intelligent fallback
    return {
      success: false,
      data: generateFallbackRecommendation(proposals),
      error: {
        message: "AI recommendation temporarily unavailable",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
    };
  }
};

// ✅ Intelligent fallback recommendation based on scores
const generateFallbackRecommendation = (proposals) => {
  // Calculate combined scores
  const scoredProposals = proposals.map((p, i) => ({
    id: i + 1,
    vendor: p.vendor.company || p.vendor.name,
    cost: p.pricing.totalCost,
    complianceScore: p.aiAnalysis?.complianceScore || 0,
    evaluationScore: p.evaluationScore || 0,
    combinedScore:
      (p.aiAnalysis?.complianceScore || 0) + (p.evaluationScore || 0),
  }));

  // Sort by combined score
  scoredProposals.sort((a, b) => b.combinedScore - a.combinedScore);

  const fallback = {
    recommendations: {
      top_pick: {
        proposal_id: scoredProposals[0].id,
        vendor: scoredProposals[0].vendor,
        justification: `⚠️ AI recommendation is temporarily unavailable. This proposal was selected based on the highest combined compliance score (${scoredProposals[0].complianceScore}) and evaluation score (${scoredProposals[0].evaluationScore}). Please review manually for final decision.`,
        automated_selection: true,
        note: "This is an automated fallback recommendation. Manual review is strongly recommended.",
      },
      alternatives: scoredProposals.slice(1, 3).map((p) => ({
        proposal_id: p.id,
        vendor: p.vendor,
        reason: `Combined score: ${p.combinedScore}/200. Cost: ${p.cost}. Please review detailed proposal information.`,
        automated_selection: true,
      })),
      key_points: [
        "⚠️ AI analysis is temporarily unavailable",
        "Recommendations are based solely on compliance and evaluation scores",
        "Manual review of all proposals is strongly recommended",
        "Consider reviewing vendor qualifications, timeline feasibility, and detailed proposals",
        "Contact support if AI analysis continues to fail",
      ],
    },
    metadata: {
      is_fallback: true,
      fallback_reason: "AI service temporarily unavailable",
      selection_criteria: "Highest combined compliance and evaluation scores",
      generated_at: new Date().toISOString(),
    },
  };

  return JSON.stringify(fallback);
};

module.exports = {
  compareProposals,
  generateRecommendation,
};
