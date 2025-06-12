
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProfileSizeInputProps {
  sizes: number[];
  onChange: (sizes: number[]) => void;
}

export const ProfileSizeInput: React.FC<ProfileSizeInputProps> = ({ sizes, onChange }) => {
  const [inputValue, setInputValue] = useState('');
  const { toast } = useToast();

  const addSize = () => {
    if (!inputValue.trim()) return;

    const newSizes = inputValue
      .split(',')
      .map(s => s.trim())
      .filter(s => s)
      .map(s => parseFloat(s))
      .filter(s => !isNaN(s) && s > 0);

    if (newSizes.length === 0) {
      toast({
        title: "Invalid Input",
        description: "Please enter valid positive numbers separated by commas.",
        variant: "destructive"
      });
      return;
    }

    const uniqueSizes = [...new Set([...sizes, ...newSizes])].sort((a, b) => b - a);
    onChange(uniqueSizes);
    setInputValue('');
    
    toast({
      title: "Sizes Added",
      description: `Added ${newSizes.length} profile size(s).`,
    });
  };

  const removeSize = (sizeToRemove: number) => {
    if (sizes.length <= 1) {
      toast({
        title: "Cannot Remove",
        description: "At least one profile size is required.",
        variant: "destructive"
      });
      return;
    }
    
    const newSizes = sizes.filter(size => size !== sizeToRemove);
    onChange(newSizes);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addSize();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Enter sizes (e.g., 6400, 5600, 4900)"
          className="flex-1 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
        />
        <Button
          onClick={addSize}
          size="sm"
          className="bg-blue-600 hover:bg-blue-700 text-white"
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {sizes.map((size, index) => (
          <Badge
            key={index}
            variant="secondary"
            className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
          >
            {size}mm
            <Button
              onClick={() => removeSize(size)}
              variant="ghost"
              size="sm"
              className="h-auto p-0 ml-1 text-blue-600 hover:text-blue-800 hover:bg-transparent"
            >
              <X className="w-3 h-3" />
            </Button>
          </Badge>
        ))}
      </div>

      <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded">
        <p className="font-medium mb-1">Format:</p>
        <p>Enter multiple sizes separated by commas (e.g., 6400, 5600, 4900)</p>
      </div>
    </div>
  );
};
