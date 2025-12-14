"use client";
import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";

interface InspectionData {
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
  vehicle_photo_url: string;
  vehicle_photos: Array<{
    url: string;
    description: string;
    fileName: string;
  }>;
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
  created_at: string;
  inspection_date: string;
  inspector_name: string;
  status: string;
}

export default function ViewInspectionPage() {
  const params = useParams();
  const [inspection, setInspection] = useState<InspectionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        const response = await fetch(`/api/port-inspection?id=${params.id}`);
        const result = await response.json();

        if (response.ok && result.data && result.data.length > 0) {
          setInspection(result.data[0]);
        } else {
          setError('Inspection not found');
        }
      } catch (error) {
        setError('Failed to load inspection');
        console.error('Error fetching inspection:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchInspection();
    }
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading inspection...</p>
        </div>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Inspection Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'The requested inspection could not be found.'}</p>
          <a
            href="/port-inspection/list"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Inspections List
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white p-4 sm:p-6 text-center">
          <div className="flex justify-between items-center mb-4">
            <a
              href="/port-inspection/list"
              className="text-blue-100 hover:text-white text-sm sm:text-base underline"
            >
              ← Back to Inspections List
            </a>
            <button
              onClick={() => window.print()}
              className="bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition-colors text-sm"
            >
              🖨️ Print
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold">Port Inspection Report</h1>
          <p className="mt-2 text-sm sm:text-base text-blue-100">
            Code: {inspection.code_no} | Date: {new Date(inspection.created_at).toLocaleDateString()}
          </p>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {/* Vehicle Information */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">
              1. Vehicle Information
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Code No</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                  {inspection.code_no}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Make</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                  {inspection.make || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Location</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                  {inspection.location || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Colour</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                  {inspection.colour || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Chassis No</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                  {inspection.chassis_no || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Engine No</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                  {inspection.engine_no || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fuel</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                  {inspection.fuel || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Mileage</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                  {inspection.mileage || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">No. of Doors</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                  {inspection.no_of_doors || 'Not specified'}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Fuel Level</label>
                <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                  {inspection.fuel_level || 'Not specified'}
                </div>
              </div>

              {/* Vehicle Photos */}
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Vehicle Photos
                  {inspection.vehicle_photos && inspection.vehicle_photos.length > 0 && (
                    <span className="text-gray-500"> ({inspection.vehicle_photos.length})</span>
                  )}
                </label>
                
                {inspection.vehicle_photos && inspection.vehicle_photos.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {inspection.vehicle_photos.map((photo, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-2 bg-white">
                          <div className="relative">
                                                         <img
                               src={photo.url}
                               alt={photo.description || `Vehicle Photo ${index + 1}`}
                               className="w-full h-32 object-cover rounded-lg"
                               onError={(e) => {
                                 console.error('Image failed to load:', photo.url);
                                 // Try to get a signed URL if the public URL fails
                                 const target = e.currentTarget as HTMLImageElement;
                                 
                                 // For now, show fallback immediately
                                 target.style.display = 'none';
                                 const fallback = target.nextElementSibling as HTMLElement;
                                 if (fallback) {
                                   fallback.style.display = 'flex';
                                 }
                               }}
                               crossOrigin="anonymous"
                             />
                            <div 
                              className="w-full h-32 bg-gray-100 rounded-lg hidden items-center justify-center"
                              style={{ display: 'none' }}
                            >
                              <div className="text-center text-gray-500">
                                <div className="text-2xl mb-1">📷</div>
                                <div className="text-xs">Image not available</div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <div className="font-medium">{photo.description || `Photo ${index + 1}`}</div>
                            <div className="text-gray-500">{photo.fileName}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : inspection.vehicle_photo_url ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <img
                        src={inspection.vehicle_photo_url}
                        alt="Vehicle"
                        className="w-full max-w-xs h-48 object-cover rounded-lg border border-gray-300"
                                                 onError={(e) => {
                           console.error('Single image failed to load:', inspection.vehicle_photo_url);
                           const target = e.currentTarget as HTMLImageElement;
                           target.style.display = 'none';
                           const fallback = target.nextElementSibling as HTMLElement;
                           if (fallback) {
                             fallback.style.display = 'flex';
                           }
                         }}
                      />
                      <div 
                        className="w-full max-w-xs h-48 bg-gray-100 rounded-lg border border-gray-300 hidden items-center justify-center"
                        style={{ display: 'none' }}
                      >
                        <div className="text-center text-gray-500">
                          <div className="text-2xl mb-1">📷</div>
                          <div className="text-xs">Image not available</div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="text-4xl mb-2">📷</div>
                    <div>No vehicle photos available</div>
                  </div>
                )}
              </div>
              

            </div>
          </div>

          {/* Checklist Items */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">
              2. Checklist Items
            </h2>
            
            <div className="space-y-4">
              {inspection.checklist_data?.items?.map((item) => (
                <div key={item.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium text-gray-500 w-8">#{item.id}</span>
                      <span className="text-sm font-medium text-gray-700">{item.description}</span>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">
                        {item.airCondition !== undefined && item.airCondition !== null ? 'Air Condition' :
                         item.horn !== undefined && item.horn !== null ? 'Horn' :
                         item.powerShutterSwitch !== undefined && item.powerShutterSwitch !== null ? 'Power Shutter Switch' :
                         item.airPump !== undefined && item.airPump !== null ? 'Air Pump' :
                         item.glueBottle !== undefined && item.glueBottle !== null ? 'Glue Bottle' :
                         item.valve !== undefined && item.valve !== null ? 'Valve' :
                         item.torBar !== undefined && item.torBar !== null ? 'Tor Bar' : 'Note'}
                      </label>
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                        {item.airCondition !== undefined && item.airCondition !== null ? item.airCondition :
                         item.horn !== undefined && item.horn !== null ? item.horn :
                         item.powerShutterSwitch !== undefined && item.powerShutterSwitch !== null ? item.powerShutterSwitch :
                         item.airPump !== undefined && item.airPump !== null ? item.airPump :
                         item.glueBottle !== undefined && item.glueBottle !== null ? item.glueBottle :
                         item.valve !== undefined && item.valve !== null ? item.valve :
                         item.torBar !== undefined && item.torBar !== null ? item.torBar :
                         item.note || 'No notes'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Quantity</label>
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900 text-center">
                        {item.qt || '0'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tyre Condition */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">
              3. Tyre Condition
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'frontRight', label: 'Front Right Side' },
                { key: 'frontLeft', label: 'Front Left Side' },
                { key: 'rearRight', label: 'Rear Right Side' },
                { key: 'rearLeft', label: 'Rear Left Side' },
                { key: 'spareTyre', label: 'Spare Tyre' }
              ].map((tyre) => (
                <div key={tyre.key} className="border border-gray-200 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{tyre.label}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Type</label>
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                        {inspection.tyre_data[tyre.key as keyof typeof inspection.tyre_data]?.type || 'Not specified'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Wear</label>
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                        {inspection.tyre_data[tyre.key as keyof typeof inspection.tyre_data]?.wear || 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Signatures */}
          <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
            <h2 className="text-xl sm:text-2xl font-semibold mb-4 text-gray-800 border-b pb-2">
              4. Signatures Confirmations
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                { key: 'portInspectionOfficer', label: 'Port Inspection Officer' },
                { key: 'signature1', label: 'Signature 1' },
                { key: 'signature2', label: 'Signature 2' },
                { key: 'signature3', label: 'Signature 3' }
              ].map((sig) => (
                <div key={sig.key} className="border border-gray-200 rounded-lg p-3">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">{sig.label}</h3>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Name</label>
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                        {inspection.signatures_data[sig.key as keyof typeof inspection.signatures_data]?.name || 'Not specified'}
                      </div>
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Signature</label>
                      {inspection.signatures_data[sig.key as keyof typeof inspection.signatures_data]?.signature ? (
                        <div className="space-y-2">
                          <div className="relative">
                            <img 
                              src={inspection.signatures_data[sig.key as keyof typeof inspection.signatures_data]?.signature} 
                              alt="Signature" 
                              className="w-full h-24 object-contain border border-gray-300 rounded bg-white"
                              onError={(e) => {
                                console.error('Signature image failed to load:', inspection.signatures_data[sig.key as keyof typeof inspection.signatures_data]?.signature);
                                const target = e.currentTarget as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) {
                                  fallback.style.display = 'flex';
                                }
                              }}
                            />
                            <div 
                              className="w-full h-24 bg-gray-100 border border-gray-300 rounded hidden items-center justify-center"
                              style={{ display: 'none' }}
                            >
                              <div className="text-center text-gray-500">
                                <div className="text-lg mb-1">✍️</div>
                                <div className="text-xs">Signature not available</div>
                              </div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            Digital signature captured
                          </div>
                        </div>
                      ) : (
                        <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                          No signature provided
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">Date</label>
                      <div className="px-3 py-2 bg-gray-100 rounded-md text-gray-900">
                        {inspection.signatures_data[sig.key as keyof typeof inspection.signatures_data]?.date || 'Not specified'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div><strong>Inspection Date:</strong> {new Date(inspection.inspection_date).toLocaleDateString()}</div>
              <div><strong>Inspector:</strong> {inspection.inspector_name}</div>
              <div><strong>Status:</strong> <span className="capitalize">{inspection.status}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
