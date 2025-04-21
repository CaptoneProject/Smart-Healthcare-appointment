import React, { useState, useEffect } from "react";
import {
  Pill,
  RefreshCw,
  Search,
  Filter,
  Clock,
  AlertCircle,
  CheckCircle,
  FileText,
  ChevronDown,
  X,
  LucideIcon,
} from "lucide-react";
import prescriptionService, {
  Prescription,
  RefillRequest,
} from "../../services/prescriptionService";
import { toast } from "react-hot-toast";

interface PrescriptionCardProps {
  prescription: Prescription;
  onRequestRefill: (prescription: Prescription) => void;
}

interface RequestRefillModalProps {
  isOpen: boolean;
  onClose: () => void;
  prescription: Prescription | null;
  onSubmit: (data: RefillRequest) => Promise<void>;
}

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

const PrescriptionCard: React.FC<PrescriptionCardProps> = ({
  prescription,
  onRequestRefill,
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Debug to see what's happening
  console.log(
    `Rendering card for ${prescription.medication}, expanded: ${isExpanded}`
  );

  const getStatusColor = (status: string): string => {
    switch (status?.toLowerCase() || "") {
      case "active":
        return "bg-green-500/20 text-green-400";
      case "expired":
        return "bg-red-500/20 text-red-400";
      case "refill requested":
        return "bg-yellow-500/20 text-yellow-400";
      default:
        return "bg-gray-500/20 text-gray-400";
    }
  };

  // Function to toggle expanded state
  const toggleExpanded = () => {
    console.log("Toggling expanded state from", isExpanded, "to", !isExpanded);
    setIsExpanded((prevState) => !prevState);
  };

  return (
    <div
      className="relative overflow-hidden backdrop-blur-2xl bg-white/10 rounded-xl border border-white/20 p-6
      shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
      before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:rounded-xl before:opacity-20
      after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:rounded-xl after:opacity-10"
    >
      <div className="relative">
        <div className="flex justify-between items-start">
          <div className="flex items-start space-x-4">
            <div
              className={`p-2 rounded-lg ${getStatusColor(
                prescription.status
              )}`}
            >
              <Pill className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-medium text-lg text-white/90">
                {prescription.medication}
              </h3>
              <p className="text-white/60 text-sm">{prescription.dosage}</p>
              <div className="flex items-center space-x-3 mt-2">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                    prescription.status
                  )}`}
                >
                  {prescription.status}
                </span>
                <span className="text-sm text-white/60">
                  Refills:{" "}
                  {prescription.refillsRemaining ||
                    prescription.refills_remaining ||
                    0}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={toggleExpanded}
            className="text-white/60 hover:text-white/90 transition-colors z-10 relative p-2 cursor-pointer"
            aria-label={isExpanded ? "Hide details" : "Show details"}
          >
            <ChevronDown
              className={`w-5 h-5 transform transition-transform ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-white/10 space-y-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-white/60">Prescribed By</p>
                <p className="text-sm text-white/90">
                  Dr. {prescription.doctor || "Unknown"}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Prescribed Date</p>
                <p className="text-sm text-white/90">
                  {prescription.prescribedDate || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Expiry Date</p>
                <p className="text-sm text-white/90">
                  {prescription.expiryDate || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Pharmacy</p>
                <p className="text-sm text-white/90">
                  {prescription.pharmacy || "N/A"}
                </p>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-sm text-white/60">Instructions</p>
              <p className="text-sm text-white/90 mt-1">
                {prescription.instructions || "No specific instructions"}
              </p>
            </div>

            {prescription.warnings && (
              <div className="flex items-start space-x-2 p-3 bg-red-500/10 rounded-lg mt-2">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-400">{prescription.warnings}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center">
          <div className="flex space-x-2">
            <button
              onClick={toggleExpanded}
              className="flex items-center px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/60 hover:text-white/90 transition-colors z-10 relative cursor-pointer"
            >
              <FileText className="w-4 h-4 mr-2" />
              {isExpanded ? "Hide Details" : "View Details"}
            </button>
            {prescription.status === "Active" &&
              (prescription.refillsRemaining ??
                prescription.refills_remaining ??
                0) > 0 && (
                <button
                  onClick={(e) => {
                    // Stop propagation to prevent parent elements from capturing the click
                    e.stopPropagation();
                    console.log("Refill button clicked");
                    onRequestRefill(prescription);
                  }}
                  className="flex items-center px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-lg text-sm 
                  hover:bg-blue-500/30 transition-colors relative z-20 cursor-pointer"
                  style={{ pointerEvents: "auto" }} // Ensure the button captures pointer events
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Request Refill
                </button>
              )}
          </div>
          <span className="text-sm text-white/50">
            <Clock className="w-4 h-4 inline mr-1" />
            Last filled {prescription.lastFilled || "N/A"}
          </span>
        </div>
      </div>
    </div>
  );
};

const RequestRefillModal: React.FC<RequestRefillModalProps> = ({
  isOpen,
  onClose,
  prescription,
  onSubmit,
}) => {
  const [pharmacy, setPharmacy] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);


  // Reset state when modal opens
  useEffect(() => {
    if (isOpen && prescription) {
      // Pre-select the current pharmacy if available
      setPharmacy(prescription.pharmacy || "");
      setNotes("");
      console.log(
        "Modal opened for prescription:",
        prescription.id,
        prescription.medication
      );
    }
  }, [isOpen, prescription]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted");

    if (!prescription) {
      console.error("Cannot submit - prescription is null");
      return;
    }

    if (!pharmacy) {
      toast.error("Please select a pharmacy");
      return;
    }

    console.log("Submitting refill request form:", {
      prescriptionId: prescription.id,
      pharmacy,
      notes,
    });

    setIsSubmitting(true);

    try {
      await onSubmit({
        prescriptionId: prescription.id,
        pharmacy,
        notes,
      });

      onClose();
      toast.success("Refill request submitted successfully");
    } catch (error) {
      console.error("Error submitting refill request:", error);
      toast.error("Failed to submit refill request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // If modal isn't open or no prescription selected, don't render
  if (!isOpen || !prescription) return null;

  // Define click handlers with debugging
  const handlePharmacyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    console.log("Pharmacy dropdown clicked, value:", e.target.value);
    e.stopPropagation();
    setPharmacy(e.target.value);
  };

  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    console.log("Textarea changed, value length:", e.target.value.length);
    e.stopPropagation();
    setNotes(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    console.log("Form submit button clicked");
    e.preventDefault();
    e.stopPropagation();
    handleSubmit(e);
  };

  return (
    <div 
      className="fixed inset-0 flex items-center justify-center z-[100]" 
      style={{ pointerEvents: "all" }}
      onMouseMove={() => console.log("Mouse moving in modal container")}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-md"
        onClick={(e) => {
          console.log("Modal backdrop clicked");
          e.stopPropagation(); 
          onClose();
        }}
      />
      
      {/* Modal Content - Completely redesigned for better interaction */}
      <div 
        className="absolute z-[200] w-full max-w-md bg-black/30 backdrop-blur-xl rounded-xl 
          border border-white/20 shadow-lg overflow-hidden p-0"
        onClick={(e) => e.stopPropagation()}
        style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        {/* Modal Header */}
        <div className="bg-white/10 p-4 flex justify-between items-center border-b border-white/10">
          <h2 className="text-xl font-semibold text-white/90">Request Prescription Refill</h2>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white/60 hover:text-white/90 rounded-full p-1 hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Modal Body */}
        <div className="p-6 space-y-5">
          <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
            <div>
              <p className="font-medium text-white/90">{prescription.medication}</p>
              <p className="text-sm text-white/70">{prescription.dosage}</p>
            </div>
            <div className="bg-green-500/20 px-3 py-1 rounded-full">
              <span className="text-green-400 text-xs font-medium">
                {prescription.status}
              </span>
            </div>
          </div>
          
          <form id="refill-form" onSubmit={handleFormSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="pharmacy" className="block text-sm font-medium text-white/70 mb-2">
                  Select Pharmacy
                </label>
                <div 
                  className="relative"
                  onClick={() => console.log("Pharmacy container clicked")}
                >
                  <select
                    id="pharmacy"
                    value={pharmacy}
                    onChange={handlePharmacyChange}
                    onClick={() => console.log("Pharmacy select clicked")}
                    className="appearance-none w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white/90
                      focus:border-blue-500 focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">Select a pharmacy</option>
                    {prescription.pharmacy && (
                      <option value={prescription.pharmacy}>
                        {prescription.pharmacy}
                      </option>
                    )}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3">
                    <ChevronDown className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-white/70 mb-2">
                  Additional Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  value={notes}
                  onChange={handleTextAreaChange}
                  onClick={() => console.log("Textarea clicked")} // Changed from onClick={(e) => console.log("Textarea clicked")}
                  className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white/90
                    focus:border-blue-500 focus:outline-none resize-none h-24"
                  placeholder="Add any special instructions or notes..."
                ></textarea>
              </div>
            </div>
          </form>
        </div>
        
        {/* Modal Footer */}
        <div className="bg-white/5 p-4 border-t border-white/10 flex justify-end gap-3">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="px-4 py-2 border border-white/20 rounded-lg text-white/70 hover:bg-white/10"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="refill-form"
            disabled={isSubmitting || !pharmacy}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 
              disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={(e) => {
              console.log("Submit button directly clicked");
              e.stopPropagation();
              if (!isSubmitting && pharmacy) {
                handleSubmit(e);
              }
            }}
          >
            {isSubmitting ? "Submitting..." : "Submit Refill Request"}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<StatCardProps> = ({ icon: Icon, label, value }) => (
  <div
    className="relative overflow-hidden backdrop-blur-2xl bg-white/10 rounded-xl border border-white/20 p-4
    shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
    before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:rounded-xl before:opacity-20
    after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:rounded-xl after:opacity-10"
  >
    <div className="relative flex items-center space-x-3">
      <div className="p-2 bg-white/5 rounded-lg">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <p className="text-sm text-white/60">{label}</p>
        <p className="text-xl font-semibold text-white/90">{value}</p>
      </div>
    </div>
  </div>
);

const PatientPrescriptions: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>("active");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isRefillModalOpen, setIsRefillModalOpen] = useState<boolean>(false);
  const [selectedPrescription, setSelectedPrescription] =
    useState<Prescription | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch prescriptions on component mount
  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      console.log("Fetching prescriptions for patient...");

      // Debugging - log the auth token
      const token = localStorage.getItem("token");
      console.log("Auth token available:", !!token);

      const data = await prescriptionService.getPatientPrescriptions();
      console.log("Prescriptions received:", data);
      setPrescriptions(data);
    } catch (err) {
      console.error("Error fetching prescriptions:", err);
      setError("Failed to fetch prescriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  // Debug the filter functionality
  useEffect(() => {
    console.log("Current filter:", activeFilter);
    console.log(
      "Available prescriptions:",
      prescriptions.map((p) => ({
        id: p.id,
        medication: p.medication,
        status: p.status,
      }))
    );
  }, [activeFilter, prescriptions]);

  // Calculate stats
  const stats = [
    {
      icon: Pill,
      label: "Active Prescriptions",
      value: prescriptions
        .filter((p) => p.status === "Active")
        .length.toString(),
    },
    {
      icon: RefreshCw,
      label: "Pending Refills",
      value: prescriptions
        .filter((p) => p.status === "Refill Requested")
        .length.toString(),
    },
    {
      icon: CheckCircle,
      label: "Filled This Month",
      value: prescriptions
        .filter((p) => {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

          // Handle undefined or invalid lastFilled date
          if (!p.lastFilled && !p.last_filled) return false;

          try {
            const lastFilled = new Date(p.lastFilled || p.last_filled || "");
            return lastFilled > oneMonthAgo;
          } catch (e) {
            console.error(
              "Invalid date format for lastFilled:",
              p.lastFilled || p.last_filled
            );
            return false;
          }
        })
        .length.toString(),
    },
    {
      icon: AlertCircle,
      label: "Expiring Soon",
      value: prescriptions
        .filter((p) => {
          const oneMonthFromNow = new Date();
          oneMonthFromNow.setMonth(oneMonthFromNow.getMonth() + 1);

          // Handle undefined or invalid expiryDate
          if (!p.expiryDate && !p.expiry_date) return false;

          try {
            const expiryDate = new Date(p.expiryDate || p.expiry_date || "");
            return expiryDate < oneMonthFromNow && p.status === "Active";
          } catch (e) {
            console.error(
              "Invalid date format for expiryDate:",
              p.expiryDate || p.expiry_date
            );
            return false;
          }
        })
        .length.toString(),
    },
  ];

  const handleRequestRefill = (prescription: Prescription) => {
    console.log("Request refill clicked for prescription:", prescription);
    setSelectedPrescription(prescription);
    setIsRefillModalOpen(true);

    // Debug existing prescription state
    console.log(
      "Current prescription state:",
      prescriptions.find((p) => p.id === prescription.id)
    );
  };

  const handleSubmitRefill = async (data: RefillRequest): Promise<void> => {
    await prescriptionService.requestRefill(data);

    // Update the prescription status in the local state
    setPrescriptions((prevPrescriptions) =>
      prevPrescriptions.map((p) =>
        p.id === data.prescriptionId
          ? { ...p, status: "Refill Requested" as const }
          : p
      )
    );
  };

  const handleFilterClick = (filter: string) => {
    console.log("Setting filter to:", filter);
    setActiveFilter(filter);
  };

  const filteredPrescriptions = prescriptions.filter((prescription) => {
    // First, handle the 'all' filter case
    if (activeFilter === "all") {
      const matchesSearch =
        searchQuery === "" ||
        prescription.medication
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        prescription.doctor?.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesSearch;
    }

    // For other filters, normalize case for comparison
    const prescriptionStatus = prescription.status?.toLowerCase() || "";
    const currentFilter = activeFilter.toLowerCase();

    // Special case for 'refill requested' since the DB might store it as 'Refill Requested'
    let matchesFilter = false;
    if (currentFilter === "refill requested") {
      // Check for various formats of the status
      matchesFilter =
        prescriptionStatus === "refill requested" ||
        prescriptionStatus === "refill_requested" ||
        prescriptionStatus === "refillrequested";
    } else {
      matchesFilter = prescriptionStatus === currentFilter;
    }

    const matchesSearch =
      searchQuery === "" ||
      prescription.medication
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      (prescription.doctor &&
        prescription.doctor.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesFilter && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-white/90">Prescriptions</h1>
          <p className="text-white/60 mt-1">
            View and manage your prescriptions
          </p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* Filters and Search */}
      <div
        className="relative overflow-hidden backdrop-blur-2xl bg-white/10 rounded-xl border border-white/20 p-4
        shadow-[0_8px_32px_0_rgba(31,38,135,0.37)]
        before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:to-transparent before:rounded-xl before:opacity-20
        after:absolute after:inset-0 after:bg-gradient-to-b after:from-white/10 after:to-transparent after:rounded-xl after:opacity-10"
      >
        <div className="relative flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 relative z-10">
            {["all", "active", "refill requested", "expired"].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  console.log("Filter button clicked:", filter);
                  handleFilterClick(filter);
                }}
                type="button"
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 cursor-pointer relative z-10 ${
                  activeFilter === filter
                    ? "bg-blue-500/80 text-white shadow-lg border border-blue-400/20"
                    : "bg-white/5 text-white/60 hover:bg-white/10 border border-white/5"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-white/40" />
              <input
                type="text"
                placeholder="Search prescriptions..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="pl-9 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm 
                  focus:outline-none focus:border-blue-500/50 text-white placeholder-white/40
                  backdrop-blur-2xl shadow-[0_4px_16px_0_rgba(31,38,135,0.27)]"
              />
            </div>
            <button className="p-2 text-white/60 hover:text-white/90 transition-colors">
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Prescriptions List */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-red-500/10 rounded-lg">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto mb-2" />
          <p className="text-red-400">{error}</p>
          <button
            onClick={fetchPrescriptions}
            className="mt-2 px-4 py-1 bg-red-500/20 text-red-400 rounded-full"
          >
            Retry
          </button>
        </div>
      ) : filteredPrescriptions.length === 0 ? (
        <div className="text-center p-12 bg-white/5 rounded-xl border border-white/10">
          {searchQuery ? (
            <p className="text-white/60">No prescriptions match your search</p>
          ) : activeFilter !== "all" ? (
            <p className="text-white/60">
              No {activeFilter} prescriptions found
            </p>
          ) : (
            <p className="text-white/60">
              You don't have any prescriptions yet
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredPrescriptions.map((prescription) => (
            <PrescriptionCard
              key={prescription.id}
              prescription={prescription}
              onRequestRefill={handleRequestRefill}
            />
          ))}
        </div>
      )}

      {/* Refill Request Modal */}
      <RequestRefillModal
        isOpen={isRefillModalOpen}
        onClose={() => {
          setIsRefillModalOpen(false);
          setSelectedPrescription(null);
        }}
        prescription={selectedPrescription}
        onSubmit={handleSubmitRefill}
      />
    </div>
  );
};

export default PatientPrescriptions;
