import React, { useState } from 'react';
import { DietaryPreferences } from '../types';
import { Button } from './common/Button';
import { Icon } from './common/Icon';

interface PreferencesProps {
    preferences: DietaryPreferences;
    onSave: (newPreferences: DietaryPreferences) => void;
}

const Chip: React.FC<{ label: string; onRemove: () => void }> = ({ label, onRemove }) => (
    <span className="inline-flex items-center py-1 pl-3 pr-2 rounded-full text-sm font-medium bg-primary/20 text-primary">
        {label}
        <button onClick={onRemove} className="ml-1 flex-shrink-0 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary/80 hover:bg-primary/30 hover:text-primary focus:outline-none focus:bg-primary focus:text-white">
            <Icon name="x" className="h-3 w-3" />
        </button>
    </span>
);

const ListEditor: React.FC<{ title: string; items: string[]; setItems: (items: string[]) => void; placeholder: string; }> = ({ title, items, setItems, placeholder }) => {
    const [inputValue, setInputValue] = useState('');
    
    const handleAdd = () => {
        if (inputValue && !items.includes(inputValue)) {
            setItems([...items, inputValue]);
            setInputValue('');
        }
    };
    
    const handleRemove = (itemToRemove: string) => {
        setItems(items.filter(item => item !== itemToRemove));
    };

    return (
        <div>
            <label className="block text-sm font-medium text-text-primary">{title}</label>
            <div className="mt-1 flex rounded-md shadow-sm">
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAdd(); } }}
                    placeholder={placeholder}
                    className="flex-1 block w-full min-w-0 rounded-none rounded-l-md border-neutral-medium/30 focus:border-primary focus:ring-primary sm:text-sm bg-background-primary text-text-primary placeholder:text-text-secondary/70"
                />
                <button
                    type="button"
                    onClick={handleAdd}
                    className="-ml-px relative inline-flex items-center space-x-2 px-4 py-2 border border-neutral-medium/30 text-sm font-medium rounded-r-md text-text-secondary bg-background-secondary hover:bg-neutral-light/70 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                >
                    Add
                </button>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
                {items.map(item => <Chip key={item} label={item} onRemove={() => handleRemove(item)} />)}
            </div>
        </div>
    );
};

export const Preferences: React.FC<PreferencesProps> = ({ preferences, onSave }) => {
    const [global, setGlobal] = useState(preferences.globalRestrictions);
    const [weekly, setWeekly] = useState(preferences.weeklyCustomizations);
    const [equipment, setEquipment] = useState(preferences.equipment);
    const [cuisines, setCuisines] = useState(preferences.cuisinePreferences);
    const [stores, setStores] = useState(preferences.shoppingStores);

    const handleSave = () => {
        onSave({ 
            globalRestrictions: global, 
            weeklyCustomizations: weekly, 
            equipment, 
            cuisinePreferences: cuisines,
            shoppingStores: stores,
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <h1 className="text-3xl font-bold text-text-primary font-heading">Settings & Preferences</h1>
            <p className="mt-1 text-text-secondary">Help the app understand your needs better.</p>

            <div className="mt-8 max-w-2xl space-y-8">
                <ListEditor 
                    title="Global Restrictions"
                    items={global}
                    setItems={setGlobal}
                    placeholder="e.g., Peanuts, Dairy"
                />
                <ListEditor 
                    title="Weekly Preferences"
                    items={weekly}
                    setItems={setWeekly}
                    placeholder="e.g., Low carb, More chicken"
                />
                <ListEditor 
                    title="Cuisine Preferences"
                    items={cuisines}
                    setItems={setCuisines}
                    placeholder="e.g., Indian, Mexican, Thai"
                />
                <ListEditor 
                    title="Kitchen Equipment"
                    items={equipment}
                    setItems={setEquipment}
                    placeholder="e.g., Slow Cooker"
                />
                <ListEditor 
                    title="Shopping Stores"
                    items={stores}
                    setItems={setStores}
                    placeholder="e.g., Trader Joe's"
                />
                 <div>
                    <Button onClick={handleSave}>Save Preferences</Button>
                </div>
            </div>
        </div>
    );
};