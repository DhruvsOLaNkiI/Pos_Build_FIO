import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/useToast';
import { ArrowLeft, ImagePlus, Plus, Search, Trash2, PackageCheck, X } from 'lucide-react';
import API from '@/services/api';

const CreateProduct = () => {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [units, setUnits] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [destinationWarehouseId, setDestinationWarehouseId] = useState('');

    // Inventory Autofill State
    const [inventoryItems, setInventoryItems] = useState([]);
    const [inventorySearch, setInventorySearch] = useState('');
    const [showInventoryDropdown, setShowInventoryDropdown] = useState(false);
    const [selectedInventoryId, setSelectedInventoryId] = useState(null);

    // Core Product Details
    const [productType, setProductType] = useState('Single'); // 'Single' or 'Variable'
    // Multiple images
    const [imageFiles, setImageFiles] = useState([]);      // File objects
    const [imagePreviews, setImagePreviews] = useState([]); // Object URLs

    // Shared Details
    const [sharedData, setSharedData] = useState({
        name: '',
        category: '',
        brand: '',
        unit: '',
        warranty: '',
        manufacturer: '',
        manufacturedDate: '',
        expiryDate: '',
    });

    // Single Product Specifics
    const [singleData, setSingleData] = useState({
        purchasePrice: '',
        sellingPrice: '',
        stockQty: '0',
        minStockLevel: '10',
        barcode: '',
    });

    // Variable Product specifics
    const [variants, setVariants] = useState([]);
    const [existingVariants, setExistingVariants] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [unitsRes, invRes, warehouseRes] = await Promise.all([
                    API.get('/units'),
                    API.get('/inventory'),
                    API.get('/warehouses')
                ]);
                setUnits(unitsRes.data.data || []);
                setInventoryItems(invRes.data.data || []);
                const activeWarehouses = (warehouseRes.data.data || []).filter(w => w.isActive !== false);
                setWarehouses(activeWarehouses);
                const defaultWh = activeWarehouses.find(w => w.isDefault);
                if (defaultWh) setDestinationWarehouseId(defaultWh._id);
                else if (activeWarehouses.length > 0) setDestinationWarehouseId(activeWarehouses[0]._id);
            } catch (error) {
                console.error("Failed to fetch initial data");
            }
        };
        fetchInitialData();
    }, []);

    // Auto-fetch existing variants when product name changes in Variable mode
    useEffect(() => {
        const fetchExistingVariants = async () => {
            if (productType === 'Variable' && sharedData.name.trim().length > 1) {
                try {
                    const res = await API.get('/products');
                    const allProducts = res.data.data || [];
                    const matching = allProducts.filter(
                        p => p.name.trim().toLowerCase() === sharedData.name.trim().toLowerCase()
                    );
                    setExistingVariants(matching);
                } catch (err) {
                    console.error('Failed to fetch existing variants', err);
                }
            } else {
                setExistingVariants([]);
            }
        };
        const debounce = setTimeout(fetchExistingVariants, 400);
        return () => clearTimeout(debounce);
    }, [sharedData.name, productType]);

    const filteredInventory = inventorySearch ? inventoryItems.filter(item =>
        item.name.toLowerCase().includes(inventorySearch.toLowerCase()) ||
        (item.brand && item.brand.toLowerCase().includes(inventorySearch.toLowerCase()))
    ) : [];

    const handleInventorySelect = (item) => {
        setSharedData(prev => ({
            ...prev,
            name: item.name,
            category: item.category,
            brand: item.brand || '',
            unit: item.unit?._id || item.unit || prev.unit,
            expiryDate: item.expiryDate ? new Date(item.expiryDate).toISOString().split('T')[0] : prev.expiryDate,
        }));

        if (productType === 'Single') {
            setSingleData(prev => ({
                ...prev,
                purchasePrice: item.purchasePrice || prev.purchasePrice,
                sellingPrice: item.sellingPrice || prev.sellingPrice,
            }));
        }

        setSelectedInventoryId(item._id);
        setInventorySearch('');
        setShowInventoryDropdown(false);
        toast({ title: 'Autofilled', description: `Filled details from ${item.name}` });
    };

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);
        const remaining = 5 - imageFiles.length;
        const toAdd = files.slice(0, remaining);
        setImageFiles(prev => [...prev, ...toAdd]);
        setImagePreviews(prev => [...prev, ...toAdd.map(f => URL.createObjectURL(f))]);
        // Reset input so same file can be re-added after removal
        e.target.value = '';
    };

    const removeImage = (index) => {
        setImageFiles(prev => prev.filter((_, i) => i !== index));
        setImagePreviews(prev => prev.filter((_, i) => i !== index));
    };

    const addVariantRow = () => {
        setVariants([...variants, {
            variant: '',
            unit: sharedData.unit || '', // default to product-level unit
            purchasePrice: '',
            sellingPrice: '',
            stockQty: '0',
            minStockLevel: '10',
            barcode: '',
            id: Date.now() // temporary ID for React key
        }]);
    };

    const removeVariantRow = (id) => {
        setVariants(variants.filter(v => v.id !== id));
    };

    const updateVariant = (id, field, value) => {
        setVariants(variants.map(v =>
            v.id === id ? { ...v, [field]: value } : v
        ));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            // Validation
            if (!sharedData.name || !sharedData.category) {
                return toast({ title: 'Validation Error', description: 'Name and Category are required.', variant: 'destructive' });
            }

            if (productType === 'Variable' && variants.length === 0 && existingVariants.length === 0) {
                return toast({ title: 'Validation Error', description: 'Variable products must have at least one variant.', variant: 'destructive' });
            }

            // To support Multer array upload, we use FormData
            const createFormData = (productData) => {
                const fd = new FormData();
                Object.keys(productData).forEach(key => {
                    if (productData[key] !== undefined && productData[key] !== '') {
                        fd.append(key, productData[key]);
                    }
                });
                // Append all images
                imageFiles.forEach(file => fd.append('images', file));
                if (selectedInventoryId) {
                    fd.append('inventoryItemId', selectedInventoryId);
                }
                if (destinationWarehouseId) {
                    fd.append('destinationWarehouseId', destinationWarehouseId);
                }
                return fd;
            };

            if (productType === 'Single') {
                const payload = { ...sharedData, ...singleData, productType: 'Single' };
                await API.post('/products', createFormData(payload));
                toast({ title: 'Success', description: 'Product Created!' });
                navigate('/products');
            } else {
                // If no new variants to add but existing variants exist, just navigate back
                if (variants.length === 0 && existingVariants.length > 0) {
                    toast({ title: 'Info', description: 'No new variants were added. Existing variants are unchanged.' });
                    navigate('/products');
                    return;
                }

                // If it's variable, submit multiple distinct products linked by exactly the same Name
                // We will send requests in parallel
                const promises = variants.map(v => {
                    const payload = {
                        ...sharedData,
                        productType: 'Variable',
                        variant: v.variant,
                        unit: v.unit || sharedData.unit || undefined,
                        purchasePrice: v.purchasePrice,
                        sellingPrice: v.sellingPrice,
                        stockQty: v.stockQty,
                        minStockLevel: v.minStockLevel,
                        barcode: v.barcode
                    };
                    return API.post('/products', createFormData(payload));
                });

                await Promise.all(promises);
                toast({ title: 'Success', description: `${variants.length} New Variant(s) Added!` });
                navigate('/products');
            }

        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to create product',
                variant: 'destructive',
            });
        }
    };

    return (
        <div className="space-y-6 animate-fade-in max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4">
                <Button variant="ghost" size="icon" onClick={() => navigate('/products')} className="h-8 w-8">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create Product</h1>
                    <p className="text-muted-foreground mt-1">Add a new item to your inventory</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8">
                {/* Top Section: Shared Info & Images */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Basic Info */}
                    <div className="md:col-span-2 space-y-6">
                        {/* Auto-fill from Inventory */}
                        <div className="bg-card p-6 rounded-xl border border-border space-y-4">
                            <h2 className="text-lg font-semibold flex items-center gap-2">
                                <Search className="w-5 h-5 text-muted-foreground" />
                                Link Warehouse Item (Optional)
                            </h2>
                            <p className="text-sm text-muted-foreground">Search and select an item from your warehouse to automatically fill the details below and link the stock.</p>

                            <div className="relative">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search warehouse inventory by name or brand..."
                                    className="pl-9"
                                    value={inventorySearch}
                                    onChange={(e) => {
                                        setInventorySearch(e.target.value);
                                        setShowInventoryDropdown(true);
                                    }}
                                    onFocus={() => setShowInventoryDropdown(true)}
                                    onBlur={() => setTimeout(() => setShowInventoryDropdown(false), 200)}
                                />
                                {showInventoryDropdown && inventorySearch && filteredInventory.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-popover border border-border rounded-md shadow-md max-h-60 overflow-y-auto z-50">
                                        {filteredInventory.map(item => (
                                            <div
                                                key={item._id}
                                                className="px-4 py-2 hover:bg-muted cursor-pointer flex justify-between items-center"
                                                onClick={() => handleInventorySelect(item)}
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">{item.name}</p>
                                                    <p className="text-xs text-muted-foreground">{item.category} • {item.brand || 'No Brand'}</p>
                                                </div>
                                                <div className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded">
                                                    ₹{item.purchasePrice}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-card p-6 rounded-xl border border-border space-y-4">
                            <h2 className="text-lg font-semibold border-b border-border pb-2">Basic Information</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2 col-span-2">
                                    <Label>Product Name *</Label>
                                    <Input required value={sharedData.name} onChange={(e) => setSharedData({ ...sharedData, name: e.target.value })} placeholder="e.g. Nike Air Max" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Category *</Label>
                                    <select
                                        required
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={sharedData.category}
                                        onChange={(e) => setSharedData({ ...sharedData, category: e.target.value })}
                                    >
                                        <option value="" disabled>Select Category</option>
                                        <option value="Electronics">Electronics</option>
                                        <option value="Clothing">Clothing</option>
                                        <option value="Groceries">Groceries</option>
                                        <option value="Furniture">Furniture</option>
                                        <option value="Toys">Toys</option>
                                        <option value="Beauty">Beauty</option>
                                        <option value="Sports">Sports</option>
                                        <option value="Automotive">Automotive</option>
                                        <option value="Books">Books</option>
                                        <option value="Other">Other</option>
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label>Brand</Label>
                                    <Input value={sharedData.brand} onChange={(e) => setSharedData({ ...sharedData, brand: e.target.value })} placeholder="e.g. Nike" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Unit Selection</Label>
                                    <select
                                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                                        value={sharedData.unit}
                                        onChange={(e) => setSharedData({ ...sharedData, unit: e.target.value })}
                                    >
                                        <option value="" disabled>Select Unit</option>
                                        {units.map(u => (
                                            <option key={u._id} value={u._id}>{u.name} ({u.shortName})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Image Upload - Multiple */}
                    <div className="bg-card p-6 rounded-xl border border-border space-y-4 flex flex-col">
                        <h2 className="text-lg font-semibold border-b border-border pb-2">Product Images</h2>
                        <p className="text-xs text-muted-foreground">Upload up to 5 photos. First image is primary.</p>

                        {/* Previews */}
                        {imagePreviews.length > 0 && (
                            <div className="grid grid-cols-2 gap-2">
                                {imagePreviews.map((src, idx) => (
                                    <div key={idx} className="relative group rounded-lg overflow-hidden border border-border aspect-square">
                                        <img src={src} alt={`preview-${idx}`} className="w-full h-full object-cover" />
                                        <button
                                            type="button"
                                            onClick={() => removeImage(idx)}
                                            className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="w-3 h-3" />
                                        </button>
                                        {idx === 0 && (
                                            <span className="absolute bottom-1 left-1 bg-primary text-primary-foreground text-[9px] px-1.5 py-0.5 rounded font-bold">PRIMARY</span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Upload Button */}
                        {imagePreviews.length < 5 && (
                            <div className="flex-1 border-2 border-dashed border-border rounded-xl flex flex-col items-center justify-center p-4 text-center hover:bg-muted/50 transition-colors relative min-h-[100px]">
                                <ImagePlus className="w-8 h-8 text-muted-foreground mb-2" />
                                <p className="text-xs font-medium">Click to add photos</p>
                                <p className="text-xs text-muted-foreground mt-0.5">{5 - imagePreviews.length} remaining</p>
                                <input
                                    type="file"
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    accept="image/jpeg, image/png, image/webp"
                                    multiple
                                    onChange={handleImageChange}
                                />
                            </div>
                        )}
                    </div>
                </div>

                {/* Custom Fields (Warranty, Manufacturer, Expiry, Mfg Date) */}
                <div className="bg-card p-6 rounded-xl border border-border space-y-4">
                    <h2 className="text-lg font-semibold border-b border-border pb-2">Custom Fields</h2>

                    {/* Warehouse Assignment */}
                    <div className="space-y-2">
                        <Label>Assign Initial Stock to Warehouse</Label>
                        <select
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            value={destinationWarehouseId}
                            onChange={(e) => setDestinationWarehouseId(e.target.value)}
                        >
                            <option value="">No Warehouse Assignment</option>
                            {warehouses.map(w => (
                                <option key={w._id} value={w._id}>{w.name}{w.isDefault ? ' (Default)' : ''}</option>
                            ))}
                        </select>
                        <p className="text-xs text-muted-foreground">The initial stock quantity will be assigned to this warehouse's inventory.</p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Warranty</Label>
                            <Input
                                value={sharedData.warranty}
                                onChange={(e) => setSharedData({ ...sharedData, warranty: e.target.value })}
                                placeholder="e.g. 1 Year, 6 Months"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Manufacturer</Label>
                            <Input
                                value={sharedData.manufacturer}
                                onChange={(e) => setSharedData({ ...sharedData, manufacturer: e.target.value })}
                                placeholder="Enter manufacturer name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Manufactured Date</Label>
                            <Input
                                type="date"
                                className="w-full text-foreground bg-background"
                                value={sharedData.manufacturedDate}
                                onChange={(e) => setSharedData({ ...sharedData, manufacturedDate: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Expiry On</Label>
                            <Input
                                type="date"
                                className="w-full text-foreground bg-background"
                                value={sharedData.expiryDate}
                                onChange={(e) => setSharedData({ ...sharedData, expiryDate: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {/* Type Selection & Pricing */}
                <div className="bg-card p-6 rounded-xl border border-border space-y-6">
                    <div className="flex items-center justify-between border-b border-border pb-4">
                        <h2 className="text-lg font-semibold">Pricing & Stocks</h2>
                        <div className="flex items-center gap-4 bg-muted/50 p-1.5 rounded-lg border border-border">
                            <button
                                type="button"
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${productType === 'Single' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setProductType('Single')}
                            >
                                Single Product
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${productType === 'Variable' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                                onClick={() => setProductType('Variable')}
                            >
                                Variable Product
                            </button>
                        </div>
                    </div>

                    {productType === 'Single' ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-2">
                                <Label>Purchase Price (₹) *</Label>
                                <Input required type="number" step="0.01" value={singleData.purchasePrice} onChange={(e) => setSingleData({ ...singleData, purchasePrice: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Selling Price (₹) *</Label>
                                <Input required type="number" step="0.01" value={singleData.sellingPrice} onChange={(e) => setSingleData({ ...singleData, sellingPrice: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Initial Stock Qty</Label>
                                <Input required type="number" value={singleData.stockQty} onChange={(e) => setSingleData({ ...singleData, stockQty: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Min Stock Alert</Label>
                                <Input type="number" value={singleData.minStockLevel} onChange={(e) => setSingleData({ ...singleData, minStockLevel: e.target.value })} />
                            </div>
                            <div className="space-y-2 md:col-span-2">
                                <Label>Barcode / SKU</Label>
                                <Input value={singleData.barcode} onChange={(e) => setSingleData({ ...singleData, barcode: e.target.value })} placeholder="Scan or type barcode" />
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <p className="text-sm text-muted-foreground">Add multiple variations for this product (e.g. Size, Color, Flavor).</p>

                            {/* Existing Variants Section */}
                            {existingVariants.length > 0 && (
                                <div className="border border-green-500/30 rounded-lg overflow-hidden bg-green-500/5">
                                    <div className="flex items-center gap-2 px-4 py-2.5 bg-green-500/10 border-b border-green-500/20">
                                        <PackageCheck className="h-4 w-4 text-green-600" />
                                        <span className="text-sm font-semibold text-green-700">Existing Variants ({existingVariants.length})</span>
                                    </div>
                                    <Table>
                                        <TableHeader className="bg-green-500/5">
                                            <TableRow>
                                                <TableHead>Variant</TableHead>
                                                <TableHead>Unit</TableHead>
                                                <TableHead>Purch. Price</TableHead>
                                                <TableHead>Sell Price</TableHead>
                                                <TableHead>Stock</TableHead>
                                                <TableHead>Barcode</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {existingVariants.map((ev) => (
                                                <TableRow key={ev._id} className="opacity-80">
                                                    <TableCell className="font-medium">
                                                        <span className="px-2 py-0.5 text-xs rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20 font-semibold">
                                                            {ev.variant || 'Default'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>
                                                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                                                            {ev.unit?.shortName || units.find(u => u._id === sharedData.unit)?.shortName || 'Pc'}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell>₹{ev.purchasePrice}</TableCell>
                                                    <TableCell>₹{ev.sellingPrice}</TableCell>
                                                    <TableCell>{ev.stockQty}</TableCell>
                                                    <TableCell className="font-mono text-xs text-muted-foreground">{ev.barcode || '—'}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            )}

                            {/* New Variants Section */}
                            {existingVariants.length > 0 && (
                                <div className="flex items-center gap-2 pt-2">
                                    <div className="h-px flex-1 bg-border"></div>
                                    <span className="text-xs font-semibold text-muted-foreground uppercase">Add New Variants Below</span>
                                    <div className="h-px flex-1 bg-border"></div>
                                </div>
                            )}

                            <div className="border border-border rounded-lg overflow-hidden">
                                <Table>
                                    <TableHeader className="bg-muted/50">
                                        <TableRow>
                                            <TableHead>Variant Name *</TableHead>
                                            <TableHead>Weight/Qty</TableHead>
                                            <TableHead>Purch. Price *</TableHead>
                                            <TableHead>Sell Price *</TableHead>
                                            <TableHead>Stock</TableHead>
                                            <TableHead>Alert At</TableHead>
                                            <TableHead>SKU/Barcode</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {variants.map((v) => (
                                            <TableRow key={v.id}>
                                                <TableCell className="p-2"><Input required placeholder="e.g. 500g, 1Kg" value={v.variant} onChange={e => updateVariant(v.id, 'variant', e.target.value)} /></TableCell>
                                                <TableCell className="p-2">
                                                    <select
                                                        className="flex h-9 w-full rounded-md border border-input bg-background px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-ring min-w-[70px]"
                                                        value={v.unit || ''}
                                                        onChange={e => updateVariant(v.id, 'unit', e.target.value)}
                                                    >
                                                        <option value="">Unit</option>
                                                        {units.map(u => (
                                                            <option key={u._id} value={u._id}>{u.shortName}</option>
                                                        ))}
                                                    </select>
                                                </TableCell>
                                                <TableCell className="p-2"><Input required type="number" step="0.01" value={v.purchasePrice} onChange={e => updateVariant(v.id, 'purchasePrice', e.target.value)} /></TableCell>
                                                <TableCell className="p-2"><Input required type="number" step="0.01" value={v.sellingPrice} onChange={e => updateVariant(v.id, 'sellingPrice', e.target.value)} /></TableCell>
                                                <TableCell className="p-2"><Input required type="number" value={v.stockQty} onChange={e => updateVariant(v.id, 'stockQty', e.target.value)} /></TableCell>
                                                <TableCell className="p-2"><Input type="number" value={v.minStockLevel} onChange={e => updateVariant(v.id, 'minStockLevel', e.target.value)} /></TableCell>
                                                <TableCell className="p-2"><Input value={v.barcode} onChange={e => updateVariant(v.id, 'barcode', e.target.value)} /></TableCell>
                                                <TableCell className="p-2 text-center">
                                                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeVariantRow(v.id)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                        <TableRow>
                                            <TableCell colSpan={8} className="p-2 text-center">
                                                <Button type="button" variant="outline" className="w-full border-dashed gap-2" onClick={addVariantRow}>
                                                    <Plus className="h-4 w-4" /> Add New Variant Row
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end gap-4">
                    <Button type="button" variant="outline" size="lg" onClick={() => navigate('/products')}>Cancel</Button>
                    <Button type="submit" size="lg" className="px-8">Save Product</Button>
                </div>
            </form >
        </div >
    );
};

export default CreateProduct;
