import React, { useState, useMemo } from 'react';
import { Ingredient } from '../types';
import { Button } from './common/Button';
import { Icon } from './common/Icon';
import { PANTRY_CATEGORIES } from '../constants';

interface PantryProps {
    pantryItems: Ingredient[];
    onAddItem: (item: { name: string, category: string }) => void;
    onDeleteItem: (id: string) => void;
    onToggleStock: (id: string) => void;
    onUpdateItem: (id: string, updates: { name: string; category: string }) => void;
}

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
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-lg space-y-3 mb-6">
            <h3 className="font-semibold text-lg">Add New Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ingredient Name"
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500"
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm bg-white text-gray-900"
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
                    className="flex-grow block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm bg-white text-gray-900 placeholder-gray-500"
                />
                <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full rounded-md border-gray-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 sm:text-sm bg-white text-gray-900"
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

    return (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <button onClick={() => setIsExpanded(!isExpanded)} className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-semibold text-gray-800">{category}</h3>
                <Icon name="chevronDown" className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
            </button>
            {isExpanded && (
                <ul role="list" className="divide-y divide-gray-200">
                    {items.length > 0 ? items.map((item) => (
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
                                            className="h-5 w-5 rounded border-gray-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
                                        />
                                        <label htmlFor={`pantry-${item.id}`} className={`ml-3 text-sm font-medium ${item.inStock ? 'text-gray-900' : 'text-gray-400 line-through'}`}>
                                            {item.name}
                                        </label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="secondary" className="p-2" onClick={() => setEditingItemId(item.id)}>
                                            <Icon name="edit" className="w-4 h-4 text-gray-500" />
                                        </Button>
                                        <Button variant="secondary" className="p-2" onClick={() => onDeleteItem(item.id)}>
                                            <Icon name="trash" className="w-4 h-4 text-gray-500" />
                                        </Button>
                                    </div>
                                </>
                            )}
                        </li>
                    )) : (
                        <li className="px-4 py-4 text-center text-sm text-gray-500 italic">
                            No items in this category.
                        </li>
                    )}
                </ul>
            )}
        </div>
    );
};


export const Pantry: React.FC<PantryProps> = ({ pantryItems, onAddItem, onDeleteItem, onToggleStock, onUpdateItem }) => {
    const [showForm, setShowForm] = useState(false);
    const [editingItemId, setEditingItemId] = useState<string | null>(null);

    const groupedItems = useMemo(() => {
        return pantryItems.reduce((acc, item) => {
            (acc[item.category] = acc[item.category] || []).push(item);
            return acc;
        }, {} as Record<string, Ingredient[]>);
    }, [pantryItems]);


    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Digital Pantry</h1>
                    <p className="mt-1 text-gray-600">Check off what you have at home.</p>
                </div>
                <Button onClick={() => { setShowForm(true); setEditingItemId(null); }} className="mt-4 sm:mt-0">
                    <Icon name="plus" className="-ml-1 mr-2 h-5 w-5" />
                    Add Item
                </Button>
            </div>

            {showForm && <NewItemForm onAddItem={onAddItem} closeForm={() => setShowForm(false)} />}

            {pantryItems.length > 0 ? (
                <div className="space-y-4">
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
                <div className="text-center py-20 bg-white rounded-lg shadow-sm">
                    <Icon name="pantry" className="mx-auto w-12 h-12 text-gray-400" />
                    <h3 className="mt-2 text-lg font-medium text-gray-900">Your pantry is empty</h3>
                    <p className="mt-1 text-sm text-gray-500">Add some items to get started!</p>
                </div>
            )}
        </div>
    );
};