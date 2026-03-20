import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { Building2, MapPin, Phone, ChevronRight, Loader2, Search, Store } from 'lucide-react';
import { motion } from 'framer-motion';

const CompanySelection = () => {
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        const fetchCompanies = async () => {
            try {
                const { data } = await API.get('/companies');
                if (data.success) {
                    setCompanies(data.data);
                }
            } catch (err) {
                console.error('Failed to fetch companies', err);
                setError('Failed to load companies. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        fetchCompanies();
    }, []);

    const handleSelectCompany = (company) => {
        // Store selected company in localStorage for reference
        localStorage.setItem('selectedCompany', JSON.stringify(company));
        // Navigate to home/products page
        navigate('/');
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        company.address?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Company type badges based on name keywords
    const getCompanyType = (name) => {
        const lowerName = name.toLowerCase();
        if (lowerName.includes('food') || lowerName.includes('restaurant') || lowerName.includes('bite')) return 'Fast Food';
        if (lowerName.includes('med') || lowerName.includes('pharmacy') || lowerName.includes('care')) return 'Medicine';
        if (lowerName.includes('tech') || lowerName.includes('electronic') || lowerName.includes('world')) return 'Electronics';
        return 'Retail';
    };

    const getTypeColor = (type) => {
        switch (type) {
            case 'Fast Food': return 'bg-orange-100 text-orange-700';
            case 'Medicine': return 'bg-blue-100 text-blue-700';
            case 'Electronics': return 'bg-purple-100 text-purple-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin mb-4" />
                <p className="text-gray-500 font-medium">Loading companies...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-red-500 font-medium mb-2">{error}</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="text-blue-600 hover:underline"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50">
            {/* Header */}
            <div className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-white" />
                            </div>
                            <div>
                                <h1 className="text-xl font-bold text-gray-900">Select a Store</h1>
                                <p className="text-xs text-gray-500">Choose a company to start shopping</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Search Bar */}
            <div className="max-w-7xl mx-auto px-4 py-6">
                <div className="relative max-w-md mx-auto">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search companies..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                </div>
            </div>

            {/* Companies Grid */}
            <div className="max-w-7xl mx-auto px-4 pb-12">
                {filteredCompanies.length === 0 ? (
                    <div className="text-center py-12">
                        <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">No companies found</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredCompanies.map((company, index) => {
                            const type = getCompanyType(company.name);
                            return (
                                <motion.div
                                    key={company._id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    onClick={() => handleSelectCompany(company)}
                                    className="group bg-white rounded-3xl shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden border border-gray-100"
                                >
                                    {/* Company Header with Logo Placeholder */}
                                    <div className="relative h-32 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center">
                                        {company.logo ? (
                                            <img
                                                src={company.logo}
                                                alt={company.name}
                                                className="w-20 h-20 object-contain bg-white rounded-2xl p-2 shadow-lg"
                                            />
                                        ) : (
                                            <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center shadow-lg">
                                                <span className="text-2xl font-bold text-blue-600">
                                                    {company.name.charAt(0)}
                                                </span>
                                            </div>
                                        )}
                                        {/* Type Badge */}
                                        <span className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(type)}`}>
                                            {type}
                                        </span>
                                    </div>

                                    {/* Company Info */}
                                    <div className="p-5">
                                        <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                                            {company.name}
                                        </h3>

                                        {/* Stores Count */}
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                                            <Store className="w-4 h-4" />
                                            <span>{company.stores?.length || 0} store{company.stores?.length !== 1 ? 's' : ''}</span>
                                        </div>

                                        {/* Address */}
                                        {company.address && (
                                            <div className="flex items-start gap-2 text-sm text-gray-500 mb-2">
                                                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                                <span className="line-clamp-2">{company.address}</span>
                                            </div>
                                        )}

                                        {/* Phone */}
                                        {company.phone && (
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <Phone className="w-4 h-4" />
                                                <span>{company.phone}</span>
                                            </div>
                                        )}

                                        {/* CTA Button */}
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <button className="w-full flex items-center justify-center gap-2 bg-blue-50 hover:bg-blue-100 text-blue-600 font-semibold py-3 rounded-xl transition-colors group-hover:bg-blue-600 group-hover:text-white">
                                                Shop Now
                                                <ChevronRight className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 py-8">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    <p className="text-sm text-gray-400">
                        Select a store to view products and start shopping
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default CompanySelection;
