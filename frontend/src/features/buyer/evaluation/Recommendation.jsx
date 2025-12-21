import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Award, TrendingUp, DollarSign, Clock } from "lucide-react";
import { evaluationAPI } from "../../../api/evaluation.api";
import { rfpAPI } from "../../../api/rfp.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

const Recommendation = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState(null);
  const [rfp, setRfp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendation();
  }, [id]);

  const fetchRecommendation = async () => {
    try {
      const [recData, rfpData] = await Promise.all([
        evaluationAPI.getRecommendation(id),
        rfpAPI.getById(id),
      ]);

      console.log("Fetched recommendation:", recData);
      console.log("Fetched RFP data:", rfpData);

      // Parse the recommendation JSON string
      let parsedRecommendation = null;
      if (recData.data?.recommendation) {
        try {
          // The recommendation is a JSON string, parse it
          const recommendationString = recData.data.recommendation;
          console.log("Recommendation string:", recommendationString);

          // Parse the JSON string
          parsedRecommendation = JSON.parse(recommendationString);
          console.log("Parsed recommendation:", parsedRecommendation);
        } catch (parseError) {
          console.error("Error parsing recommendation:", parseError);
          console.error(
            "Recommendation string that failed:",
            recData.data.recommendation
          );
          setError("Failed to parse recommendation data");
        }
      }

      setRecommendation({
        ...recData.data,
        parsedData: parsedRecommendation,
      });
      // FIXED: Access rfpData.data instead of rfpData
      setRfp(rfpData.data);
    } catch (err) {
      console.error("Error fetching recommendation:", err);
      setError(err.message);
    }
    setLoading(false);
  };

  if (loading) return <Loader />;

  // Extract recommendation details
  const topPick = recommendation?.parsedData?.recommendations?.top_pick;
  const alternatives =
    recommendation?.parsedData?.recommendations?.alternatives || [];
  const keyPoints =
    recommendation?.parsedData?.recommendations?.key_points || [];

  return (
    <div className="min-h-screen bg-gray-50 w-full max-w-full overflow-x-hidden">
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-3 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="flex items-start gap-2 sm:gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/buyer/rfps/${id}`)}
              className="flex-shrink-0 p-2"
            >
              <ArrowLeft size={18} className="sm:w-5 sm:h-5" />
            </Button>
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                AI Recommendation
              </h1>
              <p className="text-gray-500 mt-1 text-xs sm:text-sm lg:text-base truncate">
                {rfp?.title}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-600">
              <p className="text-sm">{error}</p>
            </div>
          )}

          {recommendation && topPick ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Recommended Vendor Card */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg sm:rounded-xl shadow-2xl p-4 sm:p-6 lg:p-8 text-white">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
                  <Award className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7" />
                  <h2 className="text-base sm:text-xl lg:text-2xl font-bold">
                    Recommended Vendor
                  </h2>
                </div>
                <p className="text-lg sm:text-2xl lg:text-3xl font-bold mb-2 break-words">
                  {topPick.vendor}
                </p>
                <p className="text-blue-100 text-xs sm:text-sm lg:text-base">
                  Proposal ID: {topPick.proposal_id}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <DollarSign className="text-green-600 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base">
                      Proposals Evaluated
                    </h3>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">
                    {recommendation.proposalsEvaluated || 0}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Total submissions analyzed
                  </p>
                </div>

                <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Award className="text-blue-600 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base">
                      Top Vendor
                    </h3>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">
                    {topPick.vendor}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Best overall match
                  </p>
                </div>

                <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100 sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="text-purple-600 w-4 h-4 sm:w-5 sm:h-5" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-xs sm:text-sm lg:text-base">
                      Alternatives
                    </h3>
                  </div>
                  <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 break-words">
                    {alternatives.length}
                  </p>
                  <p className="text-xs sm:text-sm text-gray-500 mt-1">
                    Other options available
                  </p>
                </div>
              </div>

              {/* Top Pick Justification */}
              <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100">
                <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                  Why This Vendor?
                </h3>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded">
                  <p className="text-xs sm:text-sm lg:text-base text-gray-700 leading-relaxed break-words">
                    {topPick.justification}
                  </p>
                </div>
              </div>

              {/* Alternative Vendors */}
              {alternatives.length > 0 && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Alternative Options
                  </h3>
                  <div className="space-y-4">
                    {alternatives.map((alt, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg p-4"
                      >
                        <div className="flex items-start gap-3 mb-2">
                          <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-bold text-gray-600">
                              {index + 2}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-sm sm:text-base break-words">
                              {alt.vendor}
                            </h4>
                            <p className="text-xs text-gray-500 mt-1">
                              Proposal ID: {alt.proposal_id}
                            </p>
                          </div>
                        </div>
                        <p className="text-xs sm:text-sm text-gray-600 ml-11 break-words">
                          {alt.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Considerations */}
              {keyPoints.length > 0 && (
                <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-4 sm:p-6 lg:p-8 border border-gray-100">
                  <h3 className="text-base sm:text-lg lg:text-xl font-bold text-gray-900 mb-3 sm:mb-4">
                    Key Considerations
                  </h3>
                  <ul className="space-y-2 sm:space-y-3 lg:space-y-4">
                    {keyPoints.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-2 sm:gap-3"
                      >
                        <div className="w-5 h-5 sm:w-6 sm:h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-600 text-xs sm:text-sm font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <p className="text-xs sm:text-sm lg:text-base text-gray-700 break-words">
                          {point}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/buyer/evaluation/${id}/compare`)}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  View Comparison
                </Button>
                <Button
                  onClick={() => navigate(`/buyer/rfps/${id}`)}
                  className="w-full sm:w-auto text-xs sm:text-sm"
                >
                  View RFP Details
                </Button>
              </div>
            </div>
          ) : (
            /* No Recommendation State */
            <div className="bg-white rounded-lg sm:rounded-xl shadow-lg p-6 sm:p-8 lg:p-12 text-center border border-gray-100">
              <TrendingUp className="mx-auto text-gray-400 mb-3 sm:mb-4 w-8 h-8 sm:w-10 sm:h-10" />
              <p className="text-gray-500 text-sm sm:text-base lg:text-lg mb-3 sm:mb-4">
                No recommendation available yet
              </p>
              <Button
                onClick={() => navigate(`/buyer/evaluation/${id}/compare`)}
                className="w-full sm:w-auto text-xs sm:text-sm"
              >
                Run Analysis First
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Recommendation;
