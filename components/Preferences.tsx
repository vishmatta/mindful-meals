import React from 'react';
import { DietaryPreferences, MealPlanningMode, MealPlanningPreferences } from '../types';
import { Button } from './common/Button';
import { Icon } from './common/Icon';

interface PreferencesProps {
    preferences: DietaryPreferences;
    onSave: (newPreferences: DietaryPreferences) => void;
    theme: 'light' | 'dark';
    onThemeChange: (theme: 'light' | 'dark') => void;
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
    const [inputValue, setInputValue] = React.useState('');
    
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

export const Preferences: React.FC<PreferencesProps> = ({ preferences, onSave, theme, onThemeChange }) => {

    const handleListUpdate = (key: 'globalRestrictions' | 'equipment' | 'cuisinePreferences' | 'shoppingStores', newItems: string[]) => {
        onSave({ ...preferences, [key]: newItems });
    };

    const handleMealPlanningChange = (
        mealType: keyof MealPlanningPreferences,
        field: 'mode' | 'batchMeals',
        value: MealPlanningMode | number
    ) => {
        onSave({
            ...preferences,
            mealPlanning: {
                ...preferences.mealPlanning,
                [mealType]: {
                    ...preferences.mealPlanning[mealType],
                    [field]: value,
                },
            },
        });
    };

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="hidden md:block">
                <h1 className="text-3xl font-bold text-text-primary font-heading">Settings & Preferences</h1>
                <p className="mt-1 text-text-secondary">Help the app understand your needs better.</p>
            </div>


            <div className="mt-8 max-w-2xl mx-auto md:mx-0 space-y-8">
                
                {/* Appearance Section */}
                <div>
                    <h2 className="text-xl font-semibold text-text-primary font-heading">Appearance</h2>
                    <div className="mt-4">
                        <label className="block text-sm font-medium text-text-primary mb-2">Theme</label>
                        <div className="flex rounded-md shadow-sm">
                            <button
                                type="button"
                                onClick={() => onThemeChange('light')}
                                className={`relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${
                                    theme === 'light'
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-background-secondary border-neutral-medium/30 text-text-secondary hover:bg-neutral-light/70'
                                }`}
                            >
                                Light
                            </button>
                            <button
                                type="button"
                                onClick={() => onThemeChange('dark')}
                                className={`-ml-px relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${
                                    theme === 'dark'
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-background-secondary border-neutral-medium/30 text-text-secondary hover:bg-neutral-light/70'
                                }`}
                            >
                                Dark
                            </button>
                        </div>
                    </div>
                </div>

                {/* Meal Planning Style Section */}
                <div className="border-t border-neutral-medium/20 pt-8">
                    <h2 className="text-xl font-semibold text-text-primary font-heading">Meal Planning Style</h2>
                    <p className="mt-1 text-sm text-text-secondary">Choose between daily variety or batch prepping for the week.</p>
                    <div className="mt-4 space-y-8">
                        {(Object.keys(preferences.mealPlanning) as Array<keyof MealPlanningPreferences>).map((mealType) => {
                            const prefs = preferences.mealPlanning[mealType];
                            return (
                                <div key={mealType}>
                                    <label className="block text-base font-medium text-text-primary capitalize">{mealType}</label>
                                    <div className="mt-2 flex rounded-md shadow-sm w-full sm:w-2/3">
                                        <button
                                            type="button"
                                            onClick={() => handleMealPlanningChange(mealType, 'mode', 'variety')}
                                            className={`relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-l-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${
                                                prefs.mode === 'variety'
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'bg-background-secondary border-neutral-medium/30 text-text-secondary hover:bg-neutral-light/70'
                                            }`}
                                        >
                                            Variety
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => handleMealPlanningChange(mealType, 'mode', 'batch')}
                                            className={`-ml-px relative inline-flex items-center justify-center w-1/2 px-4 py-2 rounded-r-md border text-sm font-medium focus:z-10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors ${
                                                prefs.mode === 'batch'
                                                    ? 'bg-primary border-primary text-white'
                                                    : 'bg-background-secondary border-neutral-medium/30 text-text-secondary hover:bg-neutral-light/70'
                                            }`}
                                        >
                                            Batch
                                        </button>
                                    </div>
                                    {prefs.mode === 'batch' && (
                                        <div className="mt-4 pl-1">
                                            <div className="flex items-center space-x-2">
                                                <label htmlFor={`${mealType}-meals`} className="block text-sm font-medium text-text-secondary">
                                                    Number of different meals: <span className="font-semibold text-primary">{prefs.batchMeals}</span>
                                                </label>
                                                <div 
                                                    className="relative flex items-center justify-center h-5 w-5 rounded-full border border-neutral-medium text-neutral-medium text-xs font-semibold cursor-help"
                                                    title="Choose how many different recipes to generate and rotate through for the week. 1 = same meal daily, 2-4 = rotating meals."
                                                >
                                                    ?
                                                </div>
                                            </div>
                                            <input
                                                type="range"
                                                id={`${mealType}-meals`}
                                                min="1"
                                                max="4"
                                                step="1"
                                                value={prefs.batchMeals}
                                                onChange={e => handleMealPlanningChange(mealType, 'batchMeals', Number(e.target.value))}
                                                className="w-full h-2 bg-neutral-light rounded-lg appearance-none cursor-pointer mt-2 accent-primary"
                                            />
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Meal & Shopping Section */}
                <div className="border-t border-neutral-medium/20 pt-8">
                    <h2 className="text-xl font-semibold text-text-primary font-heading">Food & Shopping</h2>
                    <div className="mt-4 space-y-8">
                        <ListEditor 
                            title="Global Restrictions"
                            items={preferences.globalRestrictions}
                            setItems={(newItems) => handleListUpdate('globalRestrictions', newItems)}
                            placeholder="e.g., Peanuts, Dairy"
                        />
                        <ListEditor 
                            title="Cuisine Preferences"
                            items={preferences.cuisinePreferences}
                            setItems={(newItems) => handleListUpdate('cuisinePreferences', newItems)}
                            placeholder="e.g., Indian, Mexican, Thai"
                        />
                        <ListEditor 
                            title="Kitchen Equipment"
                            items={preferences.equipment}
                            setItems={(newItems) => handleListUpdate('equipment', newItems)}
                            placeholder="e.g., Slow Cooker"
                        />
                        <ListEditor 
                            title="Shopping Stores"
                            items={preferences.shoppingStores}
                            setItems={(newItems) => handleListUpdate('shoppingStores', newItems)}
                            placeholder="e.g., Trader Joe's"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};