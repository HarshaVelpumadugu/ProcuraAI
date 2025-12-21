const openai = require("../../config/ai");

const generateRFPSummary = async (rfpData) => {
  try {
    const prompt = `
      Summarize the following RFP in a clear and concise manner:
      
      Title: ${rfpData.title}
      Description: ${rfpData.description}
      Requirements: ${rfpData.requirements}
      Budget: ${rfpData.budget?.min || "N/A"} - ${
      rfpData.budget?.max || "N/A"
    } ${rfpData.budget?.currency || ""}
      Deadline: ${rfpData.deadline}
      
      Provide a brief summary highlighting key points.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("AI Summary Error:", error);
    return null;
  }
};

const suggestVendors = async (rfpData, vendors) => {
  try {
    const vendorList = vendors.map((v) => ({
      name: v.name,
      company: v.company,
      categories: v.categories,
      capabilities: v.capabilities,
    }));

    const prompt = `
      Based on the following RFP requirements, suggest the most suitable vendors from the list:
      
      RFP Title: ${rfpData.title}
      RFP Category: ${rfpData.category}
      Requirements: ${rfpData.requirements}
      
      Available Vendors:
      ${JSON.stringify(vendorList, null, 2)}
      
      Provide a ranked list of top 5 vendors with brief explanations.
    `;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 500,
    });

    return completion.choices[0].message.content;
  } catch (error) {
    console.error("AI Vendor Suggestion Error:", error);
    return null;
  }
};

module.exports = {
  generateRFPSummary,
  suggestVendors,
};
