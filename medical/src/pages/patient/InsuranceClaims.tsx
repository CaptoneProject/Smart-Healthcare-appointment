import React, { useState, useEffect } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash,
  CheckCircle,
  AlertCircle,
  FileText,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { PageHeader } from "../../components/ui/PageHeader";
import { ModalPortal } from "../../components/ui/ModalPortal";
import { Card } from "../../components/ui/Card";
import { useAuth } from "../../context/AuthContext";
import { toast } from "react-toastify";
import {
  insuranceService,
  InsuranceClaim,
  InsuranceClaimFormData,
} from "../../services/insuranceService";
import { formatDate } from "../../utils/dateTime";
import api from "../../services/api";

interface Invoice {
  id: number;
  description: string;
  amount: number;
  status: string;
  created_at: string;
}

const getFileNameFromUrl = (url: string): string => {
  const parts = url.split("/");
  const fileName = parts.pop();
  if (fileName) {
    try {
      return decodeURIComponent(fileName);
    } catch (e) {
      return fileName; // If decoding fails, return the raw filename
    }
  }
  return "Unknown file"; // Fallback
};

const InsuranceClaims: React.FC = () => {
  const { user } = useAuth();
  const [claims, setClaims] = useState<InsuranceClaim[]>([]);
  const [filteredClaims, setFilteredClaims] = useState<InsuranceClaim[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(5);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<InsuranceClaim | null>(
    null
  );

  // Form data
  const [formData, setFormData] = useState<InsuranceClaimFormData>({
    invoiceId: 0,
    insuranceProvider: "",
    policyNumber: "",
    claimAmount: 0,
    notes: "",
  });

  // Document upload
  const [documentUrls, setDocumentUrls] = useState<string[]>([]);
  const [uploadingDocuments, setUploadingDocuments] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    if (user?.id) {
      fetchData();
    }
  }, [user]);

  useEffect(() => {
    // Apply filters and search
    if (!claims.length) {
      setFilteredClaims([]);
      return;
    }

    let filtered = [...claims];

    // Apply status filter
    if (activeFilter !== "all") {
      filtered = filtered.filter(
        (claim) => claim.status.toLowerCase() === activeFilter
      );
    }

    // Apply search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (claim) =>
          claim.insurance_provider?.toLowerCase().includes(query) ||
          false ||
          claim.claim_reference?.toLowerCase().includes(query) ||
          false ||
          claim.invoice_description?.toLowerCase().includes(query) ||
          false
      );
    }

    setFilteredClaims(filtered);
  }, [claims, activeFilter, searchQuery]);

  // Update totalPages when filtered claims change
  useEffect(() => {
    const newTotalPages = Math.max(
      1,
      Math.ceil(filteredClaims.length / itemsPerPage)
    );
    setTotalPages(newTotalPages);

    // If current page is out of bounds after filtering, reset to page 1
    if (currentPage > newTotalPages) {
      setCurrentPage(1);
    }
  }, [filteredClaims, itemsPerPage]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch claims
      const claimsData = await insuranceService.getPatientClaims(
        user?.id as number
      );
      setClaims(claimsData);

      // Fetch paid/approved invoices for creating new claims
      const response = await api.get(`/payments/invoices/patient/${user?.id}`);
      const invoicesData = response.data;

      // Filter to only include paid or approved invoices (you can adjust the logic as needed)
      const eligibleInvoices = invoicesData.filter(
        (invoice: any) =>
          invoice.status === "paid" || invoice.status === "approved"
      );
      setInvoices(eligibleInvoices);

      setErrorMessage(null);
    } catch (err) {
      console.error("Error fetching data:", err);
      setErrorMessage("Failed to load data. Please try again.");
      toast.error("An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({
      invoiceId: invoices[0]?.id || 0,
      insuranceProvider: "",
      policyNumber: "",
      claimAmount: 0,
      notes: "",
    });
    setIsCreateModalOpen(true);
  };

  const openEditModal = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setFormData({
      invoiceId: claim.invoice_id,
      insuranceProvider: claim.insurance_provider,
      policyNumber: claim.policy_number,
      claimAmount: claim.claim_amount,
      notes: claim.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setIsDeleteModalOpen(true);
  };

  const openSubmitModal = (claim: InsuranceClaim) => {
    setSelectedClaim(claim);
    setDocumentUrls([]);
    setIsSubmitModalOpen(true);
  };

  const handleCreateClaim = async () => {
    // Add validation before proceeding
    if (!formData.invoiceId) {
      toast.error("Please select an invoice");
      return;
    }

    if (!formData.insuranceProvider.trim()) {
      toast.error("Insurance provider is required");
      return;
    }
    
    // Add insurance provider length validation
    if (formData.insuranceProvider.length > 100) {
      toast.error("Insurance provider name cannot exceed 100 characters");
      return;
    }

    if (!formData.policyNumber.trim()) {
      toast.error("Policy number is required");
      return;
    }
    
    // Add policy number length validation
    if (formData.policyNumber.length > 50) {
      toast.error("Policy number cannot exceed 50 characters");
      return;
    }

    if (formData.claimAmount <= 0) {
      toast.error("Claim amount must be greater than zero");
      return;
    }
    
    // Check decimal places
    const decimalPlaces = formData.claimAmount.toString().split('.')[1]?.length || 0;
    if (decimalPlaces > 2) {
      toast.error("Claim amount cannot have more than 2 decimal places");
      return;
    }
    
    // Check maximum amount
    const MAX_CLAIM_AMOUNT = 999999.99;
    if (formData.claimAmount > MAX_CLAIM_AMOUNT) {
      toast.error(`Claim amount cannot exceed $${MAX_CLAIM_AMOUNT.toLocaleString()}`);
      return;
    }
    
    // Get selected invoice to check against total
    const selectedInvoice = invoices.find(invoice => invoice.id === formData.invoiceId);
    if (selectedInvoice && formData.claimAmount > selectedInvoice.amount) {
      toast.error("Claim amount cannot exceed invoice total");
      return;
    }

    try {
      await insuranceService.createClaim(formData);
      toast.success("Insurance claim created successfully");
      setIsCreateModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Error creating claim:", err);
      
      // More specific error handling for duplicate claims
      if (err.response?.status === 409) {
        toast.error("A claim for this invoice already exists");
      } else {
        toast.error(err.response?.data?.message || "Failed to create insurance claim");
      }
    }
  };

  const handleUpdateClaim = async () => {
    if (!selectedClaim) return;

    // Add validation before proceeding
    if (formData.insuranceProvider !== undefined && !formData.insuranceProvider.trim()) {
      toast.error("Insurance provider is required");
      return;
    }
    
    // Add insurance provider length validation
    if (formData.insuranceProvider && formData.insuranceProvider.length > 100) {
      toast.error("Insurance provider name cannot exceed 100 characters");
      return;
    }

    if (formData.policyNumber !== undefined && !formData.policyNumber.trim()) {
      toast.error("Policy number is required");
      return;
    }
    
    // Add policy number length validation
    if (formData.policyNumber && formData.policyNumber.length > 50) {
      toast.error("Policy number cannot exceed 50 characters");
      return;
    }

    if (formData.claimAmount !== undefined && formData.claimAmount <= 0) {
      toast.error("Claim amount must be greater than zero");
      return;
    }
    
    // Check decimal places
    if (formData.claimAmount !== undefined) {
      const decimalPlaces = formData.claimAmount.toString().split('.')[1]?.length || 0;
      if (decimalPlaces > 2) {
        toast.error("Claim amount cannot have more than 2 decimal places");
        return;
      }
      
      // Check maximum amount
      const MAX_CLAIM_AMOUNT = 999999.99;
      if (formData.claimAmount > MAX_CLAIM_AMOUNT) {
        toast.error(`Claim amount cannot exceed $${MAX_CLAIM_AMOUNT.toLocaleString()}`);
        return;
      }
      
      // Check against invoice total
      if (selectedClaim && formData.claimAmount > (selectedClaim.invoice_amount || 0)) {
        toast.error("Claim amount cannot exceed invoice total");
        return;
      }
    }

    try {
      await insuranceService.updateClaim(selectedClaim.id, formData);
      toast.success("Insurance claim updated successfully");
      setIsEditModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error("Error updating claim:", err);
      toast.error(err.response?.data?.message || "Failed to update insurance claim");
    }
  };

  const handleDeleteClaim = async () => {
    if (!selectedClaim) return;

    try {
      await insuranceService.deleteClaim(selectedClaim.id);
      toast.success("Insurance claim deleted successfully");
      setIsDeleteModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Error deleting claim:", err);
      toast.error("Failed to delete insurance claim");
    }
  };

  const handleSubmitClaim = async () => {
    if (!selectedClaim) return;

    try {
      setUploadingDocuments(true);

      // Here you would normally upload the files first,
      // but for this example, we'll just use the URLs directly
      // In a real app, you'd use a file upload service

      await insuranceService.submitClaim(selectedClaim.id, documentUrls);
      toast.success("Insurance claim submitted successfully");
      setIsSubmitModalOpen(false);
      fetchData();
    } catch (err) {
      console.error("Error submitting claim:", err);
      toast.error("Failed to submit insurance claim");
    } finally {
      setUploadingDocuments(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      setUploadingFiles(true);
      setUploadProgress(0);

      // Process each file sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const formData = new FormData();
        formData.append("file", file);

        // Set a simulated progress for UX feedback
        setUploadProgress(Math.round((i / files.length) * 50));

        // Use the medical records upload endpoint, but modify it for insurance docs
        const response = await api.post(
          "/insurance/documents/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        if (response.data) {
          const url = response.data.fileUrl || response.data.location;
          if (url) {
            setDocumentUrls((prev) => [...prev, url]);
          } else {
            console.error("No file URL in response:", response.data);
            toast.warning(
              `Upload succeeded but URL is missing for ${file.name}`
            );
          }
        }

        // Update progress
        setUploadProgress(Math.round(((i + 1) / files.length) * 100));
      }

      toast.success("Files uploaded successfully");
    } catch (error) {
      console.error("Error uploading files:", error);
      toast.error("Failed to upload files");
    } finally {
      setUploadingFiles(false);
      setUploadProgress(0);
    }
  };

  const removeDocument = (url: string) => {
    setDocumentUrls(documentUrls.filter((docUrl) => docUrl !== url));
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case "draft":
        return (
          <span className="bg-gray-200/20 text-gray-300 px-2 py-1 rounded-full text-xs">
            Draft
          </span>
        );
      case "submitted":
        return (
          <span className="bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full text-xs">
            Submitted
          </span>
        );
      case "approved":
        return (
          <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs">
            Approved
          </span>
        );
      case "rejected":
        return (
          <span className="bg-red-500/20 text-red-400 px-2 py-1 rounded-full text-xs">
            Rejected
          </span>
        );
      case "reimbursed":
        return (
          <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded-full text-xs">
            Reimbursed
          </span>
        );
      default:
        return (
          <span className="bg-gray-200/20 text-gray-300 px-2 py-1 rounded-full text-xs">
            {status}
          </span>
        );
    }
  };

  const paginatedClaims = filteredClaims.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Insurance Claims"
        description="Manage and submit insurance claims for your medical expenses"
        action={
          <Button
            variant="primary"
            size="md"
            icon={<Plus className="w-4 h-4" />}
            onClick={openCreateModal}
          >
            New Claim
          </Button>
        }
      />

      <Card className="p-6">
        <div className="flex flex-col md:flex-row justify-between mb-6 space-y-4 md:space-y-0">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
            <input
              type="text"
              placeholder="Search claims..."
              className="pl-10 w-full py-2 bg-slate-800/50 border border-white/10 rounded-lg focus:outline-none focus:border-blue-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex gap-2">
            {[
              "all",
              "draft",
              "submitted",
              "approved",
              "rejected",
              "reimbursed",
            ].map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  activeFilter === filter
                    ? "bg-blue-500 text-white"
                    : "bg-slate-800/50 text-gray-400 hover:bg-slate-700"
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
          </div>
        ) : errorMessage ? (
          <div className="text-center py-8">
            <AlertCircle className="mx-auto h-10 w-10 text-red-400 mb-2" />
            <p className="text-white/60">{errorMessage}</p>
          </div>
        ) : filteredClaims.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="mx-auto h-10 w-10 text-white/40 mb-2" />
            <p className="text-white/60">No insurance claims found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-slate-900/50 rounded-lg overflow-hidden">
              <thead className="bg-slate-800/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Invoice Details
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Insurance Provider
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Claim Amount
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-white/60 uppercase tracking-wider">
                    Date Created
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-white/60 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {paginatedClaims.map((claim) => (
                  <tr key={claim.id} className="hover:bg-white/5">
                    <td className="px-4 py-4 whitespace-nowrap text-white/90">
                      <div className="text-sm">
                        {claim.invoice_description || "Medical Service"}
                      </div>
                      <div className="text-xs text-white/60">
                        $
                        {parseFloat(String(claim.invoice_amount || 0)).toFixed(
                          2
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="text-sm text-white/90">
                        {claim.insurance_provider}
                      </div>
                      <div className="text-xs text-white/60">
                        Policy: {claim.policy_number}
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-white/90">
                      ${parseFloat(String(claim.claim_amount || 0)).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {getStatusBadge(claim.status)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-white/60 text-sm">
                      {formatDate(claim.created_at)}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex justify-end space-x-2">
                        {claim.status === "draft" && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openEditModal(claim)}
                              title="Edit Claim"
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openDeleteModal(claim)}
                              title="Delete Claim"
                            >
                              <Trash className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openSubmitModal(claim)}
                              title="Submit Claim"
                            >
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            </Button>
                          </>
                        )}
                        {claim.status !== "draft" && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              /* View details modal */
                            }}
                            title="View Details"
                          >
                            <FileText className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination UI */}
            {filteredClaims.length > itemsPerPage && (
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
                <div className="text-sm text-white/60">
                  Showing{" "}
                  {filteredClaims.length > 0
                    ? (currentPage - 1) * itemsPerPage + 1
                    : 0}{" "}
                  to{" "}
                  {Math.min(currentPage * itemsPerPage, filteredClaims.length)}{" "}
                  of {filteredClaims.length} claims
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={goToPreviousPage}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-md ${
                      currentPage === 1
                        ? "text-white/30 cursor-not-allowed"
                        : "text-white/70 hover:bg-white/10"
                    }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>

                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-8 h-8 mx-1 rounded-md ${
                          currentPage === pageNum
                            ? "bg-blue-600 text-white"
                            : "text-white/70 hover:bg-white/10"
                        }`}
                        aria-label={`Page ${pageNum}`}
                        aria-current={
                          currentPage === pageNum ? "page" : undefined
                        }
                      >
                        {pageNum}
                      </button>
                    );
                  })}

                  <button
                    onClick={goToNextPage}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-md ${
                      currentPage === totalPages
                        ? "text-white/30 cursor-not-allowed"
                        : "text-white/70 hover:bg-white/10"
                    }`}
                    aria-label="Next page"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>

                  {/* Items per page selector */}
                  <div className="flex items-center ml-4">
                    <label className="text-sm text-white/60 mr-2">
                      Items per page:
                    </label>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => {
                        setItemsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="bg-slate-800 border border-white/10 rounded-lg p-1 text-sm text-white/80"
                    >
                      <option value={5}>5</option>
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>

      {/* Create Claim Modal */}
      {isCreateModalOpen && (
        <ModalPortal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          title="Create New Claim"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-1">
                Invoice
              </label>
              <select
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                value={formData.invoiceId}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    invoiceId: Number(e.target.value),
                  })
                }
              >
                <option value={0}>Select an invoice</option>
                {invoices.map((invoice) => {
                  // Format date for better readability
                  const date = invoice.created_at
                    ? new Date(invoice.created_at)
                    : null;
                  const formattedDate = date
                    ? date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })
                    : "";

                  return (
                    <option key={invoice.id} value={invoice.id}>
                      [${parseFloat(String(invoice.amount)).toFixed(2)}]{" "}
                      {invoice.description || "Medical service"} -{" "}
                      {formattedDate}
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">
                Insurance Provider
              </label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                placeholder="e.g., Blue Cross Blue Shield"
                value={formData.insuranceProvider}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    insuranceProvider: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">
                Policy Number
              </label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                placeholder="e.g., BCBS-12345678"
                value={formData.policyNumber}
                onChange={(e) =>
                  setFormData({ ...formData, policyNumber: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">
                Claim Amount ($)
              </label>
              <input
                type="number"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                placeholder="0.00"
                value={formData.claimAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    claimAmount: parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">
                Notes (Optional)
              </label>
              <textarea
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                placeholder="Any additional information about your claim"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              ></textarea>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleCreateClaim}
              >
                Create Claim
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Edit Claim Modal */}
      {isEditModalOpen && selectedClaim && (
        <ModalPortal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit Claim"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-white/60 text-sm mb-1">
                Invoice
              </label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white/60 focus:outline-none"
                value={selectedClaim.invoice_description || "Medical Service"}
                disabled
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">
                Insurance Provider
              </label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                placeholder="e.g., Blue Cross Blue Shield"
                value={formData.insuranceProvider}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    insuranceProvider: e.target.value,
                  })
                }
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">
                Policy Number
              </label>
              <input
                type="text"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                placeholder="e.g., BCBS-12345678"
                value={formData.policyNumber}
                onChange={(e) =>
                  setFormData({ ...formData, policyNumber: e.target.value })
                }
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">
                Claim Amount ($)
              </label>
              <input
                type="number"
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                placeholder="0.00"
                value={formData.claimAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    claimAmount: parseFloat(e.target.value),
                  })
                }
              />
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-1">
                Notes (Optional)
              </label>
              <textarea
                className="w-full bg-slate-800 border border-white/10 rounded-lg p-2 text-white focus:outline-none"
                placeholder="Any additional information about your claim"
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              ></textarea>
            </div>

            <div className="pt-4 border-t border-white/10">
              <Button
                variant="primary"
                className="w-full"
                onClick={handleUpdateClaim}
              >
                Update Claim
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Delete Claim Modal */}
      {isDeleteModalOpen && selectedClaim && (
        <ModalPortal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          title="Delete Claim"
        >
          <div className="space-y-4">
            <div className="flex items-start p-4 bg-red-500/10 rounded-lg border border-red-500/20">
              <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" />
              <div>
                <p className="text-white/90 mb-1">
                  Are you sure you want to delete this insurance claim?
                </p>
                <p className="text-sm text-white/70">
                  This action cannot be undone. All information associated with
                  this claim will be permanently removed.
                </p>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </Button>
              <Button variant="danger" onClick={handleDeleteClaim}>
                Delete Claim
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}

      {/* Submit Claim Modal */}
      {isSubmitModalOpen && selectedClaim && (
        <ModalPortal
          isOpen={isSubmitModalOpen}
          onClose={() => setIsSubmitModalOpen(false)}
          title="Submit Insurance Claim"
        >
          <div className="space-y-4">
            <div className="bg-blue-500/10 p-4 rounded-lg border border-blue-500/20">
              <p className="text-white/90 text-sm">
                Please upload all required documents for your insurance claim.
                This typically includes your medical invoice, receipts, and any
                additional documentation your insurance provider requires.
              </p>
            </div>

            <div>
              <label className="block text-white/60 text-sm mb-3">
                Upload Documents
              </label>

              {uploadingFiles ? (
                <div className="border border-white/10 rounded-lg p-6">
                  <div className="mb-2 flex justify-between text-sm">
                    <span className="text-white/70">Uploading files...</span>
                    <span className="text-white/70">{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-2">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              ) : (
                <div className="border-2 border-dashed border-white/10 rounded-lg p-6 text-center">
                  <Upload className="mx-auto h-8 w-8 text-white/40 mb-2" />
                  <p className="text-white/60 mb-4">
                    Drag & drop files here or click to browse
                  </p>
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div
                      className="inline-flex items-center justify-center px-4 py-2 border border-white/20 
                         rounded-md text-sm font-medium text-white bg-slate-800 hover:bg-slate-700 transition-colors"
                    >
                      Select Files
                    </div>
                  </label>
                  <input
                    type="file"
                    multiple
                    className="hidden"
                    id="file-upload"
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </div>
              )}
            </div>

            {documentUrls.length > 0 && (
              <div>
                <label className="block text-white/60 text-sm mb-2">
                  Uploaded Documents
                </label>
                <div className="space-y-2">
                  {documentUrls.map((url, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center p-2 bg-slate-800 rounded-lg"
                    >
                      <span className="text-sm text-white/80 truncate">
                        {getFileNameFromUrl(url)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(url, "_blank")}
                        >
                          <FileText className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeDocument(url)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 border-t border-white/10 flex justify-end space-x-3">
              <Button
                variant="ghost"
                onClick={() => setIsSubmitModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmitClaim}
                disabled={
                  documentUrls.length === 0 ||
                  uploadingDocuments ||
                  uploadingFiles
                }
              >
                {uploadingDocuments ? (
                  <>
                    <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white/60 border-t-white mr-2"></span>
                    Processing...
                  </>
                ) : (
                  "Submit Claim"
                )}
              </Button>
            </div>
          </div>
        </ModalPortal>
      )}
    </div>
  );
};

export default InsuranceClaims;
