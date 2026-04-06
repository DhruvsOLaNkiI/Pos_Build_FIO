import { useState, useRef } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Edit2, Trash2, AlertCircle, ChevronDown, ChevronUp, Plus, Image as ImageIcon, Upload } from 'lucide-react';
import API from '@/services/api';
import { useToast } from '@/hooks/useToast';

// API base URL for images (without /api path)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001';

const ProductTable = ({ products, onEdit, onDelete, onAddVariant, selectedIds = [], onSelect, onSelectAll, readOnly = false, onImageUpload }) => {
    const [expandedGroups, setExpandedGroups] = useState({});
    const [uploadingId, setUploadingId] = useState(null);
    const fileInputRef = useRef(null);
    const { toast } = useToast();

    // Group products by name
    const groupedProducts = (() => {
        const groups = {};
        products.forEach(p => {
            const key = p.name.trim().toLowerCase();
            if (!groups[key]) {
                groups[key] = {
                    key,
                    name: p.name,
                    brand: p.brand,
                    category: p.category,
                    items: [],
                    totalStock: 0,
                };
            }
            groups[key].items.push(p);
            groups[key].totalStock += p.stockQty;

            // Handle mixed brands
            if (p.brand && groups[key].brand && groups[key].brand !== p.brand && groups[key].brand !== 'Multiple Brands') {
                groups[key].brand = 'Multiple Brands';
            } else if (!groups[key].brand && p.brand) {
                groups[key].brand = p.brand;
            }
        });
        return Object.values(groups).sort((a, b) => a.name.localeCompare(b.name));
    })();

    const toggleGroup = (key) => {
        setExpandedGroups(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const handleImageUpload = async (productId, file) => {
        if (!file) return;
        
        setUploadingId(productId);
        
        try {
            const formData = new FormData();
            formData.append('image', file);
            
            const response = await API.post(`/products/${productId}/upload-image`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            
            if (response.data.success) {
                toast({
                    title: 'Success',
                    description: 'Image uploaded successfully',
                    variant: 'default'
                });
                onImageUpload?.(productId, response.data.data.imageUrl);
            }
        } catch (error) {
            toast({
                title: 'Error',
                description: error.response?.data?.message || 'Failed to upload image',
                variant: 'destructive'
            });
        } finally {
            setUploadingId(null);
        }
    };

    const triggerFileInput = (productId) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (file) {
                handleImageUpload(productId, file);
            }
        };
        input.click();
    };

    return (
        <div className="rounded-md border border-border bg-card overflow-hidden">
            <Table>
                <TableHeader>
                    <TableRow className="bg-muted">
                        <TableHead className="w-12 text-center">
                            {!readOnly && (
                                <input
                                    type="checkbox"
                                    className="w-4 h-4 cursor-pointer"
                                    checked={products.length > 0 && selectedIds.length === products.length}
                                    onChange={(e) => onSelectAll?.(e.target.checked)}
                                />
                            )}
                        </TableHead>
                        <TableHead className="w-16">Image</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Category</TableHead>
                        <TableHead>Brand</TableHead>
                        <TableHead>Barcode</TableHead>
                        <TableHead>Unit</TableHead>
                        <TableHead className="text-right">Purchase Price</TableHead>
                        <TableHead className="text-right">Selling Price</TableHead>
                        <TableHead className="text-center">Stock</TableHead>
                        {!readOnly && <TableHead className="text-right">Actions</TableHead>}
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {groupedProducts.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={readOnly ? 10 : 11} className="h-24 text-center text-muted-foreground">
                                No products found.
                            </TableCell>
                        </TableRow>
                    ) : (
                        groupedProducts.map((group) => {
                            const isExpanded = expandedGroups[group.key];
                            const hasVariants = group.items.length > 1;

                            if (!hasVariants) {
                                // Render single product normally
                                const product = group.items[0];
                                return (
                                    <TableRow key={product._id} className="hover:bg-muted transition-colors">
                                        <TableCell className="text-center">
                                            {!readOnly && (
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 cursor-pointer"
                                                    checked={selectedIds.includes(product._id)}
                                                    onChange={(e) => onSelect?.(product._id, e.target.checked)}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="relative group">
                                                {product.imageUrl ? (
                                                    <img 
                                                        src={`${API_BASE_URL}${product.imageUrl}`} 
                                                        alt={product.name} 
                                                        className="w-10 h-10 rounded-md object-cover border border-border cursor-pointer hover:opacity-80 transition-opacity"
                                                        onClick={() => triggerFileInput(product._id)}
                                                        title="Click to change image"
                                                    />
                                                ) : (
                                                    <div 
                                                        className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border cursor-pointer hover:bg-muted/80 transition-colors"
                                                        onClick={() => triggerFileInput(product._id)}
                                                        title="Click to upload image"
                                                    >
                                                        {uploadingId === product._id ? (
                                                            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                                                        ) : (
                                                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                        )}
                                                    </div>
                                                )}
                                                <div 
                                                    className="absolute inset-0 bg-black/50 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                                    onClick={() => triggerFileInput(product._id)}
                                                >
                                                    <Upload className="w-4 h-4 text-white" />
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex flex-col gap-1">
                                                <span>{product.name}</span>
                                                {product.variant && (
                                                    <span className="text-[10px] w-fit font-semibold px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                        {product.variant}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="capitalize px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">
                                                {product.category}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            {product.brand ? (
                                                <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-500 font-medium">{product.brand}</span>
                                            ) : (
                                                <span className="text-xs text-muted-foreground">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs font-mono text-muted-foreground">{product.barcode || '—'}</span>
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">{product.unit?.shortName || 'Pc'}</span>
                                        </TableCell>
                                        <TableCell className="text-right">₹{product.purchasePrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-right font-semibold">₹{product.sellingPrice.toFixed(2)}</TableCell>
                                        <TableCell className="text-center">
                                            <div className="flex flex-col items-center justify-center gap-1">
                                                <div className="flex items-center gap-1.5">
                                                    <span className={product.stockQty <= product.minStockLevel ? "text-destructive font-bold" : ""}>
                                                        {product.stockQty}
                                                    </span>
                                                    {product.stockQty <= product.minStockLevel && (
                                                        <AlertCircle className="w-4 h-4 text-destructive" />
                                                    )}
                                                </div>
                                                {product.allocations?.length > 0 && (
                                                    <div className="flex flex-col gap-0.5 mt-0.5">
                                                        {product.allocations.map(alloc => (
                                                            <span key={alloc.warehouseId} className="text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                                                {alloc.warehouseName}: {alloc.stockQty}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </TableCell>
                                        {!readOnly && (
                                            <TableCell className="text-right">
                                                <div className="flex justify-end gap-2">
                                                    {onAddVariant && (
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onAddVariant(product); }} title="Add Variant" className="h-8 w-8 text-purple-500 hover:text-purple-600 hover:bg-purple-500/10">
                                                            <Plus className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                    <Button variant="ghost" size="icon" onClick={() => onEdit?.(product)} className="h-8 w-8 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"><Edit2 className="h-4 w-4" /></Button>
                                                    <Button variant="ghost" size="icon" onClick={() => onDelete?.(product._id)} className="h-8 w-8 text-destructive hover:text-destructive/90 hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                                                </div>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            }

                            return (
                                <>
                                    {/* Parent Group Row */}
                                    <TableRow
                                        key={group.key}
                                        className="hover:bg-muted/50 transition-colors cursor-pointer bg-muted/20"
                                        onClick={() => toggleGroup(group.key)}
                                    >
                                        <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                                            {!readOnly && (
                                                <input
                                                    type="checkbox"
                                                    className="w-4 h-4 cursor-pointer"
                                                    checked={group.items.every(p => selectedIds.includes(p._id))}
                                                    onChange={(e) => {
                                                        const checked = e.target.checked;
                                                        group.items.forEach(p => onSelect?.(p._id, checked));
                                                    }}
                                                />
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {group.items[0]?.imageUrl ? (
                                                <img src={`${API_BASE_URL}${group.items[0].imageUrl}`} alt={group.name} className="w-10 h-10 rounded-md object-cover border border-border" />
                                            ) : (
                                                <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center border border-border">
                                                    <ImageIcon className="w-5 h-5 text-muted-foreground" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            <div className="flex items-center gap-2">
                                                {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                                <span>{group.name}</span>
                                                <span className="text-[10px] font-semibold bg-background px-2 py-0.5 rounded-full border border-border text-muted-foreground">
                                                    {group.items.length} Variants
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <span className="capitalize px-2 py-1 rounded-full text-xs bg-primary/10 text-primary">{group.category}</span>
                                        </TableCell>
                                        <TableCell>
                                            {group.brand ? (
                                                <span className="px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-500 font-medium">{group.brand}</span>
                                            ) : <span className="text-xs text-muted-foreground">—</span>}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-xs italic">
                                            {group.items.every(i => i.barcode === group.items[0]?.barcode) ? (group.items[0]?.barcode || '—') : 'Multiple Barcodes'}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">{group.items[0]?.unit?.shortName || 'Pc'}</span>
                                        </TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs italic">Multiple Fields</TableCell>
                                        <TableCell className="text-right text-muted-foreground text-xs italic">Multiple Fields</TableCell>
                                        <TableCell className="text-center font-bold">{group.totalStock}</TableCell>
                                        {!readOnly && (
                                            <TableCell className="text-right">
                                            {onAddVariant && (
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={(e) => { e.stopPropagation(); onAddVariant(group.items[0]); }}
                                                        className="h-7 text-xs gap-1 border-dashed hover:border-primary hover:text-primary transition-colors"
                                                    >
                                                        <Plus className="h-3 w-3" /> Add Variant
                                                    </Button>
                                                )}
                                            </TableCell>
                                        )}
                                    </TableRow>

                                    {/* Child Variant Rows */}
                                    {isExpanded && group.items.map(product => (
                                        <TableRow key={product._id} className="bg-background hover:bg-muted/30 transition-colors">
                                            <TableCell className="text-center">
                                                {!readOnly && (
                                                    <input
                                                        type="checkbox"
                                                        className="w-4 h-4 cursor-pointer"
                                                        checked={selectedIds.includes(product._id)}
                                                        onChange={(e) => onSelect?.(product._id, e.target.checked)}
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell className="text-muted-foreground opacity-50 text-center">-</TableCell>
                                            <TableCell className="pl-10">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-primary/40 inline-block"></span>
                                                    <span className="text-sm font-medium text-muted-foreground">{product.name}</span>
                                                    <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-purple-500/10 text-purple-500 border border-purple-500/20">
                                                        {product.variant || 'Default'}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground opacity-50 text-center">-</TableCell>
                                            <TableCell className="text-muted-foreground opacity-50 text-center">-</TableCell>
                                            <TableCell>
                                                <span className="text-xs font-mono text-muted-foreground">{product.barcode || '—'}</span>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground opacity-50 text-center">-</TableCell>
                                            <TableCell className="text-right">₹{product.purchasePrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-right font-semibold">₹{product.sellingPrice.toFixed(2)}</TableCell>
                                            <TableCell className="text-center">
                                                <div className="flex flex-col items-center justify-center gap-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className={product.stockQty <= product.minStockLevel ? "text-destructive font-bold" : ""}>
                                                            {product.stockQty}
                                                        </span>
                                                        {product.stockQty <= product.minStockLevel && <AlertCircle className="w-4 h-4 text-destructive" />}
                                                    </div>
                                                    {product.allocations?.length > 0 && (
                                                        <div className="flex flex-col gap-0.5 mt-0.5">
                                                            {product.allocations.map(alloc => (
                                                                <span key={alloc.warehouseId} className="text-[9px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-700 whitespace-nowrap">
                                                                    {alloc.warehouseName}: {alloc.stockQty}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </TableCell>
                                            {!readOnly && (
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit?.(product); }} className="h-7 w-7 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"><Edit2 className="h-3.5 w-3.5" /></Button>
                                                        <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete?.(product._id); }} className="h-7 w-7 text-destructive hover:text-destructive/90 hover:bg-destructive/10"><Trash2 className="h-3.5 w-3.5" /></Button>
                                                    </div>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    ))}
                                </>
                            );
                        })
                    )}
                </TableBody>
            </Table>
        </div>
    );
};

export default ProductTable;
