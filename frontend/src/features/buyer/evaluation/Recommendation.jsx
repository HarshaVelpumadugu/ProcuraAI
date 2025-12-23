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

      let parsedRecommendation = null;
      if (recData.data?.recommendation) {
        try {
          const recommendationString = recData.data.recommendation;
          console.log("Recommendation string:", recommendationString);
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
      setRfp(rfpData.data);
    } catch (err) {
      console.error("Error fetching recommendation:", err);
      setError(err.message);
    }
    setLoading(false);
  };

  if (loading) return <Loader />;

  const topPick = recommendation?.parsedData?.recommendations?.top_pick;
  const alternatives =
    recommendation?.parsedData?.recommendations?.alternatives || [];
  const keyPoints =
    recommendation?.parsedData?.recommendations?.key_points || [];

  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="space-y-4 sm:space-y-6">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/buyer/rfps/${id}`)}
              className="flex-shrink-0 p-2 self-start"
            >
              <ArrowLeft className="w-5 h-5 sm:w-6 sm:h-6" />
            </Button>
            <div className="flex-1 min-w-0 w-full">
              <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
                AI Recommendation
              </h1>
              <p className="text-gray-500 mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg break-words">
                {rfp?.title}
              </p>
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4 text-red-600">
              <p className="text-sm sm:text-base break-words">{error}</p>
            </div>
          )}

          {recommendation && topPick ? (
            <div className="space-y-4 sm:space-y-6">
              {/* Recommended Vendor Card */}
              <div className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 md:p-8 lg:p-10 text-white">
                <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4 lg:mb-6">
                  <Award className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10" />
                  <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
                    Recommended Vendor
                  </h2>
                </div>
                <p className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold mb-2 sm:mb-3 break-words">
                  {topPick.vendor}
                </p>
                <p className="text-blue-100 text-sm sm:text-base lg:text-lg break-words">
                  Proposal ID: {topPick.proposal_id}
                </p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-6 lg:p-8 border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <DollarSign className="text-green-600 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">
                      Proposals Evaluated
                    </h3>
                  </div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
                    {recommendation.proposalsEvaluated || 0}
                  </p>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-2">
                    Total submissions analyzed
                  </p>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-6 lg:p-8 border border-gray-100 hover:shadow-xl transition-shadow">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Award className="text-blue-600 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">
                      Top Vendor
                    </h3>
                  </div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
                    {topPick.vendor}
                  </p>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-2">
                    Best overall match
                  </p>
                </div>

                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-6 lg:p-8 border border-gray-100 hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="text-purple-600 w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7" />
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm sm:text-base lg:text-lg">
                      Alternatives
                    </h3>
                  </div>
                  <p className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 break-words">
                    {alternatives.length}
                  </p>
                  <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-2">
                    Other options available
                  </p>
                </div>
              </div>

              {/* Top Pick Justification */}
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 lg:p-10 border border-gray-100">
                <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-5 lg:mb-6">
                  Why This Vendor?
                </h3>
                <div className="bg-blue-50 border-l-4 border-blue-600 p-4 sm:p-5 lg:p-6 rounded-lg">
                  <p className="text-sm sm:text-base lg:text-lg text-gray-700 leading-relaxed break-words">
                    {topPick.justification}
                  </p>
                </div>
              </div>

              {/* Alternative Vendors */}
              {alternatives.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 lg:p-10 border border-gray-100">
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-5 lg:mb-6">
                    Alternative Options
                  </h3>
                  <div className="space-y-4 sm:space-y-5 lg:space-y-6">
                    {alternatives.map((alt, index) => (
                      <div
                        key={index}
                        className="border border-gray-200 rounded-lg sm:rounded-xl p-4 sm:p-5 lg:p-6 hover:border-gray-300 transition-colors"
                      >
                        <div className="flex items-start gap-3 sm:gap-4 mb-3">
                          <div className="w-8 h-8 sm:w-10 sm:h-10 lg:w-12 lg:h-12 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                            <span className="text-sm sm:text-base lg:text-lg font-bold text-gray-600">
                              {index + 2}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-gray-900 text-base sm:text-lg lg:text-xl break-words">
                              {alt.vendor}
                            </h4>
                            <p className="text-xs sm:text-sm lg:text-base text-gray-500 mt-1 break-words">
                              Proposal ID: {alt.proposal_id}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-600 ml-0 sm:ml-14 break-words leading-relaxed">
                          {alt.reason}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Considerations */}
              {keyPoints.length > 0 && (
                <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-5 sm:p-6 md:p-8 lg:p-10 border border-gray-100">
                  <h3 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-4 sm:mb-5 lg:mb-6">
                    Key Considerations
                  </h3>
                  <ul className="space-y-3 sm:space-y-4 lg:space-y-5">
                    {keyPoints.map((point, index) => (
                      <li
                        key={index}
                        className="flex items-start gap-3 sm:gap-4"
                      >
                        <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                          <span className="text-blue-600 text-xs sm:text-sm lg:text-base font-bold">
                            {index + 1}
                          </span>
                        </div>
                        <p className="text-sm sm:text-base lg:text-lg text-gray-700 break-words leading-relaxed flex-1">
                          {point}
                        </p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 sm:gap-4 pt-2">
                <Button
                  variant="outline"
                  onClick={() => navigate(`/buyer/rfps/${id}/compare`)}
                  className="w-full sm:w-auto text-sm sm:text-base px-6 py-3"
                >
                  View Comparison
                </Button>
                <Button
                  onClick={() => navigate(`/buyer/rfps/${id}`)}
                  className="w-full sm:w-auto text-sm sm:text-base px-6 py-3"
                >
                  View RFP Details
                </Button>
              </div>
            </div>
          ) : (
            /* No Recommendation State */
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-8 sm:p-10 md:p-12 lg:p-16 text-center border border-gray-100">
              <TrendingUp className="mx-auto text-gray-400 mb-4 sm:mb-6 w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20" />
              <p className="text-gray-500 text-base sm:text-lg lg:text-xl mb-5 sm:mb-6 lg:mb-8">
                No recommendation available yet
              </p>
              <Button
                onClick={() => navigate(`/buyer/rfps/${id}/compare`)}
                className="w-full sm:w-auto text-sm sm:text-base px-6 py-3"
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
