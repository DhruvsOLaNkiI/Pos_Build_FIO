import React, { useState, useEffect } from 'react';
import { MapPin, X, Navigation } from 'lucide-react';

const LocationPickerModal = ({ isOpen, onClose, onLocationSelect }) => {
    const [pincode, setPincode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        const savedLocation = localStorage.getItem('customer_pincode');
        if (savedLocation) {
            setPincode(savedLocation);
        }
    }, []);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!pincode || pincode.length < 5) {
            setError('Please enter a valid pincode');
            return;
        }

        // Save to local storage for persistence
        localStorage.setItem('customer_pincode', pincode);
        onLocationSelect(pincode);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                <div className="flex items-center justify-between p-4 border-b border-gray-100">
                    <h3 className="font-black text-lg flex items-center gap-2 uppercase italic tracking-tight">
                        <MapPin className="h-5 w-5 text-blue-600" />
                        Enter Delivery Location
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm font-bold text-gray-500 mb-6 italic">
                        Tell us your pincode to see the fastest delivery options and stores nearby.
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-xs font-black uppercase text-gray-700 mb-2">Pincode</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                                <input
                                    type="text"
                                    value={pincode}
                                    onChange={(e) => {
                                        setPincode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6));
                                        setError('');
                                    }}
                                    placeholder="e.g. 400001"
                                    className="w-full pl-10 pr-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl font-bold focus:bg-white focus:border-blue-500 transition-all outline-none"
                                />
                            </div>
                            {error && <p className="text-red-500 text-xs font-bold mt-2">{error}</p>}
                        </div>

                        <button
                            type="button"
                            className="flex items-center gap-2 text-blue-600 text-sm font-bold hover:text-blue-800 transition-colors"
                        >
                            <Navigation className="h-4 w-4" />
                            Use current location GPS
                        </button>

                        <button
                            type="submit"
                            className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
                        >
                            Confirm Location
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default LocationPickerModal;
