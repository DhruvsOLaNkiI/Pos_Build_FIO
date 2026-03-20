import React, { useState, useEffect } from 'react';
import { MapPin, X, Navigation, Store as StoreIcon, Loader2, Check } from 'lucide-react';
import API from '../services/api';

const LocationPickerModal = ({ isOpen, onClose, onLocationSelect }) => {
    const [pincode, setPincode] = useState('');
    const [error, setError] = useState('');
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);

    useEffect(() => {
        const savedLocation = localStorage.getItem('customer_pincode');
        if (savedLocation) {
            setPincode(savedLocation);
        }
    }, []);

    useEffect(() => {
        if (!isOpen) {
            setStores([]);
            setConfirmed(false);
            setLoading(false);
        }
    }, [isOpen]);

    const fetchNearbyStores = async (code) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await API.get(`/stores/nearby?pincode=${code}`);
            if (data.success && data.data.length > 0) {
                setStores(data.data.map(s => s.store));
                setConfirmed(true);
            } else {
                setStores([]);
                setError('No stores found near this pincode');
            }
        } catch (err) {
            console.error('Failed to fetch nearby stores:', err);
            setStores([]);
            setError('Failed to find stores. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!pincode || pincode.length < 5) {
            setError('Please enter a valid pincode');
            return;
        }

        localStorage.setItem('customer_pincode', pincode);
        fetchNearbyStores(pincode);
    };

    const handleConfirmStore = (store) => {
        // Save selected store info
        localStorage.setItem('customer_store_name', store.name);
        localStorage.setItem('customer_store_id', store._id);
        onLocationSelect(pincode);
        onClose();
    };

    const handleConfirmAll = () => {
        if (stores.length > 0) {
            localStorage.setItem('customer_store_name', stores.map(s => s.name).join(' · '));
        }
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
                        {confirmed ? 'STORES NEARBY' : 'Enter Delivery Location'}
                    </h3>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    {!confirmed ? (
                        <>
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
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            FINDING STORES...
                                        </>
                                    ) : (
                                        'FIND STORES'
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-bold text-gray-500 mb-4 italic">
                                {stores.length} store{stores.length > 1 ? 's' : ''} found near <span className="text-blue-600 font-black">{pincode}</span>
                            </p>

                            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                                {stores.map((store) => (
                                    <button
                                        key={store._id}
                                        onClick={() => handleConfirmStore(store)}
                                        className="w-full flex items-center gap-3 p-3 bg-gray-50 hover:bg-blue-50 rounded-xl transition-colors text-left group"
                                    >
                                        <div className="bg-blue-100 group-hover:bg-blue-200 rounded-full p-2 transition-colors">
                                            <StoreIcon className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-black text-sm text-gray-900 uppercase">{store.name}</p>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                {store.code} {store.address ? `· ${store.address}` : ''}
                                            </p>
                                        </div>
                                        <Check className="w-4 h-4 text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={handleConfirmAll}
                                className="w-full bg-blue-600 text-white font-black uppercase tracking-widest py-3.5 rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all"
                            >
                                BROWSE ALL {stores.length} STORES
                            </button>

                            <button
                                onClick={() => {
                                    setConfirmed(false);
                                    setStores([]);
                                }}
                                className="w-full text-gray-400 font-bold text-xs uppercase tracking-wider mt-3 hover:text-gray-600 transition-colors"
                            >
                                Change Pincode
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationPickerModal;
