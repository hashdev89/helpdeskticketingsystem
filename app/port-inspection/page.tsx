"use client";
import React, { useState, useRef, useEffect } from "react";

// Signature Pad Component
const SignaturePad = ({ value, onChange, placeholder }: { value: string, onChange: (value: string) => void, placeholder: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    // Set drawing styles
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Load existing signature if available
    if (value) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e as any).clientX - rect.left || (e as any).touches?.[0]?.clientX - rect.left;
    const y = (e as any).clientY - rect.top || (e as any).touches?.[0]?.clientY - rect.top;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const x = (e as any).clientX - rect.left || (e as any).touches?.[0]?.clientX - rect.left;
    const y = (e as any).clientY - rect.top || (e as any).touches?.[0]?.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    
    // Convert canvas to data URL and save
    const canvas = canvasRef.current;
    if (canvas) {
      const dataURL = canvas.toDataURL();
      
              // Check if the signature has actual content (not just a blank canvas)
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const data = imageData.data;
          let nonTransparentPixels = 0;
          
          // Count non-transparent pixels (every 4th value is alpha channel)
          for (let i = 3; i < data.length; i += 4) {
            if (data[i] > 0) { // Alpha channel > 0 means pixel is not transparent
              nonTransparentPixels++;
            }
          }
          
          // Consider it a signature if there are at least 50 non-transparent pixels
          const hasContent = nonTransparentPixels > 50;
          
          if (hasContent) {
            setHasSignature(true);
            onChange(dataURL);
          } else {
            setHasSignature(false);
            onChange('');
          }
        }
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className="space-y-2">
      <div className="relative border border-gray-300 rounded-md bg-white">
        <canvas
          ref={canvasRef}
          className="w-full h-32 cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!hasSignature && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-gray-400 text-sm">{placeholder}</span>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={clearSignature}
          className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 transition-colors"
        >
          Clear
        </button>
        {hasSignature && (
          <span className="text-xs text-green-600 flex items-center">
            ✓ Signature captured
          </span>
        )}
      </div>
    </div>
  );
};

export default function PortInspectionPage() {

  const [checklistData, setChecklistData] = useState(() => {
    // Initialize checklist items
    const items = [
      "Side Mirrors", "Back Mirrors", "Driving Mirror", "Wipers", "Wiper Clips",
      "Wiper Jets", "Fog Lights", "Hood Light", "Inside Sunwiser", "Outside Sunwiser",
      "Sunwiser Mirror", "Areal", "Badge", "Alloy Wheel", "Wheel Cup",
      "Spare Wheel", "Hubcaps", "Grease Cup", "Spare Wheel Handle", "Jack",
      "Jack Handle", "Wheel Bracer", "Tool Kit (No of Tools)", "Diesel / Petrol Cap", "Radiator Cap",
      "Oil Cup", "Water Bottle", "Water Bottle Cap", "Battery", "Battery Cover",
      "Cutout Fuse", "Hood Rack", "Radio", "Radio Knob", "CD",
      "DVD", "Reverse Camera", "TV", "Speaker", "Air Condition",
      "A/C Knob", "Lighter", "Ash Trays", "Clock", "Horn",
      "No of Seats", "Carpet - Rubber", "Carpet - Velvet", "Mud Cover", "Middle Bar",
      "Cross Bar", "Fire Extinguisher", "Headrest", "Keys - (General)", "Keys - (Intelligent)",
      "Keys - (Remote)", "Gear Lever Knob", "Extra Brake Light", "Power Shutter Switch", "Air Pump",
      "Glue Bottle", "Valve", "Tor Bar", "Audio Set Up", "Triangle Warning Light",
      "Extra Front Camera", "Extra Rear Camera", "Sight Lights", "Para Lights"
    ];
    
    return items.map((item, index) => ({
      id: index + 1,
      description: item,
      airCondition: item === "Air Condition" ? "" : null, // Only for Air Condition item
      horn: item === "Horn" ? "" : null, // Only for Horn item
      powerShutterSwitch: item === "Power Shutter Switch" ? "" : null, // Only for Power Shutter Switch item
      airPump: item === "Air Pump" ? "" : null, // Only for Air Pump item
      glueBottle: item === "Glue Bottle" ? "" : null, // Only for Glue Bottle item
      valve: item === "Valve" ? "" : null, // Only for Valve item
      torBar: item === "Tor Bar" ? "" : null, // Only for Tor Bar item
      note: "", // Note field for all items
      qt: ""
    }));
  });

  const [tyreData, setTyreData] = useState({
    frontRight: { type: "", wear: "" },
    frontLeft: { type: "", wear: "" },
    rearRight: { type: "", wear: "" },
    rearLeft: { type: "", wear: "" },
    spareTyre: { type: "", wear: "" }
  });

  const [vehicleInfo, setVehicleInfo] = useState({
    codeNo: "",
    make: "",
    location: "",
    colour: "",
    fuel: "",
    chassisNo: "",
    mileage: "",
    engineNo: "",
    noOfDoors: "",
    fuelLevel: ""
  });

  // Auto-generate Code No
  const generateCodeNo = async () => {
    try {
      const response = await fetch('/api/port-inspection?getNextCode=true');
      const result = await response.json();
      if (response.ok && result.nextCode) {
        setVehicleInfo(prev => ({ ...prev, codeNo: result.nextCode }));
      }
    } catch (error) {
      console.error('Error generating code:', error);
    }
  };

  // Auto-generate code on component mount
  React.useEffect(() => {
    generateCodeNo();
  }, []);

  const [showCustomMake, setShowCustomMake] = useState(false);
  const [customMake, setCustomMake] = useState("");
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState("");

  // Predefined vehicle makes
  const vehicleMakes = [
    "TOYOTA",
    "SUZUKI",
    "HONDA",
    "NISSAN",
    "DAIHATSU",
    "MAZDA",
    "FORD"
  ];

  // Predefined locations
  const locations = ['Hambanthota Port', 'Colombo Yard'];

  const [vehicleImages, setVehicleImages] = useState<Array<{id: string, file: File, preview: string, description: string}>>([]);
  const [showCamera, setShowCamera] = useState(false);

  const [signatures, setSignatures] = useState(() => {
    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentTime = now.toLocaleTimeString('en-IN', { 
      timeZone: 'Asia/Kolkata',
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const currentDateTime = `${currentDate} ${currentTime} IST`;
    
    return {
      portInspectionOfficer: { name: "Janith", signature: "", date: currentDateTime },
      signature1: { name: "", signature: "", date: currentDateTime },
      signature2: { name: "", signature: "", date: currentDateTime },
      signature3: { name: "", signature: "", date: currentDateTime }
    };
  });

  const handleChecklistChange = (id: number, field: string, value: string) => {
    setChecklistData(prev => 
      prev.map(item => 
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const handleTyreChange = (position: string, field: string, value: string) => {
    setTyreData(prev => ({
      ...prev,
      [position]: { ...prev[position as keyof typeof prev], [field]: value }
    }));
  };

  const handleVehicleInfoChange = (field: string, value: string) => {
    setVehicleInfo(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleMakeChange = (value: string) => {
    if (value === "custom") {
      setShowCustomMake(true);
      setVehicleInfo(prev => ({ ...prev, make: "" }));
    } else {
      setShowCustomMake(false);
      setCustomMake("");
      setVehicleInfo(prev => ({ ...prev, make: value }));
    }
  };

  const handleCustomMakeChange = (value: string) => {
    setCustomMake(value);
    setVehicleInfo(prev => ({ ...prev, make: value }));
  };

  const handleLocationChange = (value: string) => {
    if (value === "custom") {
      setShowCustomLocation(true);
      setVehicleInfo(prev => ({ ...prev, location: "" }));
    } else {
      setShowCustomLocation(false);
      setCustomLocation("");
      setVehicleInfo(prev => ({ ...prev, location: value }));
    }
  };

  const handleCustomLocationChange = (value: string) => {
    setCustomLocation(value);
    setVehicleInfo(prev => ({ ...prev, location: value }));
  };

  const handleSignatureChange = (role: string, field: string, value: string) => {
    setSignatures(prev => ({
      ...prev,
      [role]: { ...prev[role as keyof typeof prev], [field]: value }
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitMessage('');
    
    try {
    // Collect all form data
    const formData = {
      vehicleInfo,
      checklistData,
      tyreData,
      signatures,
         vehicleImages
       };
      
             // Send data to API
       const response = await fetch('/api/port-inspection', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (response.ok) {
        setSubmitMessage('Port inspection saved successfully!');
        console.log('Form submitted successfully:', result);
        
        // Optional: Reset form after successful submission
        // window.location.reload();
      } else {
        const errorMessage = result.error || result.details || 'Failed to save inspection';
        setSubmitMessage(`Error: ${errorMessage}`);
        console.error('Submission error:', result);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network error. Please try again.';
      setSubmitMessage(`Error: ${errorMessage}`);
      console.error('Submission error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const remainingSlots = 15 - vehicleImages.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      
      if (filesToProcess.length < files.length) {
        alert(`Only ${remainingSlots} more photos can be added (maximum 15 total)`);
      }
      
      filesToProcess.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
          const newImage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file: file,
            preview: e.target?.result as string,
            description: `Photo ${vehicleImages.length + 1}`
          };
          setVehicleImages(prev => [...prev, newImage]);
      };
      reader.readAsDataURL(file);
      });
    }
    // Reset the input so the same file can be selected again if needed
    event.target.value = '';
  };

  const captureImage = () => {
    setShowCamera(true);
  };

  const closeCamera = () => {
    setShowCamera(false);
  };

  const removeImage = (imageId: string) => {
    setVehicleImages(prev => prev.filter(img => img.id !== imageId));
  };

  const updateImageDescription = (imageId: string, description: string) => {
    setVehicleImages(prev => prev.map(img => 
      img.id === imageId ? { ...img, description } : img
    ));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('border-blue-500', 'bg-blue-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.remove('border-blue-500', 'bg-blue-50');
    
    const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
    if (files.length > 0) {
      const remainingSlots = 15 - vehicleImages.length;
      const filesToProcess = files.slice(0, remainingSlots);
      
      if (filesToProcess.length < files.length) {
        alert(`Only ${remainingSlots} more photos can be added (maximum 15 total)`);
      }
      
      filesToProcess.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const newImage = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            file: file,
            preview: e.target?.result as string,
            description: `Photo ${vehicleImages.length + 1}`
          };
          setVehicleImages(prev => [...prev, newImage]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

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
                ← View All Inspections
              </a>
              <div></div>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold">Port Inspection Checklist</h1>
            <p className="mt-2 text-sm sm:text-base text-blue-100">Vehicle Inspection Report</p>
        </div>

                 <form className="p-4 sm:p-6 space-y-6 sm:space-y-8" onSubmit={handleSubmit}>
          {/* 1. Vehicle Information Section */}
           <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
             <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 border-b pb-2">1. Vehicle Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Code No */}
              <div>
                                   <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Code No</label>
                   <div className="flex gap-2">
                <input
                  type="text"
                  value={vehicleInfo.codeNo}
                  onChange={(e) => handleVehicleInfoChange('codeNo', e.target.value)}
                        className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Auto-generated..."
                        readOnly={true}
                      />
                     <button
                       type="button"
                       onClick={generateCodeNo}
                       className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
                       title="Generate new code"
                     >
                       🔄
                     </button>
                   </div>
                   <p className="text-xs text-gray-500 mt-1">Auto-generated serial number (001, 002, etc.)</p>
              </div>

              {/* Make */}
              <div>
                   <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Make</label>
                   {!showCustomMake ? (
                     <select
                       value={vehicleInfo.make}
                       onChange={(e) => handleMakeChange(e.target.value)}
                       className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
                     >
                       <option value="">Select vehicle make...</option>
                       {vehicleMakes.map((make) => (
                         <option key={make} value={make}>
                           {make}
                         </option>
                       ))}
                       <option value="custom">+ Add Custom Make</option>
                     </select>
                   ) : (
                     <div className="space-y-2">
                <input
                  type="text"
                         value={customMake}
                         onChange={(e) => handleCustomMakeChange(e.target.value)}
                         className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                         placeholder="Enter custom vehicle make..."
                       />
                       <button
                         type="button"
                         onClick={() => {
                           setShowCustomMake(false);
                           setCustomMake("");
                           setVehicleInfo(prev => ({ ...prev, make: "" }));
                         }}
                         className="text-xs text-blue-600 hover:text-blue-800 underline"
                       >
                         ← Back to list
                       </button>
                     </div>
                   )}
              </div>

              {/* Location */}
              <div>
                <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Location</label>
                {!showCustomLocation ? (
                  <select
                    value={vehicleInfo.location}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  >
                    <option value="">Select location...</option>
                    {locations.map((location) => (
                      <option key={location} value={location}>
                        {location}
                      </option>
                    ))}
                    <option value="custom">+ Add New Location</option>
                  </select>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={customLocation}
                      onChange={(e) => handleCustomLocationChange(e.target.value)}
                      className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      placeholder="Enter new location..."
                    />
                    <button
                      type="button"
                      onClick={() => {
                        setShowCustomLocation(false);
                        setCustomLocation("");
                        setVehicleInfo(prev => ({ ...prev, location: "" }));
                      }}
                      className="text-xs text-gray-500 hover:text-gray-700 underline"
                    >
                      ← Back to predefined locations
                    </button>
                  </div>
                )}
              </div>

              {/* Colour */}
              <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Colour</label>
                <input
                  type="text"
                  value={vehicleInfo.colour}
                  onChange={(e) => handleVehicleInfoChange('colour', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter vehicle colour..."
                />
              </div>

              {/* Fuel */}
              <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Fuel</label>
                <input
                  type="text"
                  value={vehicleInfo.fuel}
                  onChange={(e) => handleVehicleInfoChange('fuel', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter fuel type..."
                />
              </div>

              {/* Chassis No */}
              <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Chassis No</label>
                <input
                  type="text"
                  value={vehicleInfo.chassisNo}
                  onChange={(e) => handleVehicleInfoChange('chassisNo', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter chassis number..."
                />
              </div>

              {/* Mileage */}
              <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Mileage</label>
                <input
                  type="text"
                  value={vehicleInfo.mileage}
                  onChange={(e) => handleVehicleInfoChange('mileage', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter mileage..."
                />
              </div>

              {/* Engine No */}
              <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Engine No</label>
                <input
                  type="text"
                  value={vehicleInfo.engineNo}
                  onChange={(e) => handleVehicleInfoChange('engineNo', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter engine number..."
                />
              </div>

              {/* No. of Doors */}
              <div>
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">No. of Doors</label>
                <input
                  type="number"
                  min="0"
                  value={vehicleInfo.noOfDoors}
                  onChange={(e) => handleVehicleInfoChange('noOfDoors', e.target.value)}
                    className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                  placeholder="Enter number of doors..."
                />
              </div>

              {/* Fuel Level */}
              <div className="md:col-span-2">
                  <label className="block text-sm sm:text-base font-semibold text-gray-700 mb-2">Fuel Level</label>
                <div className="flex flex-wrap gap-4">
                  {['Empty', '¼', '½', '¾', 'Full'].map((level) => (
                    <label key={level} className="flex items-center space-x-2">
                      <input
                        type="radio"
                        name="fuelLevel"
                        value={level}
                        checked={vehicleInfo.fuelLevel === level}
                        onChange={(e) => handleVehicleInfoChange('fuelLevel', e.target.value)}
                        className="text-blue-600 focus:ring-blue-500"
                      />
                       <span className="text-sm sm:text-base text-gray-700">{level}</span>
                    </label>
                  ))}
                </div>
              </div>

                                                                                                                           {/* Vehicle Photos */}
              <div className="md:col-span-2">
                   <div className="flex justify-between items-center mb-2">
                     <label className="block text-sm sm:text-base font-semibold text-gray-700">Vehicle Photos</label>
                     <span className="text-xs text-gray-500">{vehicleImages.length}/15 photos</span>
                   </div>
                   <p className="text-xs text-gray-500 mb-2">Photos will be uploaded to Supabase Storage in date-based folders. Images will be optimized for web.</p>
                <div className="space-y-3">
                   {vehicleImages.length > 0 ? (
                     <>
                       <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                         {vehicleImages.map((image, index) => (
                           <div key={image.id} className="relative border border-gray-200 rounded-lg p-2">
                             <img
                               src={image.preview}
                               alt={`Vehicle Photo ${index + 1}`}
                               className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                               onClick={() => removeImage(image.id)}
                               className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm hover:bg-red-600"
                      >
                        ×
                      </button>
                             <input
                               type="text"
                               value={image.description}
                               onChange={(e) => updateImageDescription(image.id, e.target.value)}
                               className="w-full mt-2 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                               placeholder="Photo description..."
                             />
                             <div className="text-xs text-gray-500 mt-1">
                               {image.file.name} ({(image.file.size / 1024 / 1024).toFixed(2)} MB)
                             </div>
                           </div>
                         ))}
                       </div>
                       
                       {/* Add more photos section */}
                       {vehicleImages.length < 15 && (
                         <div 
                           className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center transition-colors"
                           onDragOver={handleDragOver}
                           onDragLeave={handleDragLeave}
                           onDrop={handleDrop}
                         >
                           <p className="text-sm text-gray-600 mb-3">
                             Add more photos ({15 - vehicleImages.length} remaining)
                           </p>
                           <p className="text-xs text-gray-500 mb-3">
                             Drag & drop images here or click to select
                           </p>
                           <div className="flex flex-col sm:flex-row gap-2 justify-center">
                             <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm">
                               <input
                                 type="file"
                                 accept="image/*"
                                 multiple
                                 onChange={handleImageUpload}
                                 className="hidden"
                               />
                               📁 Add More Photos
                             </label>
                             <button
                               type="button"
                               onClick={captureImage}
                               className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm"
                             >
                               📷 Take Photo
                             </button>
                           </div>
                    </div>
                       )}
                     </>
                   ) : (
                     <div 
                       className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center transition-colors"
                       onDragOver={handleDragOver}
                       onDragLeave={handleDragLeave}
                       onDrop={handleDrop}
                     >
                      <div className="text-gray-500 mb-4">
                        <svg className="mx-auto h-12 w-12" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                       <p className="text-sm text-gray-600 mb-2">Upload vehicle photos (up to 15 photos)</p>
                       <p className="text-xs text-gray-500 mb-4">Drag & drop images here or click to select</p>
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <label className="cursor-pointer bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                          <input
                            type="file"
                            accept="image/*"
                             multiple
                            onChange={handleImageUpload}
                            className="hidden"
                          />
                           📁 Upload Photos
                        </label>
                        <button
                          type="button"
                          onClick={captureImage}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                        >
                          📷 Take Photo
                        </button>
                      </div>
                       <p className="text-xs text-gray-500 mt-2">
                          📁 Will be saved as: {new Date().toISOString().split('T')[0].replace(/-/g, '.')}/{vehicleInfo.make || 'UNKNOWN'}_{vehicleInfo.chassisNo || 'NOCHASSIS'}_{vehicleInfo.codeNo || 'XXX'}_[1-15].jpg
                        </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 2. Checklist Items Section */}
                       <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6 border-b pb-2">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">2. Checklist Items</h2>
                <div className="text-sm text-gray-600">
                  {(() => {
                    const completedItems = checklistData.filter(item => {
                      const hasRadioData = item.airCondition || item.horn || item.powerShutterSwitch || 
                                         item.airPump || item.glueBottle || item.valve || item.torBar;
                      const hasNoteData = item.note && item.note.trim() !== '';
                      const hasQuantityData = item.qt && item.qt.trim() !== '';
                      return hasRadioData || hasNoteData || hasQuantityData;
                    }).length;
                    return `${completedItems}/${checklistData.length} items completed`;
                  })()}
                </div>
              </div>
            
            <div className="space-y-4">
                             {checklistData.map((item) => {
                 // Check if the item has any data filled
                 const hasRadioData = item.airCondition || item.horn || item.powerShutterSwitch || 
                                    item.airPump || item.glueBottle || item.valve || item.torBar;
                 const hasNoteData = item.note && item.note.trim() !== '';
                 const hasQuantityData = item.qt && item.qt.trim() !== '';
                 const isFilled = hasRadioData || hasNoteData || hasQuantityData;
                 
                 return (
                   <div key={item.id} className={`border border-gray-200 rounded-lg p-3 sm:p-4 hover:bg-gray-50 ${isFilled ? 'bg-green-50 border-green-300' : ''}`}>
                     <div className="grid grid-cols-1 md:grid-cols-4 gap-3 sm:gap-4 items-center">
                    <div className="flex items-center space-x-2">
                         <span className="text-sm sm:text-base font-medium text-gray-500 w-8">#{item.id}</span>
                         <span className="text-sm sm:text-base font-medium text-gray-700">{item.description}</span>
                         {isFilled && (
                           <span className="text-green-600 text-lg" title="Item completed">
                             ✅
                           </span>
                         )}
                    </div>
                    
                                                                                   {item.description === "Air Condition" ? (
                                                 <div>
                           <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1">
                             Availbilty
                             {item.airCondition && <span className="text-green-600 ml-1">✓</span>}
                           </label>
                           <div className="flex space-x-4">
                           <label className="flex items-center space-x-2">
                             <input
                               type="radio"
                               name={`airCondition-${item.id}`}
                               value="Yes"
                               checked={item.airCondition === "Yes"}
                               onChange={(e) => handleChecklistChange(item.id, 'airCondition', e.target.value)}
                               className="text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-sm sm:text-base text-gray-700">Yes</span>
                           </label>
                           <label className="flex items-center space-x-2">
                             <input
                               type="radio"
                               name={`airCondition-${item.id}`}
                               value="No"
                               checked={item.airCondition === "No"}
                               onChange={(e) => handleChecklistChange(item.id, 'airCondition', e.target.value)}
                               className="text-blue-600 focus:ring-blue-500"
                             />
                             <span className="text-sm sm:text-base text-gray-700">No</span>
                           </label>
                         </div>
                       </div>
                                                                                   ) : item.description === "Horn" ? (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Availbilty
                            {item.horn && <span className="text-green-600 ml-1">✓</span>}
                          </label>
                          <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`horn-${item.id}`}
                              value="Yes"
                              checked={item.horn === "Yes"}
                              onChange={(e) => handleChecklistChange(item.id, 'horn', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`horn-${item.id}`}
                              value="No"
                              checked={item.horn === "No"}
                              onChange={(e) => handleChecklistChange(item.id, 'horn', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                                                                                   ) : item.description === "Power Shutter Switch" ? (
                        <div>
                          <label className="block text-xs font-semibold text-gray-600 mb-1">
                            Power Shutter Switch
                            {item.powerShutterSwitch && <span className="text-green-600 ml-1">✓</span>}
                          </label>
                          <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`powerShutterSwitch-${item.id}`}
                              value="Yes"
                              checked={item.powerShutterSwitch === "Yes"}
                              onChange={(e) => handleChecklistChange(item.id, 'powerShutterSwitch', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`powerShutterSwitch-${item.id}`}
                              value="No"
                              checked={item.powerShutterSwitch === "No"}
                              onChange={(e) => handleChecklistChange(item.id, 'powerShutterSwitch', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                                         ) : item.description === "Air Pump" ? (
                       <div>
                         <label className="block text-xs font-medium text-gray-600 mb-1">
                           Air Pump
                           {item.airPump && <span className="text-green-600 ml-1">✓</span>}
                         </label>
                         <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`airPump-${item.id}`}
                              value="Yes"
                              checked={item.airPump === "Yes"}
                              onChange={(e) => handleChecklistChange(item.id, 'airPump', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`airPump-${item.id}`}
                              value="No"
                              checked={item.airPump === "No"}
                              onChange={(e) => handleChecklistChange(item.id, 'airPump', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                                         ) : item.description === "Glue Bottle" ? (
                       <div>
                         <label className="block text-xs font-medium text-gray-600 mb-1">
                           Glue Bottle
                           {item.glueBottle && <span className="text-green-600 ml-1">✓</span>}
                         </label>
                         <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`glueBottle-${item.id}`}
                              value="Yes"
                              checked={item.glueBottle === "Yes"}
                              onChange={(e) => handleChecklistChange(item.id, 'glueBottle', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`glueBottle-${item.id}`}
                              value="No"
                              checked={item.glueBottle === "No"}
                              onChange={(e) => handleChecklistChange(item.id, 'glueBottle', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                                         ) : item.description === "Valve" ? (
                       <div>
                         <label className="block text-xs font-medium text-gray-600 mb-1">
                           Valve
                           {item.valve && <span className="text-green-600 ml-1">✓</span>}
                         </label>
                         <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`valve-${item.id}`}
                              value="Yes"
                              checked={item.valve === "Yes"}
                              onChange={(e) => handleChecklistChange(item.id, 'valve', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`valve-${item.id}`}
                              value="No"
                              checked={item.valve === "No"}
                              onChange={(e) => handleChecklistChange(item.id, 'valve', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                                         ) : item.description === "Tor Bar" ? (
                       <div>
                         <label className="block text-xs font-medium text-gray-600 mb-1">
                           Tor Bar
                           {item.torBar && <span className="text-green-600 ml-1">✓</span>}
                         </label>
                         <div className="flex space-x-4">
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`torBar-${item.id}`}
                              value="Yes"
                              checked={item.torBar === "Yes"}
                              onChange={(e) => handleChecklistChange(item.id, 'torBar', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">Yes</span>
                          </label>
                          <label className="flex items-center space-x-2">
                            <input
                              type="radio"
                              name={`torBar-${item.id}`}
                              value="No"
                              checked={item.torBar === "No"}
                              onChange={(e) => handleChecklistChange(item.id, 'torBar', e.target.value)}
                              className="text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm text-gray-700">No</span>
                          </label>
                        </div>
                      </div>
                                                                                                                             ) : (
                    <div>
                            <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1">
                              Note
                              {item.note && item.note.trim() !== '' && <span className="text-green-600 ml-1">✓</span>}
                            </label>
                      <input
                        type="text"
                        value={item.note}
                        onChange={(e) => handleChecklistChange(item.id, 'note', e.target.value)}
                             className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Add notes..."
                      />
                    </div>
                       )}
                    
                    <div>
                         <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1">
                           Quantity
                           {item.qt && item.qt.trim() !== '' && <span className="text-green-600 ml-1">✓</span>}
                         </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={item.qt}
                        onChange={(e) => handleChecklistChange(item.id, 'qt', e.target.value)}
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-gray-900"
                        placeholder="0"
                        inputMode="numeric"
                        pattern="[0-9]*"
                      />
                    </div>
                  </div>
                </div>
              );
            })}
            </div>
          </div>

          {/* 3. Tyre Condition Section */}
           <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
             <h2 className="text-xl sm:text-2xl font-semibold mb-4 sm:mb-6 text-gray-800 border-b pb-2">3. Tyre Condition</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { key: 'frontRight', label: 'Front Right Side' },
                { key: 'frontLeft', label: 'Front Left Side' },
                { key: 'rearRight', label: 'Rear Right Side' },
                { key: 'rearLeft', label: 'Rear Left Side' },
                { key: 'spareTyre', label: 'Spare Tyre' }
              ].map((tyre) => (
                                 <div key={tyre.key} className="border border-gray-200 rounded-lg p-3 sm:p-4">
                   <h3 className="text-sm sm:text-base font-medium text-gray-700 mb-3">{tyre.label}</h3>
                  
                  <div className="space-y-3">
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1">Type</label>
                      <input
                        type="text"
                        value={tyreData[tyre.key as keyof typeof tyreData].type}
                        onChange={(e) => handleTyreChange(tyre.key, 'type', e.target.value)}
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Tyre type..."
                      />
                    </div>
                    
                    <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1">Wear</label>
                      <input
                        type="text"
                        value={tyreData[tyre.key as keyof typeof tyreData].wear}
                        onChange={(e) => handleTyreChange(tyre.key, 'wear', e.target.value)}
                          className="w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                        placeholder="Wear condition..."
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

                     {/* 4. Signatures Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 sm:p-6">
              <div className="flex justify-between items-center mb-4 sm:mb-6 border-b pb-2">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">4. Signatures Confirmations</h2>
                <div className="text-sm text-gray-600">
                  {(() => {
                    const completedSignatures = Object.values(signatures).filter(sig => 
                      sig.name.trim() !== '' && sig.signature !== '' && sig.date !== ''
                    ).length;
                    return `${completedSignatures}/4 signatures completed`;
                  })()}
                </div>
              </div>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               {[
                 { key: 'portInspectionOfficer', label: 'Port Inspection Officer' },
                 { key: 'signature1', label: 'Signature 1' },
                 { key: 'signature2', label: 'Signature 2' },
                 { key: 'signature3', label: 'Signature 3' }
               ].map((sig) => {
                 const signatureData = signatures[sig.key as keyof typeof signatures];
                 const isComplete = signatureData.name.trim() !== '' && signatureData.signature !== '' && signatureData.date !== '';
                 
                 return (
                   <div key={sig.key} className={`border border-gray-200 rounded-lg p-3 sm:p-4 ${isComplete ? 'bg-green-50 border-green-300' : ''}`}>
                     <div className="flex items-center justify-between mb-3">
                       <h3 className="text-sm sm:text-base font-medium text-gray-700">{sig.label}</h3>
                       {isComplete && (
                         <span className="text-green-600 text-lg" title="Signature completed">
                           ✅
                         </span>
                       )}
                     </div>
                   
                   <div className="space-y-3">
                                           <div>
                        <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1">
                          Name
                          {signatureData.name.trim() !== '' && <span className="text-green-600 ml-1">✓</span>}
                        </label>
                        <input
                          type="text"
                          value={signatureData.name}
                          onChange={(e) => handleSignatureChange(sig.key, 'name', e.target.value)}
                          className={`w-full px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 ${sig.key === 'portInspectionOfficer' ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                          placeholder="Full name..."
                          readOnly={sig.key === 'portInspectionOfficer'}
                        />
                        {sig.key === 'portInspectionOfficer' && (
                          <p className="text-xs text-gray-500 mt-1">Default inspector assigned</p>
                        )}
                      </div>
                     
                     <div>
                       <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1">
                         Signature
                         {signatureData.signature !== '' && <span className="text-green-600 ml-1">✓</span>}
                       </label>
                       <SignaturePad
                         value={signatureData.signature}
                         onChange={(value) => handleSignatureChange(sig.key, 'signature', value)}
                         placeholder="Sign here..."
                       />
                       {signatureData.signature && (
                         <div className="mt-2 p-2 bg-gray-50 rounded border">
                           <p className="text-xs text-gray-600 mb-1">Signature Preview:</p>
                           <img 
                             src={signatureData.signature} 
                             alt="Signature" 
                             className="w-full h-16 object-contain border border-gray-200 rounded"
                           />
                         </div>
                       )}
                     </div>
                     
                     <div>
                       <label className="block text-xs sm:text-sm font-semibold text-gray-600 mb-1">
                         Date
                         {signatureData.date !== '' && <span className="text-green-600 ml-1">✓</span>}
                       </label>
                       <div className="flex gap-2">
                         <input
                           type="date"
                           value={signatureData.date}
                           onChange={(e) => handleSignatureChange(sig.key, 'date', e.target.value)}
                           className="flex-1 px-3 py-2 text-sm sm:text-base border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                         />
                         <button
                           type="button"
                           onClick={() => {
                             const now = new Date();
                             const currentDate = now.toISOString().split('T')[0];
                             const currentTime = now.toLocaleTimeString('en-IN', { 
                               timeZone: 'Asia/Kolkata',
                               hour12: false,
                               hour: '2-digit',
                               minute: '2-digit',
                               second: '2-digit'
                             });
                             const currentDateTime = `${currentDate} ${currentTime} IST`;
                             handleSignatureChange(sig.key, 'date', currentDateTime);
                           }}
                           className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors text-sm"
                           title="Set current date and time"
                         >
                           🕐 Now
                         </button>
                       </div>
                       <p className="text-xs text-gray-500 mt-1">Format: YYYY-MM-DD HH:MM:SS IST</p>
                     </div>
                   </div>
                 </div>
               );
             })}
             </div>
           </div>

                                {/* Submit Message */}
           {submitMessage && (
             <div className={`p-4 rounded-lg text-center ${
               submitMessage.includes('Error') 
                 ? 'bg-red-100 text-red-700 border border-red-300' 
                 : 'bg-green-100 text-green-700 border border-green-300'
             }`}>
               {submitMessage}
             </div>
           )}

          {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3 sm:space-x-4 pt-6">
            <button
              type="submit"
                disabled={isSubmitting}
                className={`px-6 sm:px-8 py-3 rounded-lg transition-colors text-sm sm:text-base font-medium ${
                  isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-green-600 text-white hover:bg-green-700'
                }`}
              >
                {isSubmitting ? 'Saving...' : 'Submit Form'}
            </button>
            <button
              type="button"
              onClick={handlePrint}
                disabled={isSubmitting}
                className={`px-6 sm:px-8 py-3 rounded-lg transition-colors text-sm sm:text-base font-medium ${
                  isSubmitting
                    ? 'bg-gray-400 text-white cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
            >
              Print Checklist
            </button>
            <button
              type="button"
                 onClick={() => {
                   window.location.reload();
                   generateCodeNo();
                 }}
                 disabled={isSubmitting}
                 className={`px-6 sm:px-8 py-3 rounded-lg transition-colors text-sm sm:text-base font-medium ${
                   isSubmitting
                     ? 'bg-gray-400 text-white cursor-not-allowed'
                     : 'bg-gray-600 text-white hover:bg-gray-700'
                 }`}
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>

      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Camera Access</h3>
              <p className="text-sm text-gray-600 mt-2">
                Camera functionality requires device camera access. Please use the upload option or ensure camera permissions are granted.
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={closeCamera}
                className="flex-1 py-3 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Close
              </button>
              <label className="flex-1 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                Use Camera
              </label>
               {vehicleImages.length < 15 && (
                 <label className="flex-1 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-center cursor-pointer">
                   <input
                     type="file"
                     accept="image/*"
                     multiple
                     onChange={handleImageUpload}
                     className="hidden"
                   />
                   Upload Photos
                 </label>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .bg-gray-50 { background-color: white !important; }
          .shadow-lg { box-shadow: none !important; }
          .rounded-lg { border-radius: 0 !important; }
          .p-4 { padding: 0 !important; }
          .p-6 { padding: 1rem !important; }
          button { display: none !important; }
          input { border: 1px solid #ccc !important; }
        }
      `}</style>
    </div>
  );
}
