import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Crosshair, Search, Loader2 } from 'lucide-react';

// Leaflet is loaded via CDN in index.html
const MapLocationPicker = ({ latitude, longitude, onLocationChange, label = 'Select Location' }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    const defaultLat = latitude || 19.076; // Mumbai default
    const defaultLng = longitude || 72.877;

    // Reverse geocode coordinates to address
    const reverseGeocode = useCallback(async (lat, lng) => {
        try {
            const resp = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
            );
            const data = await resp.json();
            if (data.display_name) {
                setAddress(data.display_name);
            }
        } catch (err) {
            console.error('Reverse geocoding failed', err);
        }
    }, []);

    // Search for a place by name
    const searchPlace = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const resp = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`
            );
            const data = await resp.json();
            if (data && data.length > 0) {
                const { lat, lon, display_name } = data[0];
                const newLat = parseFloat(lat);
                const newLng = parseFloat(lon);
                updateMapPosition(newLat, newLng);
                setAddress(display_name);
                if (onLocationChange) onLocationChange(newLat, newLng);
            }
        } catch (err) {
            console.error('Search failed', err);
        } finally {
            setSearching(false);
        }
    };

    // Get current GPS location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) return;
        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const lat = pos.coords.latitude;
                const lng = pos.coords.longitude;
                updateMapPosition(lat, lng);
                reverseGeocode(lat, lng);
                if (onLocationChange) onLocationChange(lat, lng);
                setLoading(false);
            },
            () => {
                setLoading(false);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const updateMapPosition = (lat, lng) => {
        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
            markerRef.current.setLatLng([lat, lng]);
        }
    };

    // Initialize map
    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const checkLeaflet = () => {
            if (typeof L === 'undefined') {
                setTimeout(checkLeaflet, 200);
                return;
            }

            const map = L.map(mapRef.current).setView([defaultLat, defaultLng], latitude ? 15 : 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(map);

            const marker = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
            marker.on('dragend', () => {
                const { lat, lng } = marker.getLatLng();
                reverseGeocode(lat, lng);
                if (onLocationChange) onLocationChange(lat, lng);
            });

            map.on('click', (e) => {
                const { lat, lng } = e.latlng;
                marker.setLatLng([lat, lng]);
                reverseGeocode(lat, lng);
                if (onLocationChange) onLocationChange(lat, lng);
            });

            mapInstanceRef.current = map;
            markerRef.current = marker;

            if (latitude && longitude) {
                reverseGeocode(latitude, longitude);
            }
        };

        checkLeaflet();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {label}
            </label>

            {/* Search + GPS */}
            <div className="flex gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && searchPlace()}
                        placeholder="Search address or place..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border-2 border-gray-200 rounded-xl text-sm font-bold focus:border-blue-500 outline-none"
                    />
                </div>
                <button
                    type="button"
                    onClick={searchPlace}
                    disabled={searching}
                    className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                </button>
            </div>

            {/* GPS Button */}
            <button
                type="button"
                onClick={getCurrentLocation}
                disabled={loading}
                className="flex items-center gap-2 text-blue-600 text-xs font-bold hover:text-blue-800 transition-colors disabled:opacity-50"
            >
                <Crosshair className="w-4 h-4" />
                {loading ? 'Getting your location...' : 'Use Current GPS Location'}
            </button>

            {/* Map */}
            <div
                ref={mapRef}
                className="w-full h-64 rounded-xl border-2 border-gray-200 overflow-hidden z-0"
            />

            {/* Address display */}
            {address && (
                <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Selected Address</p>
                    <p className="text-xs font-bold text-gray-700">{address}</p>
                </div>
            )}

            <p className="text-[10px] text-gray-400 font-bold">
                Lat: {defaultLat.toFixed(6)}, Lng: {defaultLng.toFixed(6)} — Click map or drag pin to adjust
            </p>
        </div>
    );
};

export default MapLocationPicker;
