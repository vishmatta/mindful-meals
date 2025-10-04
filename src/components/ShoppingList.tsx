import React, { useState, useMemo } from 'react';
import { ShoppingListItem } from '../types';
import { Icon } from './common/Icon';
import { Button } from './common/Button';

interface ShoppingListProps {
    items: ShoppingListItem[];
    onAddItem: (item: Omit<ShoppingListItem, 'id' | 'isGenerated' | 'isChecked' | 'isOptional'>) => void;
    onUpdateItem: (id: string, updates: Partial<Omit<ShoppingListItem, 'id'>>) => void;
    onDeleteItem: (id: string) => void;
    onClearChecked: () => void;
    storeOptions: string[];
}

const StoreSelector: React.FC<{
    value: string;
    onChange: (newValue: string) => void;
    storeOptions: string[];
}> = ({ value, onChange, storeOptions }) => {
    // Ensure "Other" is always an option for the dropdown logic.
    const optionsWithOther = useMemo(() => 
        storeOptions.includes('Other') ? storeOptions : [...storeOptions, 'Other'],
    [storeOptions]);
    
    // A value is considered "custom" if it's not in the predefined list.
    const isCustomValue = !optionsWithOther.includes(value);

    // If the current value is custom, the dropdown should show "Other" as selected.
    const selectValue = isCustomValue ? 'Other' : value;

    const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedStore = e.target.value;
        if (selectedStore !== 'Other') {
            onChange(selectedStore);
        } else {
            // If the current value is not already a custom one, clear it to allow typing a new one.
            // This prevents clearing an existing custom value if the user re-selects 'Other'.
            if (!isCustomValue) {
                onChange('');
            }
        }
    };

    const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value);
    };

    return (
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <select
                value={selectValue}
                onChange={handleSelectChange}
                className="block w-full sm:w-32 rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary"
            >
                {optionsWithOther.map((store) => (
                    <option key={store} value={store}>{store}</option>
                ))}
            </select>
            {selectValue === 'Other' && (
                <input
                    type="text"
                    value={isCustomValue ? value : ''}
                    onChange={handleTextChange}
                    placeholder="Type store name..."
                    className="block w-full sm:w-32 rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                />
            )}
        </div>
    );
};

const NewItemForm: React.FC<{
    onAddItem: ShoppingListProps['onAddItem'];
    closeForm: () => void;
    storeOptions: string[];
}> = ({ onAddItem, closeForm, storeOptions }) => {
    const [name, setName] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [unit, setUnit] = useState('');
    const [store, setStore] = useState('HEB'); // Default store

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) {
            onAddItem({ name, quantity, unit, store });
            closeForm();
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="p-4 bg-background-secondary rounded-lg shadow-sm space-y-3 mb-6">
            <h3 className="font-semibold text-lg font-heading">Add Custom Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ingredient Name"
                    className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                    required
                />
                <input
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value) > 0 ? Number(e.target.value) : 1)}
                    placeholder="Qty"
                    className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                    min="1"
                />
                <input
                    type="text"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    placeholder="Unit (e.g., lbs, oz)"
                    className="block w-full rounded-md border-neutral-medium/30 shadow-sm focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                />
                 <StoreSelector value={store} onChange={setStore} storeOptions={storeOptions} />
            </div>
            <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={closeForm}>Cancel</Button>
                <Button type="submit">Add Item</Button>
            </div>
        </form>
    );
};


export const ShoppingList: React.FC<ShoppingListProps> = ({ items, onAddItem, onUpdateItem, onDeleteItem, onClearChecked, storeOptions }) => {
    const [showForm, setShowForm] = useState(false);

    const groupedItems = useMemo(() => {
        return items.reduce((acc, item) => {
            const storeKey = item.store || 'Uncategorized';
            (acc[storeKey] = acc[storeKey] || []).push(item);
            return acc;
        }, {} as Record<string, ShoppingListItem[]>);
    }, [items]);

    const stores = Object.keys(groupedItems).sort();

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div className="hidden md:block">
                    <h1 className="text-3xl font-bold text-text-primary font-heading">Shopping List</h1>
                    <p className="mt-1 text-text-secondary">Generated from your meal plan, plus your own items.</p>
                </div>
                <div className="flex gap-2 mt-4 sm:mt-0 w-full sm:w-auto justify-end">
                    {items.some(i => i.isChecked) && (
                         <Button onClick={onClearChecked} variant="secondary">
                            <Icon name="trash" className="-ml-1 mr-2 h-5 w-5" />
                            Clear Checked
                        </Button>
                    )}
                    <Button onClick={() => setShowForm(!showForm)}>
                        <Icon name="plus" className="-ml-1 mr-2 h-5 w-5" />
                        Add Item
                    </Button>
                </div>
            </div>
            
            {showForm && <NewItemForm onAddItem={onAddItem} closeForm={() => setShowForm(false)} storeOptions={storeOptions} />}

            {items.length > 0 ? (
                <div className="space-y-6">
                    {stores.map(store => (
                        <div key={store} className="bg-background-secondary rounded-lg shadow-sm">
                            <h2 className="px-6 py-3 text-lg font-semibold bg-background-primary border-b border-neutral-medium/20 rounded-t-lg font-heading">{store}</h2>
                            <ul className="divide-y divide-neutral-medium/20">
                                {groupedItems[store].map((item) => (
                                    <li key={item.id} className="px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                        <div className="flex items-center flex-grow">
                                            <input 
                                                id={`item-${item.id}`} 
                                                type="checkbox" 
                                                checked={item.isChecked}
                                                onChange={() => onUpdateItem(item.id, { isChecked: !item.isChecked })}
                                                className="h-5 w-5 rounded border-neutral-medium/50 text-primary focus:ring-primary cursor-pointer" 
                                            />
                                            <label htmlFor={`item-${item.id}`} className={`ml-3 block text-sm font-medium ${item.isChecked ? 'line-through text-text-secondary/70' : 'text-text-primary'}`}>
                                                {item.name}
                                                {item.isOptional && (
                                                    <span className="ml-2 text-xs font-semibold bg-functional-info/20 text-text-primary py-0.5 px-2 rounded-full align-middle">
                                                        Optional
                                                    </span>
                                                )}
                                                <span className="ml-2 text-text-secondary font-normal">{item.quantity > 0 && `${item.quantity} ${item.unit}`}</span>
                                            </label>
                                        </div>
                                        <div className="flex items-center gap-2 w-full sm:w-auto sm:justify-end">
                                             <StoreSelector
                                                value={item.store}
                                                onChange={(newStore) => onUpdateItem(item.id, { store: newStore })}
                                                storeOptions={storeOptions}
                                            />
                                            <Button variant="secondary" className="p-2" onClick={() => onDeleteItem(item.id)} aria-label="Delete item">
                                                <Icon name="trash" className="w-4 h-4 text-text-secondary" />
                                            </Button>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-background-secondary rounded-lg shadow-sm">
                    <Icon name="list" className="mx-auto w-12 h-12 text-neutral-medium/60" />
                    <h3 className="mt-2 text-lg font-medium text-text-primary font-heading">Your shopping list is empty!</h3>
                    <p className="mt-1 text-sm text-text-secondary">Generate a meal plan or add your own items.</p>
                </div>
            )}
        </div>
    );
};