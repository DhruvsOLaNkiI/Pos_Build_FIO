import { useState } from 'react';
import { User, Wallet, ChevronRight, Package, HeadphonesIcon, Users, MapPin, LogOut, ChevronLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AccountView = ({ onViewHome }) => {
    const { customer, logout } = useAuth();
    const [activeTab, setActiveTab] = useState('orders');

    const tabs = [
        { id: 'orders', label: 'Orders', icon: Package },
        { id: 'support', label: 'Customer Support', icon: HeadphonesIcon },
        { id: 'referrals', label: 'Manage Referrals', icon: Users },
        { id: 'addresses', label: 'Addresses', icon: MapPin },
        { id: 'profile', label: 'Profile', icon: User },
    ];

    const handleLogout = () => {
        logout();
        window.location.href = '/login';
    };

    return (
        <div className="bg-[#f4f6f8] min-h-screen pb-24 pt-6 animate-fade-in">
            <div className="max-w-[1240px] mx-auto px-4 flex flex-col md:flex-row gap-8">
                {/* Sidebar */}
                <div className="w-full md:w-[320px] flex-shrink-0 flex flex-col gap-6">
                    {/* Profile Card */}
                    <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100">
                        <div className="flex items-center gap-5 mb-8">
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-blue-600">
                                <User className="w-8 h-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase">
                                    {customer?.name?.split(' ')[0] || 'GUEST'}
                                </h2>
                                <p className="text-gray-400 text-xs font-bold tracking-widest">{customer?.mobile || 'No Mobile'}</p>
                            </div>
                        </div>

                        <div className="bg-[#f8f9fa] rounded-2xl p-5 border border-gray-100">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2 text-xs font-black text-gray-800 uppercase tracking-tighter">
                                    <Wallet className="w-4 h-4 text-blue-600" />
                                    Gopuff Cash
                                </div>
                                <ChevronRight className="w-4 h-4 text-gray-400" />
                            </div>
                            <div className="flex items-center justify-between mt-6">
                                <div className="text-[11px] text-gray-500 font-bold uppercase tracking-widest">
                                    Balance: <span className="font-black text-gray-900 ml-1">₹0.00</span>
                                </div>
                                <button className="bg-black text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-gray-800 transition-colors uppercase tracking-widest">
                                    Add
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Navigation Links */}
                    <div className="bg-white rounded-[2rem] shadow-sm overflow-hidden py-4 hidden md:block border border-gray-100">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`w-full flex items-center gap-4 px-8 py-5 text-xs font-black transition-all uppercase tracking-widest italic group ${activeTab === tab.id
                                        ? 'bg-blue-50 text-blue-600 border-l-[6px] border-blue-600'
                                        : 'text-gray-500 hover:bg-gray-50 border-l-[6px] border-transparent'
                                    }`}
                            >
                                <tab.icon className={`w-5 h-5 transition-transform ${activeTab === tab.id ? 'scale-110' : 'group-hover:scale-110 opacity-60'}`} />
                                {tab.label}
                            </button>
                        ))}
                        <div className="px-8 py-6 mt-4 border-t border-gray-100">
                            <button
                                onClick={handleLogout}
                                className="w-full text-red-500 font-black text-[10px] border-2 border-red-100 rounded-2xl px-6 py-3 hover:bg-red-50 hover:border-red-200 transition-all uppercase tracking-[0.2em]"
                            >
                                Log Out
                            </button>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-white rounded-[2.5rem] shadow-sm min-h-[600px] flex flex-col border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-100 flex items-center gap-4">
                        <button onClick={onViewHome} className="p-2 hover:bg-gray-100 rounded-full transition-colors md:hidden">
                            <ChevronLeft className="w-6 h-6 text-gray-900" />
                        </button>
                        <h1 className="text-xl font-black italic tracking-tighter text-gray-900 uppercase">
                            {tabs.find(t => t.id === activeTab)?.label}
                        </h1>
                    </div>

                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                        {activeTab === 'orders' ? (
                            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-sm">
                                <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center mb-10 mx-auto relative group">
                                    <Package className="w-10 h-10 text-blue-600 group-hover:scale-110 transition-transform" />
                                    <div className="absolute -top-3 -right-3 bg-red-600 text-white text-[11px] font-black w-7 h-7 rounded-full flex items-center justify-center border-4 border-white shadow-lg">
                                        0
                                    </div>
                                </div>
                                <h3 className="text-2xl font-black italic tracking-tighter text-gray-900 uppercase mb-3">No orders found.</h3>
                                <p className="text-gray-400 font-bold text-sm leading-relaxed mb-10 opacity-80 uppercase tracking-tighter">
                                    Looks like your pantry is empty! Start your first order now.
                                </p>
                                <button
                                    onClick={onViewHome}
                                    className="bg-blue-600 text-white font-black px-10 py-5 rounded-3xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-200 uppercase tracking-widest text-xs active:scale-95"
                                >
                                    Browse Menu
                                </button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center opacity-40">
                                <tab.icon className="w-16 h-16 mb-6" />
                                <p className="font-black italic text-gray-400 uppercase tracking-widest">
                                    {tabs.find(t => t.id === activeTab)?.label} CONTENT IS COMING SOON...
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountView;
