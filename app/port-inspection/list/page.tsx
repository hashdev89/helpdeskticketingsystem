"use client";
import React, { useState, useEffect } from "react";

interface PortInspection {
  id: number;
  code_no: string;
  make: string;
  location: string;
  colour: string;
  fuel: string;
  chassis_no: string;
  mileage: string;
  engine_no: string;
  no_of_doors: number;
  fuel_level: string;
  inspection_date: string;
  inspector_name: string;
  status: string;
  created_at: string;
  checklist_data: {
    items: Array<{
      id: number;
      description: string;
      note: string;
      qt: string;
      airCondition?: string;
      horn?: string;
      powerShutterSwitch?: string;
      airPump?: string;
      glueBottle?: string;
      valve?: string;
      torBar?: string;
    }>;
  };
  tyre_data: {
    frontRight: { type: string; wear: string };
    frontLeft: { type: string; wear: string };
    rearRight: { type: string; wear: string };
    rearLeft: { type: string; wear: string };
    spareTyre: { type: string; wear: string };
  };
  signatures_data: {
    portInspectionOfficer: { name: string; signature: string; date: string };
    signature1: { name: string; signature: string; date: string };
    signature2: { name: string; signature: string; date: string };
    signature3: { name: string; signature: string; date: string };
  };
}

export default function PortInspectionList() {
  const [inspections, setInspections] = useState<PortInspection[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [exporting, setExporting] = useState(false);
  const [activeTab, setActiveTab] = useState('summary');
  const recordsPerPage = 30;

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      const response = await fetch('/api/port-inspection');
      const result = await response.json();

      if (response.ok) {
        const data = result.data || [];
        setInspections(data);
        setTotalPages(Math.ceil(data.length / recordsPerPage));
      } else {
        setError(result.error || 'Failed to fetch inspections');
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getChecklistStatus = (checklistData: any) => {
    if (!checklistData?.items || checklistData.items.length === 0) {
      return { completed: 0, total: 0, percentage: 0 };
    }
    
    const total = checklistData.items.length;
    const completed = checklistData.items.filter((item: any) => {
      // Check if item has any data filled
      const hasRadioData = item.airCondition || item.horn || item.powerShutterSwitch || 
                          item.airPump || item.glueBottle || item.valve || item.torBar;
      const hasNoteData = item.note && item.note.trim() !== '';
      const hasQuantityData = item.qt && item.qt.trim() !== '';
      return hasRadioData || hasNoteData || hasQuantityData;
    }).length;
    
    const percentage = Math.round((completed / total) * 100);
    return { completed, total, percentage };
  };

  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * recordsPerPage;
    const endIndex = startIndex + recordsPerPage;
    return inspections.slice(startIndex, endIndex);
  };

  const currentPageData = getCurrentPageData();

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const response = await fetch('/api/port-inspection/export-excel');
      
      if (response.ok) {
        // Get the filename from the response headers
        const contentDisposition = response.headers.get('content-disposition');
        const filename = contentDisposition 
          ? contentDisposition.split('filename=')[1]?.replace(/"/g, '') 
          : `Port_Inspections_${new Date().toISOString().split('T')[0]}.xlsx`;

        // Create blob and download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const errorData = await response.json();
        alert(`Export failed: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      alert('Failed to export Excel file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  // Helper function to get detailed checklist data
  const getDetailedChecklistData = () => {
    const detailedData: any[] = [];
    
    inspections.forEach((inspection, inspectionIndex) => {
      const checklistData = inspection.checklist_data?.items || [];
      
      checklistData.forEach((item) => {
        // Determine the field type and value
        let fieldType = 'Note';
        let fieldValue = item.note || '';
        
        if (item.airCondition !== undefined && item.airCondition !== null) {
          fieldType = 'Air Condition';
          fieldValue = item.airCondition;
        } else if (item.horn !== undefined && item.horn !== null) {
          fieldType = 'Horn';
          fieldValue = item.horn;
        } else if (item.powerShutterSwitch !== undefined && item.powerShutterSwitch !== null) {
          fieldType = 'Power Shutter Switch';
          fieldValue = item.powerShutterSwitch;
        } else if (item.airPump !== undefined && item.airPump !== null) {
          fieldType = 'Air Pump';
          fieldValue = item.airPump;
        } else if (item.glueBottle !== undefined && item.glueBottle !== null) {
          fieldType = 'Glue Bottle';
          fieldValue = item.glueBottle;
        } else if (item.valve !== undefined && item.valve !== null) {
          fieldType = 'Valve';
          fieldValue = item.valve;
        } else if (item.torBar !== undefined && item.torBar !== null) {
          fieldType = 'Tor Bar';
          fieldValue = item.torBar;
        }

        detailedData.push({
          inspectionNo: inspectionIndex + 1,
          codeNo: inspection.code_no || '',
          make: inspection.make || '',
          chassisNo: inspection.chassis_no || '',
          itemId: item.id || '',
          description: item.description || '',
          fieldType: fieldType,
          fieldValue: fieldValue,
          quantity: item.qt || '',
          inspectionDate: inspection.inspection_date || '',
          inspector: inspection.inspector_name || ''
        });
      });
    });
    
    return detailedData;
  };

  // Helper function to get tyre data
  const getTyreData = () => {
    const tyreData: any[] = [];
    
    inspections.forEach((inspection, inspectionIndex) => {
      const tyreInfo = inspection.tyre_data || {};
      const tyrePositions = [
        { key: 'frontRight', label: 'Front Right' },
        { key: 'frontLeft', label: 'Front Left' },
        { key: 'rearRight', label: 'Rear Right' },
        { key: 'rearLeft', label: 'Rear Left' },
        { key: 'spareTyre', label: 'Spare Tyre' }
      ];

      tyrePositions.forEach(pos => {
        const tyre = tyreInfo[pos.key as keyof typeof tyreInfo] || {};
        tyreData.push({
          inspectionNo: inspectionIndex + 1,
          codeNo: inspection.code_no || '',
          make: inspection.make || '',
          chassisNo: inspection.chassis_no || '',
          position: pos.label,
          type: tyre.type || '',
          wear: tyre.wear || '',
          inspectionDate: inspection.inspection_date || '',
          inspector: inspection.inspector_name || ''
        });
      });
    });
    
    return tyreData;
  };

  // Helper function to get signatures data
  const getSignaturesData = () => {
    const signaturesData: any[] = [];
    
    inspections.forEach((inspection, inspectionIndex) => {
      const signatures = inspection.signatures_data || {};
      const signatureTypes = [
        { key: 'portInspectionOfficer', label: 'Port Inspection Officer' },
        { key: 'signature1', label: 'Signature 1' },
        { key: 'signature2', label: 'Signature 2' },
        { key: 'signature3', label: 'Signature 3' }
      ];

      signatureTypes.forEach(sig => {
        const signatureInfo = signatures[sig.key as keyof typeof signatures] || {};
        signaturesData.push({
          inspectionNo: inspectionIndex + 1,
          codeNo: inspection.code_no || '',
          make: inspection.make || '',
          chassisNo: inspection.chassis_no || '',
          signatureType: sig.label,
          name: signatureInfo.name || '',
          date: signatureInfo.date || '',
          signatureAvailable: signatureInfo.signature ? 'Yes' : 'No',
          inspectionDate: inspection.inspection_date || '',
          inspector: inspection.inspector_name || ''
        });
      });
    });
    
    return signaturesData;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading inspections...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Port Inspections</h1>
                <p className="text-gray-600 mt-2">Total: {inspections.length} inspections</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <a
                  href="/port-inspection"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium text-center"
                >
                  ➕ New Inspection
                </a>
                <button
                  onClick={handleExportExcel}
                  disabled={exporting || inspections.length === 0}
                  className={`px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
                    exporting || inspections.length === 0
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {exporting ? '📊 Exporting...' : '📊 Export Excel'}
                </button>
              </div>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="bg-white border-b border-gray-200 mb-6">
            <nav className="flex space-x-8 px-6" aria-label="Tabs">
              {[
                { id: 'summary', name: 'Summary', count: inspections.length },
                { id: 'detailed', name: 'Detailed Checklist', count: getDetailedChecklistData().length },
                { id: 'tyre', name: 'Tyre Data', count: getTyreData().length },
                { id: 'signatures', name: 'Signatures', count: getSignaturesData().length }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.name}
                  <span className="ml-2 bg-gray-100 text-gray-900 py-0.5 px-2.5 rounded-full text-xs font-medium">
                    {tab.count}
                  </span>
                </button>
              ))}
            </nav>
          </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Tab Content */}
        {activeTab === 'summary' && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Summary Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Colour</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chassis No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mileage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Engine No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doors</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fuel Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Checklist</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentPageData.map((inspection, index) => {
                    const checklistStatus = getChecklistStatus(inspection.checklist_data);
                    return (
                      <tr key={inspection.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {(currentPage - 1) * recordsPerPage + index + 1}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.code_no}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.make}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.location}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.colour}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.fuel}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{inspection.chassis_no}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.mileage}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.engine_no}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.no_of_doors}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{inspection.fuel_level}</td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                              <div 
                                className={`h-2 rounded-full ${
                                  checklistStatus.percentage >= 80 ? 'bg-green-500' :
                                  checklistStatus.percentage >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${checklistStatus.percentage}%` }}
                              ></div>
                            </div>
                            <span className="text-xs text-gray-500">
                              {checklistStatus.completed}/{checklistStatus.total}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <a
                            href={`/port-inspection/view/${inspection.id}`}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            View
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'detailed' && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Detailed Checklist Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chassis No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Field Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Value</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getDetailedChecklistData().map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{item.inspectionNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.codeNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.make}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">{item.chassisNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.itemId}</td>
                      <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">{item.description}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fieldType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.fieldValue}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{item.inspector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'tyre' && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Tyre Data Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chassis No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Wear</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getTyreData().map((tyre, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{tyre.inspectionNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.codeNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.make}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-900">{tyre.chassisNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.position}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.wear}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{tyre.inspector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'signatures' && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden">
            {/* Signatures Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspection No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Make</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chassis No</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Signature Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {getSignaturesData().map((signature, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{signature.inspectionNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signature.codeNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signature.make}</td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-gray-900">{signature.chassisNo}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signature.signatureType}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signature.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signature.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          signature.signatureAvailable === 'Yes' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {signature.signatureAvailable}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{signature.inspector}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Pagination */}
        {inspections.length > 0 && totalPages > 1 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Showing {((currentPage - 1) * recordsPerPage) + 1} to {Math.min(currentPage * recordsPerPage, inspections.length)} of {inspections.length} results
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === 1
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      currentPage === page
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 text-sm font-medium rounded-md ${
                    currentPage === totalPages
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Summary */}
        {inspections.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{inspections.length}</div>
                <div className="text-sm text-gray-500">Total Inspections</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {inspections.filter(i => i.status === 'completed').length}
                </div>
                <div className="text-sm text-gray-500">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {inspections.filter(i => i.status === 'pending').length}
                </div>
                <div className="text-sm text-gray-500">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{totalPages}</div>
                <div className="text-sm text-gray-500">Pages</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {(() => {
                    const totalChecklistItems = inspections.reduce((total, inspection) => {
                      const status = getChecklistStatus(inspection.checklist_data);
                      return total + status.total;
                    }, 0);
                    const completedChecklistItems = inspections.reduce((total, inspection) => {
                      const status = getChecklistStatus(inspection.checklist_data);
                      return total + status.completed;
                    }, 0);
                    return totalChecklistItems > 0 ? Math.round((completedChecklistItems / totalChecklistItems) * 100) : 0;
                  })()}%
                </div>
                <div className="text-sm text-gray-500">Checklist Completion</div>
              </div>
            </div>
          </div>
        )}

          {/* Empty State */}
          {inspections.length === 0 && (
            <div className="bg-white rounded-lg shadow-lg p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No inspections found</h3>
              <p className="text-gray-500 mb-4">Start by creating your first port inspection.</p>
              <a
                href="/port-inspection"
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Inspection
              </a>
            </div>
          )}
      </div>
    </div>
  );
}
