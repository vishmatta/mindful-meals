
import React from 'react';
import { ShoppingListItem } from '../types';
import { Icon } from './common/Icon';

interface ShoppingListProps {
    items: ShoppingListItem[];
    onClear: () => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ items, onClear }) => {
    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Shopping List</h1>
                    <p className="mt-1 text-gray-600">Automatically generated from your meal plan and pantry.</p>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm">
                <ul className="divide-y divide-gray-200">
                    {items.length > 0 ? items.map((item, index) => (
                        <li key={index} className="px-6 py-4 flex items-center justify-between">
                            <div className="flex items-center">
                                <input id={`item-${index}`} type="checkbox" className="h-4 w-4 rounded border-gray-300 text-teal-600 focus:ring-teal-500" />
                                <label htmlFor={`item-${index}`} className="ml-3 block text-sm font-medium text-gray-900">{item.name}</label>
                            </div>
                            <span className="text-sm text-gray-500">{item.quantity} {item.unit}</span>
                        </li>
                    )) : (
                        <div className="text-center py-20">
                            <Icon name="list" className="mx-auto w-12 h-12 text-gray-400" />
                            <h3 className="mt-2 text-lg font-medium text-gray-900">Your shopping list is empty!</h3>
                            <p className="mt-1 text-sm text-gray-500">Generate a meal plan to see what you need.</p>
                        </div>
                    )}
                </ul>
            </div>
        </div>
    );
};
