import React, { useState, useEffect } from "react";
import { Users, Search, Mail, Phone, Building2, RefreshCw } from "lucide-react";
import { vendorAPI } from "../../../api/vendor.api";
import Button from "../../../components/common/Button";
import Loader from "../../../components/common/Loader";

const VendorList = () => {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const res = await vendorAPI.getAll();
      setVendors(res.data.vendors);
    } catch (err) {
      console.error("Error fetching vendors:", err);
    }
    setLoading(false);
  };

  const filteredVendors = vendors.filter(
    (vendor) =>
      vendor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      vendor.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <Loader />;

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">
            Registered Vendors
          </h1>
          <p className="text-sm sm:text-base text-gray-500 mt-1">
            View all vendors registered in the system
          </p>
        </div>
        <Button variant="outline" onClick={fetchVendors}>
          <RefreshCw size={20} />
          Refresh
        </Button>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-4 sm:p-6">
        <div className="mb-4 sm:mb-6">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={20}
            />
            <input
              type="text"
              placeholder="Search vendors by name, email, or company..."
              className="w-full pl-10 pr-4 py-2 sm:py-3 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Count Display */}
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs sm:text-sm text-gray-600">
            Showing{" "}
            <span className="font-semibold">{filteredVendors.length}</span> of{" "}
            <span className="font-semibold">{vendors.length}</span> vendors
          </p>
        </div>

        {/* Vendor Cards Grid - Fully Responsive */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor._id}
              className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border-2 border-gray-100 hover:border-blue-300 hover:shadow-xl transition-all"
            >
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg">
                  <Users className="text-white" size={24} />
                </div>
                <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                  Active
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-1 break-words">
                {vendor.name}
              </h3>

              {vendor.company && (
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-3">
                  <Building2 size={14} className="flex-shrink-0" />
                  <span className="font-medium truncate">{vendor.company}</span>
                </div>
              )}

              <div className="space-y-2 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                  <Mail size={14} className="flex-shrink-0" />
                  <a
                    href={`mailto:${vendor.email}`}
                    className="hover:text-blue-600 transition-colors truncate"
                  >
                    {vendor.email}
                  </a>
                </div>

                {vendor.phone && (
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600">
                    <Phone size={14} className="flex-shrink-0" />
                    <a
                      href={`tel:${vendor.phone}`}
                      className="hover:text-blue-600 transition-colors"
                    >
                      {vendor.phone}
                    </a>
                  </div>
                )}
              </div>

              {vendor.createdAt && (
                <div className="mt-3 sm:mt-4 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500">
                    Registered:{" "}
                    {new Date(vendor.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredVendors.length === 0 && (
          <div className="text-center py-8 sm:py-12">
            <Users className="mx-auto text-gray-400 mb-4" size={40} />
            <p className="text-gray-500 text-base sm:text-lg mb-2">
              {searchTerm
                ? "No vendors found matching your search"
                : "No vendors registered yet"}
            </p>
            <p className="text-gray-400 text-xs sm:text-sm">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Vendors will appear here once they register"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorList;
