import { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Crosshair, Search, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MapLocationPicker = ({ latitude, longitude, onLocationChange, label = 'Store Location' }) => {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searching, setSearching] = useState(false);

    const defaultLat = latitude || 19.076;
    const defaultLng = longitude || 72.877;

    const reverseGeocode = useCallback(async (lat, lng) => {
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
            const data = await resp.json();
            if (data.display_name) setAddress(data.display_name);
        } catch (err) {
            console.error('Reverse geocoding failed', err);
        }
    }, []);

    const searchPlace = async () => {
        if (!searchQuery.trim()) return;
        setSearching(true);
        try {
            const resp = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
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
            () => setLoading(false),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const updateMapPosition = (lat, lng) => {
        if (mapInstanceRef.current && markerRef.current) {
            mapInstanceRef.current.setView([lat, lng], 15);
            markerRef.current.setLatLng([lat, lng]);
        }
    };

    useEffect(() => {
        if (!mapRef.current || mapInstanceRef.current) return;

        const checkLeaflet = () => {
            if (typeof L === 'undefined') {
                setTimeout(checkLeaflet, 200);
                return;
            }

            const map = L.map(mapRef.current).setView([defaultLat, defaultLng], latitude ? 15 : 5);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap'
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

            if (latitude && longitude) reverseGeocode(latitude, longitude);
        };

        checkLeaflet();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="space-y-3">
            <label className="text-xs font-semibold flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {label}
            </label>

            <div className="flex gap-2">
                <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchPlace()}
                    placeholder="Search address or place..."
                    className="flex-1"
                />
                <Button type="button" variant="outline" onClick={searchPlace} disabled={searching}>
                    {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
            </div>

            <Button type="button" variant="outline" size="sm" onClick={getCurrentLocation} disabled={loading}>
                <Crosshair className="w-4 h-4 mr-2" />
                {loading ? 'Getting location...' : 'Use Current GPS Location'}
            </Button>

            <div ref={mapRef} className="w-full h-64 rounded-lg border overflow-hidden z-0" />

            {address && (
                <div className="bg-muted p-3 rounded-lg">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase">Selected Address</p>
                    <p className="text-xs font-medium mt-0.5">{address}</p>
                </div>
            )}

            <p className="text-[10px] text-muted-foreground">
                Lat: {defaultLat.toFixed(6)}, Lng: {defaultLng.toFixed(6)} — Click map or drag pin to adjust
            </p>
        </div>
    );
};

export default MapLocationPicker;
