import React, { useState, useEffect } from 'react';
import { MapPin, X, Store as StoreIcon, Loader2, Check } from 'lucide-react';
import API from '../services/api';
import MapLocationPicker from './MapLocationPicker';

const LocationPickerModal = ({ isOpen, onClose, onLocationSelect }) => {
    const [pincode, setPincode] = useState('');
    const [error, setError] = useState('');
    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(false);
    const [confirmed, setConfirmed] = useState(false);
    const [useMap, setUseMap] = useState(false);
    const [gpsLat, setGpsLat] = useState(null);
    const [gpsLng, setGpsLng] = useState(null);
    const [radius, setRadius] = useState(100); // km

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
            setUseMap(false);
        }
    }, [isOpen]);

    const fetchNearbyStores = async (params) => {
        setLoading(true);
        setError('');
        try {
            const { data } = await API.get(`/stores/nearby?${params}`);
            if (data.success && data.data.length > 0) {
                setStores(data.data.map(s => s.store));
                setConfirmed(true);
            } else {
                setStores([]);
                setError(`No stores found within ${radius} km. Try increasing the range.`);
            }
        } catch (err) {
            setStores([]);
            setError(err.response?.data?.message || 'Failed to find stores. Please try again.');
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
        fetchNearbyStores(`pincode=${pincode}&radius=${radius}`);
    };

    const handleMapLocationChange = (lat, lng) => {
        setGpsLat(lat);
        setGpsLng(lng);
    };

    const handleSearchByLocation = () => {
        if (gpsLat && gpsLng) {
            localStorage.setItem('customer_pincode', `${gpsLat.toFixed(4)},${gpsLng.toFixed(4)}`);
            fetchNearbyStores(`lat=${gpsLat}&lng=${gpsLng}&radius=${radius}`);
        }
    };

    const handleConfirmStore = (store) => {
        localStorage.setItem('customer_store_name', store.name);
        localStorage.setItem('customer_store_id', store._id);
        if (gpsLat && gpsLng) {
            localStorage.setItem('customer_lat', gpsLat);
            localStorage.setItem('customer_lng', gpsLng);
        }
        onLocationSelect(gpsLat ? `${gpsLat.toFixed(4)},${gpsLng.toFixed(4)}` : pincode);
        onClose();
    };

    const handleConfirmAll = () => {
        if (stores.length > 0) {
            localStorage.setItem('customer_store_name', stores.map(s => s.name).join(' · '));
        }
        if (gpsLat && gpsLng) {
            localStorage.setItem('customer_lat', gpsLat);
            localStorage.setItem('customer_lng', gpsLng);
        }
        onLocationSelect(gpsLat ? `${gpsLat.toFixed(4)},${gpsLng.toFixed(4)}` : pincode);
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

                <div className="p-6 max-h-[70vh] overflow-y-auto">
                    {!confirmed ? (
                        <>
                            <p className="text-sm font-bold text-gray-500 mb-4 italic">
                                Use GPS for accurate delivery or enter your pincode.
                            </p>

                            {/* Toggle: Map vs Pincode */}
                            <div className="flex gap-2 mb-5">
                                <button
                                    onClick={() => setUseMap(false)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${!useMap
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Pincode
                                </button>
                                <button
                                    onClick={() => setUseMap(true)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${useMap
                                        ? 'bg-blue-600 text-white shadow'
                                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                        }`}
                                >
                                    Map / GPS
                                </button>
                            </div>

                            {/* Radius Selector */}
                            <div className="mb-5 bg-gray-50 rounded-xl p-4 border border-gray-100">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-black text-gray-600 uppercase tracking-wider">Search Range</span>
                                    <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-1 rounded-full">{radius} km</span>
                                </div>
                                <input
                                    type="range"
                                    min="10"
                                    max="200"
                                    step="10"
                                    value={radius}
                                    onChange={(e) => setRadius(parseInt(e.target.value))}
                                    className="w-full accent-blue-600 h-2 rounded-full cursor-pointer"
                                />
                                <div className="flex justify-between mt-1">
                                    <span className="text-[10px] text-gray-400 font-bold">10 km</span>
                                    <span className="text-[10px] text-gray-400 font-bold">200 km</span>
                                </div>
                            </div>

                            {useMap ? (
                                <div className="space-y-3">
                                    <MapLocationPicker
                                        latitude={gpsLat}
                                        longitude={gpsLng}
                                        onLocationChange={handleMapLocationChange}
                                        label="Your Delivery Location"
                                    />
                                    <button
                                        onClick={handleSearchByLocation}
                                        disabled={loading || !gpsLat}
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
                                </div>
                            ) : (
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
                            )}
                        </>
                    ) : (
                        <>
                            <p className="text-sm font-bold text-gray-500 mb-4 italic">
                                {stores.length} store{stores.length > 1 ? 's' : ''} found near you
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
                                            <div className="flex items-center gap-2">
                                                <p className="font-black text-sm text-gray-900 uppercase">{store.name}</p>
                                                {store.distance != null && (
                                                    <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full font-black">{store.distance} km</span>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-bold uppercase">
                                                {store.companyName && <span className="text-blue-500">{store.companyName} · </span>}
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
                                Change Location
                            </button>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LocationPickerModal;
