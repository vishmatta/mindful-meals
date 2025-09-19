import React, { useState, useMemo, useRef } from 'react';
import { Ingredient, ScannedItem } from '../types';
import { Button } from './common/Button';
import { Icon } from './common/Icon';
import { PANTRY_CATEGORIES } from '../constants';
import { scanReceipt } from '../services/geminiService';
import { Modal } from './common/Modal';

interface PantryProps {
    pantryItems: Ingredient[];
    onAddItem: (item: { name: string, category: string }) => void;
    onDeleteItem: (id: string) => void;
    onToggleStock: (id: string) => void;
    onUpdateItem: (id: string, updates: { name: string; category: string }) => void;
    onBatchUpdate: (items: ScannedItem[]) => void;
}

const fileToGenerativePart = (file: File): Promise<{ base64: string; mimeType: string }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve({ base64, mimeType: file.type });
    };
    reader.readAsDataURL(file);
  });
};


const NewItemForm: React.FC<{ onAddItem: (item: { name: string, category: string }) => void; closeForm: () => void }> = ({ onAddItem, closeForm }) => {
    const [name, setName] = useState('');
    const [category, setCategory] = useState(PANTRY_CATEGORIES[0]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddItem({ name, category });
            setName('');
            setCategory(PANTRY_CATEGORIES[0]);
            closeForm();
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-4 bg-background-secondary rounded-lg space-y-3 mb-6">
            <h3 className="font-semibold text-lg font-heading">Add New Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ingredient Name"
                    className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary"
                >
                    {PANTRY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button>
                <Button type="submit">Add Item</Button>
            </div>
        </form>
    );
};

const EditItemForm: React.FC<{
    item: Ingredient;
    onSave: (updates: { name: string; category: string }) => void;
    onCancel: () => void;
}> = ({ item, onSave, onCancel }) => {
    const [name, setName] = useState(item.name);
    const [category, setCategory] = useState(item.category);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onSave({ name, category });
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full space-y-3">
            <div className="flex flex-col sm:flex-row gap-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ingredient Name"
                    className="flex-grow block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary"
                >
                    {PANTRY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                </select>
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
                <Button type="submit">Save</Button>
            </div>
        </form>
    );
};

const PantryCategory: React.FC<{
    category: string;
    items: Ingredient[];
    onToggleStock: (id: string) => void;
    onDeleteItem: (id: string) => void;
    onUpdateItem: (id: string, updates: { name: string; category: string }) => void;
    editingItemId: string | null;
    setEditingItemId: (id: string | null) => void;
}> = ({ category, items, onToggleStock, onDeleteItem, onUpdateItem, editingItemId, setEditingItemId }) => {
    const [isExpanded, setIsExpanded] = useState(true);

    const sortedItems = useMemo(() => {
        return [...items].sort((a, b) => {
            // Primary sort: unchecked (inStock: false) items first.
            if (a.inStock !== b.inStock) {
                return a.inStock ? 1 : -1;
            }
            // Secondary sort: alphabetical by name.
            return a.name.localeCompare(b.name);
        });
    }, [items]);

    return (
        <div className="bg-background-secondary rounded-lg shadow-sm overflow-hidden">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center px-4 py-3 bg-background-primary border-b border-neutral-medium/20">
                <h3 className="font-semibold text-text-primary font-heading">{category}</h3>
                <Icon name="chevronDown" className={`w-5 h-5 text-text-secondary transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <ul role="list" className="divide-y divide-neutral-medium/20">
                    {sortedItems.length > 0 ? sortedItems.map((item) => (
                        <li key={item.id} className="px-4 py-3 flex items-center justify-between">
                             {editingItemId === item.id ? (
                                <EditItemForm
                                    item={item}
                                    onSave={(updates) => {
                                        onUpdateItem(item.id, updates);
                                        setEditingItemId(null);
                                    }}
                                    onCancel={() => setEditingItemId(null)}
                                />
                            ) : (
                                <>
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id={`pantry-${item.id}`}
                                            checked={item.inStock}
                                            onChange={() => onToggleStock(item.id)}
                                            className="h-5 w-5 rounded border-neutral-medium/50 text-primary focus:ring-primary cursor-pointer"
                                        />
                                        <label htmlFor={`pantry-${item.id}`} className={`ml-3 text-sm font-medium ${item.inStock ? 'text-text-secondary/70' : 'text-text-primary'}`}>
                                            {item.name}
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" className="p-2" onClick={() => setEditingItemId(item.id)}>
                                            <Icon name="edit" className="w-4 h-4 text-text-secondary" />
                                        </Button>
                                        <Button variant="secondary" className="p-2" onClick={() => onDeleteItem(item.id)}>
                                            <Icon name="trash" className="w-4 h-4 text-text-secondary" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </li>
                    )) : (
                        <li className="px-4 py-4 text-center text-sm text-text-secondary italic">
                            No items in this category.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};

const ReviewScannedItemsModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    initialItems: Omit<ScannedItem, 'isChecked'>[];
    onConfirm: (finalItems: ScannedItem[]) => void;
}> = ({ isOpen, onClose, initialItems, onConfirm }) => {
    const [reviewedItems, setReviewedItems] = useState<ScannedItem[]>([]);

    React.useEffect(() => {
        if (initialItems) {
            setReviewedItems(initialItems.map(item => ({ ...item, isChecked: true })));
        }
    }, [initialItems]);

    const handleItemChange = (index: number, field: keyof ScannedItem, value: any) => {
        const newItems = [...reviewedItems];
        (newItems[index] as any)[field] = value;
        setReviewedItems(newItems);
    };
    
    const handleConfirm = () => {
        onConfirm(reviewedItems.filter(item => item.isChecked));
        onClose();
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Review Scanned Items">
            <p className="text-sm text-text-secondary mb-4">Review the items found on your receipt. Uncheck any you don't want to add, and make corrections as needed.</p>
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {reviewedItems.map((item, index) => (
                    <div key={index} className="grid grid-cols-[auto_1fr_1fr] sm:grid-cols-[auto_1fr_1fr_1fr] gap-2 items-center p-2 bg-background-secondary rounded-lg">
                        <input
                            type="checkbox"
                            checked={item.isChecked}
                            onChange={(e) => handleItemChange(index, 'isChecked', e.target.checked)}
                            className="h-5 w-5 rounded border-neutral-medium/50 text-primary focus:ring-primary"
                        />
                        <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            className="text-sm rounded-md border-neutral-medium/30 bg-background-primary"
                        />
                        <select
                            value={item.category}
                            onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                            className="text-sm rounded-md border-neutral-medium/30 bg-background-primary"
                        >
                            {PANTRY_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                        <div className="hidden sm:flex items-center gap-1">
                            <input
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleItemChange(index, 'quantity', Number(e.target.value))}
                                className="w-16 text-sm rounded-md border-neutral-medium/30 bg-background-primary"
                            />
                            <input
                                type="text"
                                value={item.unit}
                                onChange={(e) => handleItemChange(index, 'unit', e.target.value)}
                                placeholder="unit"
                                className="w-20 text-sm rounded-md border-neutral-medium/30 bg-background-primary"
                            />
                        </div>
                    </div>
                ))}
            </div>
             <div className="flex justify-end gap-2 pt-6 mt-4 border-t border-neutral-medium/20">
                <Button variant="secondary" onClick={onClose}>Cancel</Button>
                <Button onClick={handleConfirm}>Add Checked Items</Button>
            </div>
        </Modal>
    );
};

export const Pantry: React.FC<PantryProps> = ({ pantryItems, onAddItem, onDeleteItem, onToggleStock, onUpdateItem, onBatchUpdate }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    // State for receipt scanning
    const [isScanning, setIsScanning] = useState(false);
    const [scanError, setScanError] = useState<string | null>(null);
    const [scannedItems, setScannedItems] = useState<Omit<ScannedItem, 'isChecked'>[]>([]);
    const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

    const filteredItems = useMemo(() => {
        if (!searchTerm) {
            return pantryItems;
        }
        return pantryItems.filter(item =>
            item.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [pantryItems, searchTerm]);

    const groupedItems = useMemo(() => {
        return filteredItems.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {} as Record<string, Ingredient[]>);
    }, [filteredItems]);

    const handleScanClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setIsScanning(true);
        setScanError(null);
        
        try {
            const { base64, mimeType } = await fileToGenerativePart(file);
            const result = await scanReceipt(base64, mimeType);
            setScannedItems(result);
            setIsReviewModalOpen(true);
        } catch (err) {
            setScanError(err instanceof Error ? err.message : 'An unknown error occurred.');
        } finally {
            setIsScanning(false);
            // Reset file input value to allow re-uploading the same file
            if(fileInputRef.current) fileInputRef.current.value = "";
        }
    };


    return (
        <div className="p-4 sm:p-6 lg:p-8 relative min-h-screen">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="hidden md:block">
                    <h1 className="text-3xl font-bold text-text-primary font-heading">Digital Pantry</h1>
                    <p className="mt-1 text-text-secondary">Check off what you have at home.</p>
                </div>
                <div className="flex items-center gap-4 mt-4 sm:mt-0 w-full sm:w-auto">
                    <div className="relative flex-grow">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-neutral-medium" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            id="search-pantry"
                            className="block w-full pl-10 pr-3 py-2 border border-neutral-medium/30 rounded-md leading-5 bg-background-primary text-text-primary placeholder:text-text-secondary/70 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm"
                            placeholder="Search items..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Button onClick={() => { setShowForm(true); setEditingItemId(null); }} className="flex-shrink-0">
                        <Icon name="plus" className="-ml-1 mr-2 h-5 w-5" />
                        Add Item
                    </Button>
                </div>
            </div>

            {scanError && (
                <div className="mb-4 p-3 bg-functional-danger/20 text-functional-danger rounded-md text-sm flex justify-between items-center">
                    <span>{scanError}</span>
                    <button onClick={() => setScanError(null)}><Icon name="x" className="w-4 h-4" /></button>
                </div>
            )}
            {showForm && <NewItemForm onAddItem={onAddItem} closeForm={() => setShowForm(false)} />}

            {pantryItems.length > 0 ? (
                filteredItems.length > 0 ? (
                    <div className="space-y-4 pb-24">
                        {PANTRY_CATEGORIES.map(category => {
                            const items = groupedItems[category] || [];
                            if (items.length === 0) return null;
                            return (
                                <PantryCategory
                                    key={category}
                                    category={category}
                                    items={items}
                                    onToggleStock={onToggleStock}
                                    onDeleteItem={onDeleteItem}
                                    onUpdateItem={onUpdateItem}
                                    editingItemId={editingItemId}
                                    setEditingItemId={setEditingItemId}
                                />
                            );
                        })}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-background-secondary rounded-lg shadow-sm">
                        <h3 className="mt-2 text-lg font-medium text-text-primary font-heading">No items found</h3>
                        <p className="mt-1 text-sm text-text-secondary">Try a different search term.</p>
                    </div>
                )
            ) : (
                <div className="text-center py-20 bg-background-secondary rounded-lg shadow-sm">
                    <Icon name="pantry" className="mx-auto w-12 h-12 text-neutral-medium/60" />
                    <h3 className="mt-2 text-lg font-medium text-text-primary font-heading">Your pantry is empty</h3>
                    <p className="mt-1 text-sm text-text-secondary">Add some items to get started!</p>
                </div>
            )}
            
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />

            <button
                onClick={handleScanClick}
                disabled={isScanning}
                className="fixed bottom-24 md:bottom-6 right-6 bg-primary text-white p-4 rounded-full shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary disabled:opacity-50 disabled:cursor-wait"
                aria-label="Scan Receipt"
            >
                {isScanning ? <Icon name="loading" className="w-7 h-7 animate-spin" /> : <Icon name="camera" className="w-7 h-7" />}
            </button>
            
            <ReviewScannedItemsModal 
                isOpen={isReviewModalOpen}
                onClose={() => setIsReviewModalOpen(false)}
                initialItems={scannedItems}
                onConfirm={onBatchUpdate}
            />
        </div>
    );
};