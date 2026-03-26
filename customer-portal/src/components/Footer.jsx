import { Phone, Mail, MapPin, Facebook, Twitter, Instagram, Linkedin } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-slate-900 text-slate-300 py-8 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Company Info */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Customer Portal</h3>
                        <p className="text-sm text-slate-400 mb-4">
                            Your one-stop destination for all your needs. Quality products, fast delivery, and excellent customer service.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                <Facebook className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                <Instagram className="w-5 h-5" />
                            </a>
                            <a href="#" className="text-slate-400 hover:text-white transition-colors">
                                <Linkedin className="w-5 h-5" />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="/" className="text-slate-400 hover:text-white transition-colors">Home</a>
                            </li>
                            <li>
                                <a href="/offers" className="text-slate-400 hover:text-white transition-colors">Offers</a>
                            </li>
                            <li>
                                <a href="/loyalty" className="text-slate-400 hover:text-white transition-colors">My Points</a>
                            </li>
                            <li>
                                <a href="/profile" className="text-slate-400 hover:text-white transition-colors">Profile</a>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div>
                        <h3 className="text-white font-semibold text-lg mb-4">Contact Us</h3>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center space-x-3">
                                <Phone className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-400">+1 (555) 123-4567</span>
                            </li>
                            <li className="flex items-center space-x-3">
                                <Mail className="w-4 h-4 text-slate-400" />
                                <span className="text-slate-400">support@customerportal.com</span>
                            </li>
                            <li className="flex items-start space-x-3">
                                <MapPin className="w-4 h-4 text-slate-400 mt-0.5" />
                                <span className="text-slate-400">123 Business Street, Suite 100, City, State 12345</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="border-t border-slate-800 mt-8 pt-8 text-center">
                    <p className="text-sm text-slate-500">
                        © {currentYear} Customer Portal. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
