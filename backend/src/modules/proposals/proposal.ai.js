const { model } = require("../../config/ai");

// Helper function to truncate long text (saves tokens)
const truncateText = (text, maxLength = 1000) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

const analyzeProposal = async (proposal, rfp) => {
  try {
    // Optimize: Truncate long content to save tokens
    const shortRequirements = truncateText(rfp.requirements, 800);
    const shortProposal = truncateText(proposal.technicalProposal, 1200); // Concise prompt (saves ~40% tokens)

    const prompt = `Analyze proposal vs RFP requirements.

RFP Requirements:
${shortRequirements}

Proposal:
${shortProposal}

Budget: ${rfp.budget || "N/A"} ${rfp.currency || "USD"}
Cost for Proposal: ${proposal.pricing.totalCost} ${proposal.pricing.currency}

RFP Deadline: ${new Date(rfp.deadline).toLocaleDateString()}
Proposed Duration: ${proposal.timeline.durationWeeks} weeks
Estimated Completion: ${new Date(
      proposal.timeline.estimatedEndDate
    ).toLocaleDateString()}

Return ONLY valid JSON:
{
  "complianceScore": <0-100>,
  "strengths": ["point 1", "point 2"],
  "weaknesses": ["gap 1", "gap 2"],
  "summary": "short summary"
}`;
    // Generate with Flash model (fast & cheap)

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text(); // Clean response

    text = text.trim();
    if (text.startsWith("```json")) {
      text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
    } else if (text.startsWith("```")) {
      text = text.replace(/```\n?/g, "");
    } // Parse JSON

    const analysis = JSON.parse(text.trim()); // Validate fields

    return {
      complianceScore: Number(analysis.complianceScore) || 0,
      strengths: Array.isArray(analysis.strengths)
        ? analysis.strengths
        : ["Unable to analyze"],
      weaknesses: Array.isArray(analysis.weaknesses)
        ? analysis.weaknesses
        : ["Analysis error"],
      summary: analysis.summary || "Automated analysis unavailable",
    };
  } catch (error) {
    console.error("AI Proposal Analysis Error:", error);
    return {
      complianceScore: 0,
      strengths: ["Unable to analyze"],
      weaknesses: ["Analysis error"],
      summary: "Automated analysis unavailable",
    };
  }
};

module.exports = {
  analyzeProposal,
};
